# Frontend Integration Guide - Xphere Mining Cloud

## 1. API Client Setup

### 1.1 Axios Instance

```typescript
// packages/frontend/src/api/client.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 1.2 API Modules

```typescript
// packages/frontend/src/api/auth.api.ts
import apiClient from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    walletAddress: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', data),

  signup: (data: SignupRequest) =>
    apiClient.post<{ data: AuthResponse }>('/auth/signup', data),

  logout: () => apiClient.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      { refreshToken }
    ),
};
```

```typescript
// packages/frontend/src/api/lending.api.ts
import apiClient from './client';

export interface LendingPool {
  id: string;
  asset: string;
  totalSupplied: number;
  totalBorrowed: number;
  utilizationRate: number;
  supplyApy: number;
  borrowApy: number;
  ltvRatio: number;
  liquidationThreshold: number;
}

export interface SupplyPosition {
  id: string;
  poolId: string;
  suppliedAmount: number;
  currentValue: number;
  xpxBalance: number;
  earnedInterest: number;
}

export interface BorrowPosition {
  id: string;
  poolId: string;
  borrowedAmount: number;
  currentDebt: number;
  collateralAmount: number;
  collateralAsset: string;
  healthFactor: number;
  liquidationPrice: number;
}

export const lendingApi = {
  getPools: () =>
    apiClient.get<{ data: LendingPool[] }>('/lending/pools'),

  getMyPositions: () =>
    apiClient.get<{
      data: {
        supplies: SupplyPosition[];
        borrows: BorrowPosition[];
        netApy: number;
      };
    }>('/lending/my-positions'),

  supply: (poolId: string, amount: number, txHash: string) =>
    apiClient.post('/lending/supply', { poolId, amount, txHash }),

  withdraw: (positionId: string, xpxAmount: number) =>
    apiClient.post('/lending/withdraw', { positionId, xpxAmount }),

  borrow: (
    poolId: string,
    borrowAmount: number,
    collateralAsset: string,
    collateralAmount: number,
    collateralTxHash: string
  ) =>
    apiClient.post('/lending/borrow', {
      poolId,
      borrowAmount,
      collateralAsset,
      collateralAmount,
      collateralTxHash,
    }),

  repay: (positionId: string, amount: number, txHash: string) =>
    apiClient.post('/lending/repay', { positionId, amount, txHash }),
};
```

---

## 2. Web3 Integration

### 2.1 Wallet Connection Hook

```typescript
// packages/frontend/src/hooks/useWeb3.ts
import { useState, useCallback, useEffect } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';

interface Web3State {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '1');

export function useWeb3() {
  const [state, setState] = useState<Web3State>({
    isConnected: false,
    address: null,
    chainId: null,
    provider: null,
    signer: null,
  });

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      const signer = await provider.getSigner();

      if (Number(network.chainId) !== CHAIN_ID) {
        await switchChain(CHAIN_ID);
      }

      setState({
        isConnected: true,
        address: accounts[0],
        chainId: Number(network.chainId),
        provider,
        signer,
      });

      localStorage.setItem('walletConnected', 'true');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      provider: null,
      signer: null,
    });
    localStorage.removeItem('walletConnected');
  }, []);

  const switchChain = async (targetChainId: number) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, need to add it
        throw new Error('Please add this network to MetaMask');
      }
      throw error;
    }
  };

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true' && window.ethereum) {
      connectWallet().catch(console.error);
    }
  }, [connectWallet]);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setState((prev) => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnectWallet]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
  };
}
```

### 2.2 Contract Hooks

```typescript
// packages/frontend/src/hooks/useContracts.ts
import { useMemo } from 'react';
import { Contract, ethers } from 'ethers';
import { useWeb3 } from './useWeb3';

// ABIs (simplified - full ABIs should be imported from generated files)
import XPTokenABI from '../contracts/XPToken.json';
import LendingPoolABI from '../contracts/LendingPool.json';
import MachinePaymentABI from '../contracts/MachinePayment.json';

const ADDRESSES = {
  XP_TOKEN: import.meta.env.VITE_XP_TOKEN_ADDRESS,
  LENDING_POOL: import.meta.env.VITE_LENDING_POOL_ADDRESS,
  MACHINE_PAYMENT: import.meta.env.VITE_MACHINE_PAYMENT_ADDRESS,
  USDT: import.meta.env.VITE_USDT_ADDRESS,
};

