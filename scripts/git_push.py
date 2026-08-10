#!/usr/bin/env python3
"""
Git push via Smart HTTP protocol using only Python stdlib.
Sends a packfile with all objects needed for the push.
"""
import os
import sys
import struct
import hashlib
import zlib
import urllib.request
import urllib.error

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read_git_object(sha):
    obj_path = os.path.join(REPO_DIR, '.git', 'objects', sha[:2], sha[2:])
    with open(obj_path, 'rb') as f:
        raw = zlib.decompress(f.read())
    header_end = raw.index(b'\0')
    header = raw[:header_end].decode()
    obj_type, size_str = header.split(' ')
    data = raw[header_end + 1:]
    return obj_type, data

def get_ref(ref_name):
    ref_path = os.path.join(REPO_DIR, '.git', ref_name)
    if os.path.exists(ref_path):
        with open(ref_path, 'r') as f:
            content = f.read().strip()
            if content.startswith('ref: '):
                return get_ref(content[5:])
            return content
    # Check packed-refs
    packed_path = os.path.join(REPO_DIR, '.git', 'packed-refs')
    if os.path.exists(packed_path):
        with open(packed_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('#') or line.startswith('^'):
                    continue
                parts = line.split(' ', 1)
                if len(parts) == 2 and parts[1] == ref_name:
                    return parts[0]
    return None

def collect_objects(commit_sha, known_shas=None):
    """Walk the commit/tree graph and collect all object SHAs."""
    if known_shas is None:
        known_shas = set()
    objects = set()
    queue = [commit_sha]
    
    while queue:
        sha = queue.pop(0)
        if sha in objects:
            continue
        objects.add(sha)
        
        try:
            obj_type, data = read_git_object(sha)
        except FileNotFoundError:
            continue
            
        if obj_type == 'commit':
            for line in data.decode('utf-8', errors='replace').split('\n'):
                if line.startswith('tree '):
                    queue.append(line[5:].strip())
                elif line.startswith('parent '):
                    parent = line[7:].strip()
                    if parent not in known_shas:
                        # Don't recurse into known parents
                        pass
                elif line == '':
                    break
        elif obj_type == 'tree':
            i = 0
            while i < len(data):
                space_idx = data.index(b' ', i)
                null_idx = data.index(b'\0', space_idx)
                entry_sha = data[null_idx + 1:null_idx + 21].hex()
                queue.append(entry_sha)
                i = null_idx + 21
    
    return objects

def build_packfile(object_shas):
    """Build a git packfile from a set of object SHAs."""
    pack_data = b'PACK'
    pack_data += struct.pack('>I', 2)  # version 2
    pack_data += struct.pack('>I', len(object_shas))
    
    for sha in object_shas:
        obj_type, data = read_git_object(sha)
        type_map = {'commit': 1, 'tree': 2, 'blob': 3, 'tag': 4}
        type_num = type_map.get(obj_type, 1)
        
        compressed = zlib.compress(data)
        size = len(data)
        
        # Encode object header
        c = (type_num << 4) | (size & 0x0F)
        size >>= 4
        header_bytes = b''
        if size > 0:
            header_bytes += bytes([c | 0x80])
            while size > 0:
                c = size & 0x7F
                size >>= 7
                if size > 0:
                    header_bytes += bytes([c | 0x80])
                else:
                    header_bytes += bytes([c])
        else:
            header_bytes += bytes([c])
        
        pack_data += header_bytes + compressed
    
    # Append SHA1 checksum of pack data
    pack_data += hashlib.sha1(pack_data).digest()
    return pack_data

def pkt_line(data):
    """Format a pkt-line."""
    if isinstance(data, str):
        data = data.encode()
    length = len(data) + 4
    return f'{length:04x}'.encode() + data

def flush_pkt():
    return b'0000'

def push_to_remote(url, branch='main'):
    """Push current HEAD to remote via Smart HTTP."""
    local_sha = get_ref(f'refs/heads/{branch}')
    if not local_sha:
        print(f"❌ No local ref found for refs/heads/{branch}")
        return False
    
    print(f"📦 Local HEAD: {local_sha}")
    
    # 1. Discover remote refs
    info_url = f'{url}/info/refs?service=git-receive-pack'
    req = urllib.request.Request(info_url)
    req.add_header('User-Agent', 'git/2.40.0')
    token = os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')
    if token:
        import base64
        auth_str = base64.b64encode(f'x-access-token:{token}'.encode()).decode()
        req.add_header('Authorization', f'Basic {auth_str}')
    
    try:
        resp = urllib.request.urlopen(req)
        info_data = resp.read()
    except urllib.error.HTTPError as e:
        print(f"❌ Failed to discover remote refs: {e.code} {e.reason}")
        return False
    
    # Parse remote refs
    remote_sha = '0' * 40  # assume new
    lines = info_data.split(b'\n')
    for line in lines:
        line_str = line.decode('utf-8', errors='replace')
        if f'refs/heads/{branch}' in line_str:
            # Extract SHA from pkt-line
            parts = line_str.strip().split()
            for p in parts:
                if len(p) == 40 and all(c in '0123456789abcdef' for c in p):
                    remote_sha = p
                    break
    
    print(f"🌐 Remote HEAD: {remote_sha}")
    
    if remote_sha == local_sha:
        print("✅ Already up to date!")
        return True
    
    # 2. Collect objects to send
    known = set()
    if remote_sha != '0' * 40:
        known.add(remote_sha)
    
    print("📊 Collecting objects...")
    objects = collect_objects(local_sha, known)
    print(f"   Found {len(objects)} objects to send")
    
    # 3. Build packfile
    print("📦 Building packfile...")
    packfile = build_packfile(objects)
    print(f"   Packfile size: {len(packfile)} bytes")
    
    # 4. Send receive-pack request
    update_line = f'{remote_sha} {local_sha} refs/heads/{branch}\0 report-status\n'
    
    body = pkt_line(update_line)
    body += flush_pkt()
    body += packfile
    
    push_url = f'{url}/git-receive-pack'
    req = urllib.request.Request(push_url, data=body, method='POST')
    req.add_header('Content-Type', 'application/x-git-receive-pack-request')
    req.add_header('User-Agent', 'git/2.40.0')
    if token:
        req.add_header('Authorization', f'Basic {auth_str}')
    
    try:
        resp = urllib.request.urlopen(req)
        result = resp.read()
        result_str = result.decode('utf-8', errors='replace')
        
        if 'unpack ok' in result_str or resp.status == 200:
            print(f"✅ Successfully pushed to {branch}!")
            return True
        else:
            print(f"❌ Push response: {result_str[:500]}")
            return False
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        print(f"❌ Push failed: {e.code} {e.reason}")
        print(f"   {body[:500]}")
        return False

def main():
    # Read remotes from git config
    config_path = os.path.join(REPO_DIR, '.git', 'config')
    remotes = {}
    current_remote = None
    
    with open(config_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('[remote "'):
                current_remote = line.split('"')[1]
            elif line.startswith('url = ') and current_remote:
                url = line[6:].strip()
                if '@github.com' in url:
                    url = 'https://github.com' + url.split('@github.com')[1]
                if url.endswith('.git'):
                    url = url[:-4]
                remotes[current_remote] = url
                current_remote = None
    
    branch = sys.argv[1] if len(sys.argv) > 1 else 'main'
    
    print(f"\n🚀 Pushing branch '{branch}' to remotes...\n")
    
    for name, url in remotes.items():
        print(f"--- Pushing to {name} ({url}) ---")
        try:
            push_to_remote(url, branch)
        except Exception as e:
            print(f"❌ Error pushing to {name}: {e}")
        print()

if __name__ == '__main__':
    main()
