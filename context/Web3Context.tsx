import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Web3State } from '../types';

interface Web3ContextType extends Web3State {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  payWithUSDT: (amount: number, to: string) => Promise<boolean>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<Web3State>({
    isConnected: false,
    address: null,
    chainId: null,
    balanceUSDT: 0,
  });

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      // Simulation of checking window.ethereum
      const storedAddress = localStorage.getItem('mock_web3_address');
      if (storedAddress) {
         setState(prev => ({
           ...prev,
           isConnected: true,
           address: storedAddress,
           balanceUSDT: 5000, // Mock balance
         }));
      }
    };
    checkConnection();
  }, []);

  const connectWallet = useCallback(async () => {
    // In a real app, use window.ethereum.request({ method: 'eth_requestAccounts' })
    // Here we act as a mock Web3 provider
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const mockAddress = "0x71C...9A21";
        setState({
          isConnected: true,
          address: mockAddress,
          chainId: 1, // Mainnet
          balanceUSDT: 5000, // Giving user some mock USDT to buy things
        });
        localStorage.setItem('mock_web3_address', mockAddress);
        resolve();
      }, 800);
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      balanceUSDT: 0,
    });
    localStorage.removeItem('mock_web3_address');
  }, []);

  const payWithUSDT = useCallback(async (amount: number, to: string): Promise<boolean> => {
    if (!state.isConnected) {
      alert("지갑을 먼저 연결해주세요.");
      return false;
    }
    
    // Simulate transaction delay
    return new Promise((resolve) => {
        console.log(`Sending ${amount} USDT to ${to}...`);
        setTimeout(() => {
            if (state.balanceUSDT >= amount) {
                setState(prev => ({ ...prev, balanceUSDT: prev.balanceUSDT - amount }));
                resolve(true);
            } else {
                alert("USDT 잔액이 부족합니다.");
                resolve(false);
            }
        }, 2000);
    });
  }, [state.isConnected, state.balanceUSDT]);

  return (
    <Web3Context.Provider value={{ ...state, connectWallet, disconnectWallet, payWithUSDT }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};