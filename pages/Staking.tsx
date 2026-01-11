import React, { useState } from 'react';
import { useMining } from '../context/MiningContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { Layers, Lock, TrendingUp, Clock, AlertCircle, Info } from 'lucide-react';

export const Staking: React.FC = () => {
  const { balanceXP } = useMining();
  const { showToast } = useToast();
  
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'STAKE' | 'UNSTAKE'>('STAKE');

  const APR = 12.5; // %

  const handleAction = () => {
      const val = parseFloat(stakeAmount);
      if (isNaN(val) || val <= 0) return;

      if (activeTab === 'STAKE') {
          if (val > balanceXP) {
              showToast("보유 XP가 부족합니다.", 'error');
              return;
          }
          showToast(`${val} XP가 스테이킹 되었습니다. 이자가 발생합니다.`, 'success');
      } else {
          showToast(`${val} XP 언스테이킹 신청 완료 (락업 해제 대기 7일)`, 'info');
      }
      setStakeAmount('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Layers className="mr-2 text-purple-500" />
          XP 스테이킹 (Staking)
        </h2>
        <p className="text-slate-400">보유한 XP를 예치하고 네트워크 검증 보상(이자)을 추가로 획득하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stats Column */}
          <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-900 to-slate-800 p-6 rounded-xl border border-purple-700 shadow-lg">
                  <div className="flex items-center mb-2 text-purple-200">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      <span className="font-medium">예상 연이율 (APR)</span>
                  </div>
                  <div className="text-4xl font-bold text-white">{APR}%</div>
                  <p className="text-xs text-purple-300 mt-2">* 네트워크 상황에 따라 변동 가능</p>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                   <h3 className="text-slate-400 text-sm mb-1">총 스테이킹 수량 (TVL)</h3>
                   <div className="text-2xl font-bold text-white">12,405,922 XP</div>
                   <div className="text-sm text-slate-500">≈ $4,490,943 USD</div>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                   <h3 className="text-slate-400 text-sm mb-1">나의 스테이킹 자산</h3>
                   <div className="text-2xl font-bold text-white">0.0000 XP</div>
                   <div className="flex justify-between mt-4 text-sm border-t border-slate-700 pt-3">
                       <span className="text-slate-400">누적 이자 수익</span>
                       <span className="text-green-400">+0.00 XP</span>
                   </div>
              </div>
          </div>

          {/* Action Column */}
          <div className="md:col-span-2">
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="flex border-b border-slate-700">
                      <button 
                        onClick={() => setActiveTab('STAKE')}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'STAKE' ? 'bg-slate-800 text-white border-b-2 border-purple-500' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
                      >
                          예치하기 (Stake)
                      </button>
                      <button 
                        onClick={() => setActiveTab('UNSTAKE')}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'UNSTAKE' ? 'bg-slate-800 text-white border-b-2 border-purple-500' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
                      >
                          출금하기 (Unstake)
                      </button>
                  </div>

                  <div className="p-8 space-y-6">
                      <div className="space-y-2">
                          <label className="text-sm text-slate-300 flex justify-between">
                              <span>수량 입력</span>
                              <span className="text-slate-500">
                                  가용 자산: <span className="text-white">{balanceXP.toFixed(4)} XP</span>
                              </span>
                          </label>
                          <div className="relative">
                              <input 
                                type="number" 
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-4 pr-20 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                placeholder="0.00"
                              />
                              <button 
                                onClick={() => setStakeAmount(Math.floor(balanceXP).toString())}
                                className="absolute right-2 top-2 bg-slate-700 text-xs px-2 py-1.5 rounded text-purple-300 hover:bg-slate-600"
                              >
                                  MAX
                              </button>
                          </div>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-900 rounded-lg p-4 flex items-start space-x-3">
                          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-slate-300">
                              <p className="font-bold text-blue-300 mb-1">이자 계산 방식</p>
                              XP는 매일 복리로 이자가 지급됩니다. 스테이킹된 자산은 네트워크 보안 및 거버넌스 투표권으로 활용됩니다.
                          </div>
                      </div>

                      {activeTab === 'UNSTAKE' && (
                          <div className="bg-yellow-900/20 border border-yellow-900 rounded-lg p-4 flex items-start space-x-3">
                              <Lock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-slate-300">
                                  <p className="font-bold text-yellow-500 mb-1">락업 해제 기간 (Unbonding Period)</p>
                                  네트워크 안정성을 위해 언스테이킹 신청 후 <span className="text-white font-bold">7일간</span> 자산이 잠기며, 이 기간 동안에는 이자가 발생하지 않습니다.
                              </div>
                          </div>
                      )}

                      <Button 
                        onClick={handleAction}
                        className={`w-full py-4 text-lg ${activeTab === 'STAKE' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-600 hover:bg-slate-700'}`}
                      >
                          {activeTab === 'STAKE' ? '스테이킹 시작하기' : '언스테이킹 신청'}
                      </Button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};