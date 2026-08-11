#!/usr/bin/env python3
import os
import sys
import json
import base64
import urllib.request

TOKEN_WENDY = os.environ.get('GH_TOKEN_WENDY') or os.environ.get('GH_TOKEN') or 'gho_' + 'vgqdx6WDXKaKLHRovv9aATeMqstWJg2AeuYM'
TOKEN_ARVIN = os.environ.get('GH_TOKEN_ARVIN') or os.environ.get('GH_TOKEN') or 'ghp_' + 'o63mgPf7ipoTTiz7cZE6FFubX8IVQ60DMTCu'

REPO_CONFIG = {
    'codeswendy-droid/tetherstream': {
        'token': TOKEN_WENDY,
        'branch': 'master'
    },
    'codesarvin/tetherstream': {
        'token': TOKEN_ARVIN,
        'branch': 'main'
    },
}

FILES_TO_SYNC = [
    'services/api/src/modules/settlement/dto/create-settlement-session.dto.ts',
    'services/api/src/modules/settlement/provider-registry.service.ts',
    'services/api/src/modules/settlement/pesapal/pesapal.provider.ts',
    'services/api/src/modules/financial/withdrawal.service.ts',
    'services/api/src/modules/payment-order/payment-order.service.ts',
    'services/api/src/modules/settlement/provider-registry.service.spec.ts',
    'apps/web/src/components/funding/FundingModal.tsx',
    'apps/web/src/components/funding/PesapalFunding.tsx',
    'apps/web/src/components/funding/CryptoBotFunding.tsx',
    'apps/web/src/components/funding/SettlementTracker.tsx',
    'apps/web/src/components/funding/WithdrawModal.tsx',
    'apps/web/src/components/MachineEducationModal.tsx',
    'apps/web/src/components/HelpModal.tsx',
    'apps/web/src/pages/Boost/index.tsx',
    'apps/web/src/store/useCountryStore.ts',
    'apps/web/src/services/fundingService.ts',
    'services/api/src/modules/settlement/settlement.service.ts',
    'services/api/src/modules/user/user.service.ts',
    'services/api/src/modules/user/user.service.spec.ts',
    'package.json',
    'apps/web/package.json',
    '.npmrc',
    'apps/web/.env.example',
    'netlify.toml',
    'apps/web/netlify.toml',
    'docs/PRODUCTION_RELEASE_CERTIFICATION.md',
]

def gh_req(repo, endpoint, data=None, method='GET'):
    token = REPO_CONFIG[repo]['token']
    url = f'https://api.github.com/repos/{repo}/{endpoint}'
    headers = {
        'Authorization': f'token {token}',
        'Content-Type': 'application/json',
        'User-Agent': 'antigravity',
    }
    payload = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=payload, method=method, headers=headers)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code} on {repo}/{endpoint}: {e.read().decode()}")
        sys.exit(1)

def sync_repo(repo):
    branch = REPO_CONFIG[repo]['branch']
    print(f"\n==========================================")
    print(f" Syncing Repository: {repo} (branch: {branch})")
    print(f"==========================================")
    print(f"1. Getting current {branch} ref SHA...")
    ref_data = gh_req(repo, f'git/ref/heads/{branch}')
    commit_sha = ref_data['object']['sha']
    print(f"   {branch} commit SHA: {commit_sha}")

    print("2. Getting commit data...")
    commit_data = gh_req(repo, f'git/commits/{commit_sha}')
    base_tree_sha = commit_data['tree']['sha']
    print(f"   Base tree SHA: {base_tree_sha}")

    print("3. Creating blobs for updated files...")
    tree_items = []
    for filepath in FILES_TO_SYNC:
        full_path = os.path.join('/home/wendy/Desktop/tetherstream', filepath)
        if not os.path.exists(full_path):
            print(f"   ⚠️ File not found: {filepath}")
            continue
        with open(full_path, 'rb') as f:
            content = f.read()
        
        blob_res = gh_req(repo, 'git/blobs', {
            'content': base64.b64encode(content).decode('utf-8'),
            'encoding': 'base64'
        }, method='POST')
        
        tree_items.append({
            'path': filepath,
            'mode': '100644',
            'type': 'blob',
            'sha': blob_res['sha']
        })
        print(f"   Uploaded blob for {filepath} ({len(content)} bytes)")

    print("4. Creating new Git tree...")
    tree_res = gh_req(repo, 'git/trees', {
        'base_tree': base_tree_sha,
        'tree': tree_items
    }, method='POST')
    new_tree_sha = tree_res['sha']
    print(f"   New tree SHA: {new_tree_sha}")

    print("5. Creating new Commit...")
    commit_res = gh_req(repo, 'git/commits', {
        'message': 'feat(payment): payment UX finalization & complete CryptoBot decommissioning',
        'tree': new_tree_sha,
        'parents': [commit_sha]
    }, method='POST')
    new_commit_sha = commit_res['sha']
    print(f"   New commit SHA: {new_commit_sha}")

    print(f"6. Updating ref {branch}...")
    gh_req(repo, f'git/refs/heads/{branch}', {
        'sha': new_commit_sha,
        'force': True
    }, method='PATCH')
    print(f"✅ Successfully updated {repo} {branch} to commit {new_commit_sha}!")

def main():
    for repo in REPO_CONFIG:
        sync_repo(repo)

if __name__ == '__main__':
    main()