export function useContracts() {
  const { signer, provider } = useWeb3();

  const contracts = useMemo(() => {
    if (!provider) return null;

    const signerOrProvider = signer || provider;

    return {
      xpToken: new Contract(ADDRESSES.XP_TOKEN, XPTokenABI, signerOrProvider),
      lendingPool: new Contract(
        ADDRESSES.LENDING_POOL,
        LendingPoolABI,
        signerOrProvider
      ),
      machinePayment: new Contract(
        ADDRESSES.MACHINE_PAYMENT,
        MachinePaymentABI,
        signerOrProvider
      ),
      usdt: new Contract(
        ADDRESSES.USDT,
        ['function approve(address,uint256)', 'function balanceOf(address) view returns (uint256)'],
        signerOrProvider
      ),
    };
  }, [signer, provider]);

  return contracts;
}
```

### 2.3 Token Operations

```typescript
// packages/frontend/src/hooks/useTokens.ts
import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useWeb3 } from './useWeb3';

export function useTokens() {
  const { address } = useWeb3();
  const contracts = useContracts();
  const [isLoading, setIsLoading] = useState(false);

  const getXPBalance = useCallback(async (): Promise<bigint> => {
    if (!contracts || !address) return 0n;
    return await contracts.xpToken.balanceOf(address);
  }, [contracts, address]);

  const getUSDTBalance = useCallback(async (): Promise<bigint> => {
    if (!contracts || !address) return 0n;
    return await contracts.usdt.balanceOf(address);
  }, [contracts, address]);

  const approveXP = useCallback(
    async (spender: string, amount: bigint): Promise<string> => {
      if (!contracts) throw new Error('Contracts not initialized');

      setIsLoading(true);
      try {
        const tx = await contracts.xpToken.approve(spender, amount);
        await tx.wait();
        return tx.hash;
      } finally {
        setIsLoading(false);
      }
    },
    [contracts]
  );

  const approveUSDT = useCallback(
    async (spender: string, amount: bigint): Promise<string> => {
      if (!contracts) throw new Error('Contracts not initialized');

      setIsLoading(true);
      try {
        const tx = await contracts.usdt.approve(spender, amount);
        await tx.wait();
        return tx.hash;
      } finally {
        setIsLoading(false);
      }
    },
    [contracts]
  );

  return {
    getXPBalance,
    getUSDTBalance,
    approveXP,
    approveUSDT,
    isLoading,
  };
}
```

---

## 3. Updated Context Providers

### 3.1 AuthContext (Updated)

```typescript
// packages/frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, AuthResponse } from '../api/auth.api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  walletAddress: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({ email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      const response = await authApi.signup({ email, password, name });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(console.error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 4. Lending Page Component

```typescript
// packages/frontend/src/pages/Lending.tsx
import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../hooks/useWeb3';
import { useContracts } from '../hooks/useContracts';
import { useToast } from '../context/ToastContext';
import { lendingApi, LendingPool, SupplyPosition, BorrowPosition } from '../api/lending.api';
import { Button } from '../components/Button';

export const Lending: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, connectWallet, address } = useWeb3();
  const contracts = useContracts();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'supply' | 'borrow'>('supply');
  const [pools, setPools] = useState<LendingPool[]>([]);
  const [supplyPositions, setSupplyPositions] = useState<SupplyPosition[]>([]);
  const [borrowPositions, setBorrowPositions] = useState<BorrowPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [poolsRes, positionsRes] = await Promise.all([
        lendingApi.getPools(),
        lendingApi.getMyPositions(),
      ]);
      setPools(poolsRes.data.data);
      setSupplyPositions(positionsRes.data.data.supplies);
      setBorrowPositions(positionsRes.data.data.borrows);
    } catch (error) {
      console.error('Failed to load lending data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupply = async () => {
    if (!contracts || !supplyAmount) return;

    try {
      setIsLoading(true);
      const amount = BigInt(parseFloat(supplyAmount) * 1e18);

      // Approve XP spending
      const approveTx = await contracts.xpToken.approve(
        contracts.lendingPool.getAddress(),
        amount
      );
      await approveTx.wait();

      // Supply to pool
      const supplyTx = await contracts.lendingPool.supply(amount);
      await supplyTx.wait();

      // Update backend
      await lendingApi.supply('lp-xp', parseFloat(supplyAmount), supplyTx.hash);

      showToast(`${supplyAmount} XP supplied successfully!`, 'success');
      setSupplyAmount('');
      loadData();
    } catch (error) {
      showToast('Supply failed. Please try again.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const pool = pools[0]; // XP pool

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">XP Lending Pool</h2>
        <p className="text-slate-400">
          Supply XP to earn interest or borrow against collateral.
        </p>
      </div>

      {/* Pool Stats */}
      {pool && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Supplied"
            value={`${pool.totalSupplied.toLocaleString()} XP`}
          />
          <StatCard
            title="Total Borrowed"
            value={`${pool.totalBorrowed.toLocaleString()} XP`}
          />
          <StatCard
            title="Supply APY"
            value={`${pool.supplyApy.toFixed(2)}%`}
            color="text-green-400"
          />
          <StatCard
            title="Borrow APY"
            value={`${pool.borrowApy.toFixed(2)}%`}
            color="text-yellow-400"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('supply')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'supply'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-slate-400'
          }`}
        >
          <ArrowUpCircle className="inline w-4 h-4 mr-2" />
          Supply
        </button>
        <button
          onClick={() => setActiveTab('borrow')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'borrow'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-slate-400'
          }`}
        >
          <ArrowDownCircle className="inline w-4 h-4 mr-2" />
          Borrow
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Action Form */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          {activeTab === 'supply' ? (
            <SupplyForm
              amount={supplyAmount}
              setAmount={setSupplyAmount}
              onSubmit={handleSupply}
              isLoading={isLoading}
              isConnected={isConnected}
              onConnect={connectWallet}
              apy={pool?.supplyApy || 0}
            />
          ) : (
            <BorrowForm
              borrowAmount={borrowAmount}
              setBorrowAmount={setBorrowAmount}
              collateralAmount={collateralAmount}
              setCollateralAmount={setCollateralAmount}
              isLoading={isLoading}
              isConnected={isConnected}
              onConnect={connectWallet}
              pool={pool}
            />
          )}
        </div>

        {/* Positions */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">My Positions</h3>
          {activeTab === 'supply' ? (
            <SupplyPositionsList positions={supplyPositions} />
          ) : (
            <BorrowPositionsList positions={borrowPositions} />
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components...
const StatCard: React.FC<{
  title: string;
  value: string;
  color?: string;
}> = ({ title, value, color = 'text-white' }) => (
  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
    <p className="text-slate-400 text-sm">{title}</p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
  </div>
);

const SupplyForm: React.FC<{
  amount: string;
  setAmount: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isConnected: boolean;
  onConnect: () => void;
  apy: number;
}> = ({ amount, setAmount, onSubmit, isLoading, isConnected, onConnect, apy }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Supply XP</h3>
    <div>
      <label className="text-sm text-slate-400">Amount</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
      />
    </div>
    <div className="bg-slate-700/50 rounded-lg p-3">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Estimated APY</span>
        <span className="text-green-400">{apy.toFixed(2)}%</span>
      </div>
    </div>
    {isConnected ? (
      <Button onClick={onSubmit} disabled={isLoading || !amount} className="w-full">
        {isLoading ? 'Processing...' : 'Supply XP'}
      </Button>
    ) : (
      <Button onClick={onConnect} className="w-full">
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    )}
  </div>
);

// Additional sub-components would follow...
```

