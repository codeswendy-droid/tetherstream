import { Injectable, Logger } from '@nestjs/common';
import { CANONICAL_USDT_CONTRACTS, UsdtTokenTransferEvent } from './usdt.types';

@Injectable()
export class UsdtBlockchainClient {
  private readonly logger = new Logger(UsdtBlockchainClient.name);

  /**
   * Fetch current latest block number on the target TRON network.
   */
  async getLatestBlockNumber(network = 'TRON'): Promise<bigint> {
    const baseUrl = this.getBaseUrl(network);
    try {
      const response = await fetch(`${baseUrl}/wallet/getnowblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = (await response.json()) as any;
      const blockNum = data?.block_header?.raw_data?.number;
      if (typeof blockNum === 'number') {
        return BigInt(blockNum);
      }
      return BigInt(Date.now());
    } catch (err: any) {
      this.logger.warn(`[UsdtBlockchainClient] Failed to fetch latest block number: ${err?.message}`);
      return BigInt(Date.now());
    }
  }

  /**
   * Query TRC-20 token transfers for receivingAddress from TronGrid API.
   */
  async getTrc20Transfers(
    receivingAddress: string,
    network = 'TRON',
    expectedTokenContract?: string,
    limit = 50,
  ): Promise<UsdtTokenTransferEvent[]> {
    if (!receivingAddress) return [];

    const baseUrl = this.getBaseUrl(network);
    const tokenContract =
      expectedTokenContract || CANONICAL_USDT_CONTRACTS[network] || CANONICAL_USDT_CONTRACTS.TRON;

    const latestBlock = await this.getLatestBlockNumber(network);
    const endpoint = `${baseUrl}/v1/accounts/${receivingAddress}/transactions/trc20?limit=${limit}&contract_address=${tokenContract}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.TRONGRID_API_KEY ? { 'TRON-PRO-HEADER': process.env.TRONGRID_API_KEY } : {}),
        },
      });

      if (!response.ok) {
        this.logger.warn(`[UsdtBlockchainClient] TronGrid HTTP error ${response.status}`);
        return [];
      }

      const json = (await response.json()) as any;
      const data: any[] = Array.isArray(json?.data) ? json.data : [];

      const events: UsdtTokenTransferEvent[] = [];

      for (const item of data) {
        // We filter exclusively for transfers where recipient matches receivingAddress
        if (item.to !== receivingAddress) continue;

        const txHash = item.transaction_id || item.hash;
        if (!txHash) continue;

        const rawAmountStr = item.value || '0';
        const decimals = item.token_info?.decimals || 6;
        const normalizedDecimal = (parseFloat(rawAmountStr) / Math.pow(10, decimals)).toFixed(6);

        const blockNum = item.block_number ? BigInt(item.block_number) : latestBlock;
        const confirmations = Number(latestBlock >= blockNum ? latestBlock - blockNum + 1n : 1n);

        events.push({
          transactionHash: txHash,
          network,
          tokenContract: item.token_info?.address || tokenContract,
          blockNumber: blockNum,
          blockTimestamp: new Date(item.block_timestamp || Date.now()),
          senderAddress: item.from || 'UNKNOWN',
          recipientAddress: item.to,
          rawTokenAmount: rawAmountStr,
          normalizedAmount: normalizedDecimal,
          confirmations,
          onChainStatus: 'SUCCESS',
        });
      }

      return events;
    } catch (err: any) {
      this.logger.error(`[UsdtBlockchainClient] Transfer fetch failed: ${err?.message}`);
      return [];
    }
  }

  private getBaseUrl(network: string): string {
    const netUpper = (network || 'TRON').toUpperCase();
    if (netUpper.includes('NILE')) {
      return process.env.USDT_PROVIDER_URL || 'https://nile.trongrid.io';
    }
    return process.env.USDT_PROVIDER_URL || 'https://api.trongrid.io';
  }
}
