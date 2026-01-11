import React, { useState } from 'react';
import { MOCK_PLANS } from '../constants';
import { useWeb3 } from '../context/Web3Context';
import { useMining } from '../context/MiningContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { Check, Cpu, Zap, Info, Server } from 'lucide-react';
import { MiningPlan } from '../types';

export const Market: React.FC = () => {
  const { payWithUSDT, isConnected, balanceUSDT, connectWallet } = useWeb3();
  const { buyMachine, ownedMachines } = useMining();
  const { showToast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleBuy = async (plan: MiningPlan) => {
    if (!isConnected) {
        connectWallet();
        return;
    }

    if (balanceUSDT < plan.priceUSDT) {
        showToast("USDT 잔액이 부족합니다.", 'error');
        return;
    }

    setProcessingId(plan.id);
    const success = await payWithUSDT(plan.priceUSDT, "0x_CONTRACT_ADDRESS_MOCK");
    
    if (success) {
        buyMachine(plan);
        showToast(`${plan.name} 구매 완료! 채굴이 시작됩니다.`, 'success');
    } else {
        showToast("구매 처리에 실패했습니다.", 'error');
    }
    setProcessingId(null);
  };

  const getOwnedCount = (planId: string) => {
      return ownedMachines.filter(m => m.planId === planId).length;
  };

  return (
    <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">ASIC XP1 마이닝 파워 구매</h2>
            <p className="text-slate-400">
                Xphere 네트워크의 최신 채굴기 ASIC XP1의 해시파워를 구매하세요. 
                유지보수와 전기료는 포함되어 있으며, 매일 자동으로 XP가 정산됩니다.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_PLANS.map((plan) => {
                const ownedCount = getOwnedCount(plan.id);
                return (
                <div key={plan.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-blue-500 transition-all shadow-xl flex flex-col relative group">
                    {ownedCount > 0 && (
                        <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10 flex items-center shadow-lg">
                            <Server className="h-3 w-3 mr-1" />
                            보유중: {ownedCount}대
                        </div>
                    )}
                    <div className="h-48 bg-slate-700 relative group-hover:scale-105 transition-transform duration-300">
                        <img 
                            src={plan.imageUrl} 
                            alt={plan.machineName} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm z-20">
                            {plan.machineName}
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col bg-slate-800 relative z-20">
                        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                        <div className="text-3xl font-bold text-blue-400 mb-6">
                            {plan.priceUSDT.toLocaleString()} <span className="text-lg text-slate-500">USDT</span>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                                <div className="flex items-center text-slate-300">
                                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                                    <span>해시레이트</span>
                                </div>
                                <span className="font-mono text-white">{plan.hashrate} TH/s</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                                <div className="flex items-center text-slate-300">
                                    <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                                    <span>일일 예상 채굴</span>
                                </div>
                                <span className="font-mono text-white">{plan.dailyReturnXP} XP</span>
                            </div>
                            <div className="flex items-start text-sm text-slate-400 mt-2">
                                <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                <p>{plan.description}</p>
                            </div>
                        </div>

                        <Button 
                            onClick={() => handleBuy(plan)}
                            isLoading={processingId === plan.id}
                            disabled={isConnected && balanceUSDT < plan.priceUSDT}
                            className="w-full"
                        >
                            {!isConnected 
                                ? "지갑 연결하고 구매" 
                                : balanceUSDT < plan.priceUSDT 
                                    ? "USDT로 구매하기" 
                                    : "잔액 부족 (USDT)"
                            }
                        </Button>
                        {isConnected && (
                             <p className="text-xs text-slate-500 text-center mt-2 flex justify-center items-center">
                                 내 지갑: <span className={balanceUSDT < plan.priceUSDT ? "text-red-400 ml-1" : "text-green-400 ml-1"}>{balanceUSDT.toLocaleString()} USDT</span>
                             </p>
                        )}
                    </div>
                </div>
            )})}
        </div>
    </div>
  );
};