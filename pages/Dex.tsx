import React, { useState } from 'react';
import { ArrowDown, Settings, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '../components/Button';
import { useMining } from '../context/MiningContext';
import { useWeb3 } from '../context/Web3Context';
import { useToast } from '../context/ToastContext';

export const Dex: React.FC = () => {
  const { balanceXP } = useMining();
  const { balanceUSDT, isConnected, connectWallet } = useWeb3();
  const { showToast } = useToast();

  const [fromAmount, setFromAmount] = useState<string>('');
  const [direction, setDirection] = useState<'XP_TO_USDT' | 'USDT_TO_XP'>('XP_TO_USDT');
  
  // Constants
  const XP_PRICE = 0.362;
  const SLIPPAGE = 0.005; // 0.5%
  const FEE = 0.003; // 0.3%

  const toAmount = () => {
      const val = parseFloat(fromAmount);
      if (isNaN(val) || val <= 0) return '';
      
      let result = 0;
      if (direction === 'XP_TO_USDT') {
          result = val * XP_PRICE * (1 - FEE);
      } else {
          result = (val / XP_PRICE) * (1 - FEE);
      }
      return result.toFixed(6);
  };

  const handleSwap = () => {
      if (!isConnected) {
          connectWallet();
          return;
      }
      
      const val = parseFloat(fromAmount);
      if (isNaN(val) || val <= 0) return;

      if (direction === 'XP_TO_USDT') {
          if (val > balanceXP) {
              showToast("XP 잔액이 부족합니다.", 'error');
              return;
          }
      } else {
          if (val > balanceUSDT) {
              showToast("USDT 잔액이 부족합니다.", 'error');
              return;
          }
      }

      showToast("스왑 요청이 전송되었습니다...", 'info');
      
      // Simulation
      setTimeout(() => {
          showToast("스왑이 성공적으로 완료되었습니다!", 'success');
          setFromAmount('');
      }, 2000);
  };

  const toggleDirection = () => {
      setDirection(prev => prev === 'XP_TO_USDT' ? 'USDT_TO_XP' : 'XP_TO_USDT');
      setFromAmount('');
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Xphere Swap</h2>
            <div className="flex space-x-2">
                <button className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full">
                    <RefreshCw className="w-5 h-5" />
                </button>
                <button className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Swap Body */}
        <div className="p-6 space-y-4">
            {/* From Input */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">보내는 수량</span>
                    <span className="text-sm text-slate-400 flex items-center">
                        <Wallet className="w-3 h-3 mr-1" />
                        {direction === 'XP_TO_USDT' ? `${balanceXP.toFixed(4)} XP` : `${balanceUSDT.toLocaleString()} USDT`}
                    </span>
                </div>
                <div className="flex items-center space-x-4">
                    <input 
                        type="number" 
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="bg-transparent text-3xl font-bold text-white outline-none w-full placeholder-slate-600"
                        placeholder="0.0"
                    />
                    <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-full border border-slate-600">
                        {direction === 'XP_TO_USDT' ? (
                            <>
                                <div className="w-6 h-6 rounded-full bg-blue-500 mr-2 flex items-center justify-center text-xs font-bold">XP</div>
                                <span className="font-bold">XP</span>
                            </>
                        ) : (
                            <>
                                <div className="w-6 h-6 rounded-full bg-green-500 mr-2 flex items-center justify-center text-xs font-bold text-black">$</div>
                                <span className="font-bold">USDT</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center -my-2 relative z-10">
                <button 
                    onClick={toggleDirection}
                    className="bg-slate-700 p-2 rounded-full border-4 border-slate-800 text-blue-400 hover:text-white hover:bg-slate-600 transition-colors"
                >
                    <ArrowDown className="w-5 h-5" />
                </button>
            </div>

            {/* To Input */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                 <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">받는 수량 (예상)</span>
                </div>
                <div className="flex items-center space-x-4">
                    <input 
                        type="text" 
                        readOnly
                        value={toAmount()}
                        className="bg-transparent text-3xl font-bold text-slate-300 outline-none w-full placeholder-slate-600 cursor-default"
                        placeholder="0.0"
                    />
                    <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-full border border-slate-600">
                         {direction === 'USDT_TO_XP' ? (
                            <>
                                <div className="w-6 h-6 rounded-full bg-blue-500 mr-2 flex items-center justify-center text-xs font-bold">XP</div>
                                <span className="font-bold">XP</span>
                            </>
                        ) : (
                            <>
                                <div className="w-6 h-6 rounded-full bg-green-500 mr-2 flex items-center justify-center text-xs font-bold text-black">$</div>
                                <span className="font-bold">USDT</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                    <span>환율</span>
                    <span>1 XP ≈ {XP_PRICE} USDT</span>
                </div>
                <div className="flex justify-between text-slate-400">
                    <span>수수료 (0.3%)</span>
                    <span>{(parseFloat(fromAmount || '0') * FEE).toFixed(6)} {direction === 'XP_TO_USDT' ? 'XP' : 'USDT'}</span>
                </div>
            </div>

            <Button size="lg" className="w-full py-4 text-lg" onClick={handleSwap}>
                {isConnected ? '스왑 실행' : '지갑 연결 필요'}
            </Button>
        </div>
      </div>
    </div>
  );
};