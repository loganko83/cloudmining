export interface User {
  id: string;
  email: string;
  name: string;
  walletAddress?: string; // For payout
  role: 'user' | 'admin';
}

export interface MiningPlan {
  id: string;
  name: string;
  machineName: string; // e.g., ASIC XP1
  priceUSDT: number;
  hashrate: number; // in TH/s
  dailyReturnXP: number; // Estimated XP per day
  description: string;
  imageUrl: string;
}

export interface OwnedMachine {
  id: string;
  planId: string;
  purchaseDate: string;
  machineName: string;
  hashrate: number;
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE';
}

export interface UserMiningInfo {
  totalHashrate: number;
  totalMinedXP: number;
  activePlans: number;
  pendingPayoutXP: number;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PURCHASE' | 'MINING_REWARD';
  amount: number;
  fee?: number; // Transaction fee
  currency: 'XP' | 'USDT';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  date: string;
  hash?: string;
}

export interface Web3State {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balanceUSDT: number;
}