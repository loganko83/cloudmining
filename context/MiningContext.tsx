import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Transaction, MiningPlan, OwnedMachine } from '../types';
import { MOCK_TRANSACTIONS, MOCK_PLANS } from '../constants';

interface MiningContextType {
  balanceXP: number; // Confirmed wallet balance
  accumulatedXP: number; // Live mining pending distribution
  hashrate: number;
  ownedMachines: OwnedMachine[];
  transactions: Transaction[];
  buyMachine: (plan: MiningPlan) => void;
  withdrawXP: (amount: number, address: string) => Promise<boolean>;
  addTransaction: (tx: Transaction) => void;
  withdrawalFee: number;
}

const MiningContext = createContext<MiningContextType | undefined>(undefined);

export const MiningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial State
  const [balanceXP, setBalanceXP] = useState(342.12);
  const [accumulatedXP, setAccumulatedXP] = useState(0);
  const accumulatedRef = useRef(0); // Ref to avoid stale closure in intervals

  const [hashrate, setHashrate] = useState(230); 
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [ownedMachines, setOwnedMachines] = useState<OwnedMachine[]>([
    { id: 'm_init_1', planId: 'p2', purchaseDate: '2023-10-20', machineName: 'ASIC XP1 Standard', hashrate: 55, status: 'ONLINE' },
    { id: 'm_init_2', planId: 'p2', purchaseDate: '2023-10-20', machineName: 'ASIC XP1 Standard', hashrate: 55, status: 'ONLINE' },
    { id: 'm_init_3', planId: 'p1', purchaseDate: '2023-10-21', machineName: 'ASIC XP1 Mini', hashrate: 10, status: 'MAINTENANCE' },
  ]);

  const withdrawalFee = 10; 

  // Real-time Mining & Distribution Simulation
  useEffect(() => {
    // 1. Calculate precise daily return based on active machines and their plans
    const activeMachines = ownedMachines.filter(m => m.status === 'ONLINE');
    
    let currentHashrate = 0;
    let totalDailyReturn = 0;

    activeMachines.forEach(machine => {
      currentHashrate += machine.hashrate;
      const plan = MOCK_PLANS.find(p => p.id === machine.planId);
      if (plan) {
          totalDailyReturn += plan.dailyReturnXP;
      } else {
          // Fallback based on standard ratio
          totalDailyReturn += (machine.hashrate / 55) * 7.5; 
      }
    });
    
    setHashrate(currentHashrate);

    if (totalDailyReturn <= 0) return;

    const xpPerSecond = totalDailyReturn / 86400;

    // 2. Live Mining Tick (Accumulate to pending)
    const mineInterval = setInterval(() => {
      setAccumulatedXP(prev => {
          const newValue = prev + xpPerSecond;
          accumulatedRef.current = newValue;
          return newValue;
      });
    }, 1000);

    // 3. Automatic Distribution (Every 30 seconds for demo, simulates daily payout)
    const distributeInterval = setInterval(() => {
      const amountToDistribute = accumulatedRef.current;
      
      if (amountToDistribute > 0.0001) { // Threshold to avoid micro-dust transactions
          // Move pending to balance
          setBalanceXP(prev => prev + amountToDistribute);
          
          // Create Transaction Record
          const newTx: Transaction = {
            id: `tx_reward_${Date.now()}`,
            type: 'MINING_REWARD',
            amount: amountToDistribute,
            currency: 'XP',
            status: 'COMPLETED',
            date: new Date().toISOString().split('T')[0],
            hash: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
          };
          setTransactions(prev => [newTx, ...prev]);

          // Reset Accumulator
          setAccumulatedXP(0);
          accumulatedRef.current = 0;
          
          // Note: In a real app, we might trigger a toast here via a callback or event
          console.log("Distributed Mining Reward:", amountToDistribute);
      }
    }, 30000); // 30 seconds cycle

    return () => {
      clearInterval(mineInterval);
      clearInterval(distributeInterval);
    };
  }, [ownedMachines]);

  const buyMachine = (plan: MiningPlan) => {
    const newMachine: OwnedMachine = {
      id: `m_${Date.now()}`,
      planId: plan.id,
      purchaseDate: new Date().toISOString().split('T')[0],
      machineName: plan.machineName,
      hashrate: plan.hashrate,
      status: 'ONLINE'
    };
    setOwnedMachines(prev => [...prev, newMachine]);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'PURCHASE',
      amount: plan.priceUSDT,
      currency: 'USDT',
      status: 'COMPLETED',
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const withdrawXP = async (amount: number, address: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalDeduction = amount + withdrawalFee;
        if (balanceXP >= totalDeduction) {
          setBalanceXP(prev => prev - totalDeduction);
          const newTx: Transaction = {
            id: `tx_${Date.now()}`,
            type: 'WITHDRAWAL',
            amount: amount,
            fee: withdrawalFee,
            currency: 'XP',
            status: 'PENDING',
            date: new Date().toISOString().split('T')[0],
            hash: '0x' + Math.random().toString(16).substr(2, 40)
          };
          setTransactions(prev => [newTx, ...prev]);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1500);
    });
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
  };

  return (
    <MiningContext.Provider value={{ balanceXP, accumulatedXP, hashrate, ownedMachines, transactions, buyMachine, withdrawXP, addTransaction, withdrawalFee }}>
      {children}
    </MiningContext.Provider>
  );
};

export const useMining = () => {
  const context = useContext(MiningContext);
  if (!context) {
    throw new Error('useMining must be used within a MiningProvider');
  }
  return context;
};