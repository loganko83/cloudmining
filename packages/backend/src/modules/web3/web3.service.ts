import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class Web3Service implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  private xpTokenAddress: string;
  private lendingPoolAddress: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const rpcUrl = this.configService.get('WEB3_RPC_URL', 'https://en-bkk.x-phere.com');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.xpTokenAddress = this.configService.get('XP_TOKEN_ADDRESS', '');
    this.lendingPoolAddress = this.configService.get('LENDING_POOL_ADDRESS', '');
  }

  async verifyTransaction(txHash: string): Promise<{
    verified: boolean;
    from?: string;
    to?: string;
    value?: string;
    status?: number;
  }> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return { verified: false };
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { verified: false };
      }

      return {
        verified: receipt.status === 1,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        status: receipt.status,
      };
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return { verified: false };
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Get balance failed:', error);
      return '0';
    }
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
      ]);

      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Get token balance failed:', error);
      return '0';
    }
  }

  async getXPBalance(walletAddress: string): Promise<string> {
    if (!this.xpTokenAddress) return '0';
    return this.getTokenBalance(this.xpTokenAddress, walletAddress);
  }

  getContractAddresses() {
    return {
      xpToken: this.xpTokenAddress,
      lendingPool: this.lendingPoolAddress,
    };
  }
}