---

## 5. Type Definitions

```typescript
// packages/frontend/src/types/index.ts

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  walletAddress: string | null;
  createdAt: string;
}

// Mining types
export interface MiningPlan {
  id: string;
  name: string;
  machineName: string;
  priceUsdt: number;
  hashrate: number;
  dailyReturnXp: number;
  description: string;
  imageUrl: string;
}

export interface OwnedMachine {
  id: string;
  planId: string;
  machineName: string;
  hashrate: number;
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE';
  purchaseDate: string;
  txHash: string;
}

// Transaction types
export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'PURCHASE'
  | 'MINING_REWARD'
  | 'LENDING_SUPPLY'
  | 'LENDING_WITHDRAW'
  | 'BORROW'
  | 'REPAY'
  | 'STAKE'
  | 'UNSTAKE'
  | 'SWAP';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fee: number | null;
  currency: 'XP' | 'USDT';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  txHash: string | null;
  createdAt: string;
}

// Lending types
export interface LendingPool {
  id: string;
  asset: string;
  totalSupplied: number;
  totalBorrowed: number;
  utilizationRate: number;
  supplyApy: number;
  borrowApy: number;
  ltvRatio: number;
  liquidationThreshold: number;
  availableLiquidity: number;
}

export interface SupplyPosition {
  id: string;
  poolId: string;
  asset: string;
  suppliedAmount: number;
  currentValue: number;
  xpxBalance: number;
  earnedInterest: number;
  apy: number;
}

export interface BorrowPosition {
  id: string;
  poolId: string;
  borrowedAmount: number;
  currentDebt: number;
  collateralAmount: number;
  collateralAsset: string;
  healthFactor: number;
  liquidationPrice: number;
}

// Staking types
export interface StakingPosition {
  id: string;
  amount: number;
  status: 'ACTIVE' | 'UNBONDING' | 'WITHDRAWN';
  startDate: string;
  unlockDate: string | null;
  accumulatedRewards: number;
}
```

---

## 6. Environment Setup

```typescript
// packages/frontend/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_XP_TOKEN_ADDRESS: string;
  readonly VITE_LENDING_POOL_ADDRESS: string;
  readonly VITE_MINING_REWARDS_ADDRESS: string;
  readonly VITE_MACHINE_PAYMENT_ADDRESS: string;
  readonly VITE_USDT_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
  };
}
```
