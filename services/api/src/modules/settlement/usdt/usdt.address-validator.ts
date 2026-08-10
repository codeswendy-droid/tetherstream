import { BadRequestException } from '@nestjs/common';

export class UsdtAddressValidator {
  /**
   * Validate a TRON TRC-20 receiving address syntax & network compatibility.
   * Throws BadRequestException on invalid addresses.
   */
  static validateOrThrow(address: string, network = 'TRON'): void {
    if (!address || typeof address !== 'string') {
      throw new BadRequestException('INVALID_USDT_ADDRESS: Address is empty or missing');
    }

    const trimmed = address.trim();

    if (network.toUpperCase().includes('TRON')) {
      // TRON mainnet / testnet addresses start with 'T' and are 34 base58 chars
      const tronRegex = /^T[a-zA-Z0-9]{33}$/;
      if (!tronRegex.test(trimmed)) {
        throw new BadRequestException(`INVALID_USDT_ADDRESS: Address '${trimmed}' is not a valid TRON address (must start with 'T' and be 34 characters long)`);
      }

      // Check for zero / burn address placeholder
      if (trimmed === 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb') {
        throw new BadRequestException('INVALID_USDT_ADDRESS: Address cannot be TRON zero/burn address');
      }
      return;
    }

    // Default fallback length check for other networks
    if (trimmed.length < 26 || trimmed.length > 50) {
      throw new BadRequestException(`INVALID_USDT_ADDRESS: Address '${trimmed}' format invalid for network ${network}`);
    }
  }

  static isValid(address: string, network = 'TRON'): boolean {
    try {
      UsdtAddressValidator.validateOrThrow(address, network);
      return true;
    } catch {
      return false;
    }
  }
}
