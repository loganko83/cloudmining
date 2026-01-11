import React, { useState } from 'react';
import { useMining } from '../context/MiningContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import {
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Percent,
  Shield,
  AlertTriangle,
  Info,
  Activity
} from 'lucide-react';

type Tab = 'SUPPLY' | 'WITHDRAW' | 'BORROW' | 'REPAY';

export const Lending: React.FC = () => {
  const { balanceXP } = useMining();
  const { showToast } = useToast();

  const [amount, setAmount] = useState<string>('');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('SUPPLY');

  // Pool stats (mock data - will be fetched from backend)
  const poolStats = {
    totalSupplied: 5420000,
    totalBorrowed: 3250000,
    utilization: 60,
    supplyAPY: 4.25,
    borrowAPY: 6.80,
    ltv: 75,
    liquidationThreshold: 80,
    liquidationBonus: 5,
  };

  // User positions (mock data)
  const userPosition = {
    supplied: 0,
    borrowed: 0,
    collateral: 0,
    healthFactor: 0,
    earnedInterest: 0,
    accruedInterest: 0,
  };

  const handleAction = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      showToast("유효한 금액을 입력해주세요.", 'error');
      return;
    }

    switch (activeTab) {
      case 'SUPPLY':
        if (val > balanceXP) {
          showToast("보유 XP가 부족합니다.", 'error');
          return;
        }
        showToast(`${val.toFixed(4)} XP가 렌딩 풀에 공급되었습니다. XPx 토큰을 받았습니다.`, 'success');
        break;
      case 'WITHDRAW':
        if (val > userPosition.supplied) {
          showToast("공급된 XP가 부족합니다.", 'error');
          return;
        }
        showToast(`${val.toFixed(4)} XP를 인출했습니다.`, 'success');
        break;
      case 'BORROW':
        const collateral = parseFloat(collateralAmount);
        if (isNaN(collateral) || collateral <= 0) {
          showToast("담보 금액을 입력해주세요.", 'error');
          return;
        }
        if (collateral > balanceXP) {
          showToast("담보로 제공할 XP가 부족합니다.", 'error');
          return;
        }
        const maxBorrow = collateral * (poolStats.ltv / 100);
        if (val > maxBorrow) {
          showToast(`LTV ${poolStats.ltv}% 기준, 최대 ${maxBorrow.toFixed(4)} XP까지 대출 가능합니다.`, 'error');
          return;
        }
        showToast(`${val.toFixed(4)} XP를 대출 받았습니다. 담보: ${collateral.toFixed(4)} XP`, 'success');
        break;
      case 'REPAY':
        if (val > balanceXP) {
          showToast("상환할 XP가 부족합니다.", 'error');
          return;
        }
        showToast(`${val.toFixed(4)} XP를 상환했습니다.`, 'success');
        break;
    }
    setAmount('');
    setCollateralAmount('');
  };

  const getHealthFactorColor = (hf: number) => {
    if (hf === 0) return 'text-slate-400';
    if (hf >= 2) return 'text-green-400';
    if (hf >= 1.2) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Coins className="mr-2 text-emerald-500" />
          XP 렌딩 (Lending Pool)
        </h2>
        <p className="text-slate-400">
          XP를 공급하여 이자를 얻거나, 담보를 예치하고 XP를 대출 받으세요.
        </p>
      </div>

      {/* Pool Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-900/50 to-slate-800 p-4 rounded-xl border border-emerald-700/50">
          <div className="flex items-center text-emerald-300 text-sm mb-1">
            <TrendingUp className="w-4 h-4 mr-1" />
            공급 APY
          </div>
          <div className="text-2xl font-bold text-white">{poolStats.supplyAPY}%</div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/50 to-slate-800 p-4 rounded-xl border border-orange-700/50">
          <div className="flex items-center text-orange-300 text-sm mb-1">
            <Percent className="w-4 h-4 mr-1" />
            대출 APY
          </div>
          <div className="text-2xl font-bold text-white">{poolStats.borrowAPY}%</div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">총 공급량 (TVL)</div>
          <div className="text-xl font-bold text-white">{poolStats.totalSupplied.toLocaleString()} XP</div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">활용률</div>
          <div className="text-xl font-bold text-white">{poolStats.utilization}%</div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              style={{ width: `${poolStats.utilization}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Position */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">나의 포지션</h3>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">공급된 XP</span>
                <span className="text-emerald-400 font-medium">{userPosition.supplied.toFixed(4)} XP</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-500">누적 이자 수익</span>
                <span className="text-emerald-300">+{userPosition.earnedInterest.toFixed(4)} XP</span>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">대출 원금</span>
                <span className="text-orange-400 font-medium">{userPosition.borrowed.toFixed(4)} XP</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-500">발생 이자</span>
                <span className="text-orange-300">+{userPosition.accruedInterest.toFixed(4)} XP</span>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">예치된 담보</span>
                <span className="text-white font-medium">{userPosition.collateral.toFixed(4)} XP</span>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center text-sm">
                  <Shield className="w-4 h-4 mr-1" />
                  건강 지수
                </span>
                <span className={`text-lg font-bold ${getHealthFactorColor(userPosition.healthFactor)}`}>
                  {userPosition.healthFactor === 0 ? '-' : userPosition.healthFactor.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                1.0 미만 시 청산 대상
              </p>
            </div>
          </div>

          {/* Risk Parameters */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3">리스크 파라미터</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">최대 담보 대출 비율 (LTV)</span>
                <span className="text-white">{poolStats.ltv}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">청산 임계값</span>
                <span className="text-white">{poolStats.liquidationThreshold}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">청산 보너스</span>
                <span className="text-white">{poolStats.liquidationBonus}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {/* Tabs */}
            <div className="grid grid-cols-4 border-b border-slate-700">
              {(['SUPPLY', 'WITHDRAW', 'BORROW', 'REPAY'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-center text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-slate-800 text-white border-b-2 border-emerald-500'
                      : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab === 'SUPPLY' && '공급'}
                  {tab === 'WITHDRAW' && '인출'}
                  {tab === 'BORROW' && '대출'}
                  {tab === 'REPAY' && '상환'}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {/* Supply/Withdraw Tab Content */}
              {(activeTab === 'SUPPLY' || activeTab === 'WITHDRAW') && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 flex justify-between">
                      <span>{activeTab === 'SUPPLY' ? '공급할 XP' : '인출할 XP'}</span>
                      <span className="text-slate-500">
                        가용: <span className="text-white">
                          {activeTab === 'SUPPLY'
                            ? balanceXP.toFixed(4)
                            : userPosition.supplied.toFixed(4)
                          } XP
                        </span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-4 pr-20 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="0.00"
                      />
                      <button
                        onClick={() => setAmount(
                          activeTab === 'SUPPLY'
                            ? Math.floor(balanceXP).toString()
                            : userPosition.supplied.toString()
                        )}
                        className="absolute right-2 top-2 bg-slate-700 text-xs px-2 py-1.5 rounded text-emerald-300 hover:bg-slate-600"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <div className="bg-emerald-900/20 border border-emerald-900 rounded-lg p-4 flex items-start space-x-3">
                    <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      {activeTab === 'SUPPLY' ? (
                        <>
                          <p className="font-bold text-emerald-300 mb-1">XP 공급 시 혜택</p>
                          XP를 공급하면 XPx 토큰을 받게 됩니다. XPx는 시간이 지남에 따라 이자가 자동으로 누적되며,
                          언제든지 XP로 교환할 수 있습니다.
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-emerald-300 mb-1">XP 인출 안내</p>
                          XPx를 소각하여 원금 + 누적 이자를 XP로 인출합니다.
                          풀의 유동성이 부족할 경우 일부 인출이 제한될 수 있습니다.
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Borrow Tab Content */}
              {activeTab === 'BORROW' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 flex justify-between">
                      <span>담보로 제공할 XP</span>
                      <span className="text-slate-500">
                        가용: <span className="text-white">{balanceXP.toFixed(4)} XP</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-4 pr-20 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="0.00"
                      />
                      <button
                        onClick={() => setCollateralAmount(Math.floor(balanceXP).toString())}
                        className="absolute right-2 top-2 bg-slate-700 text-xs px-2 py-1.5 rounded text-orange-300 hover:bg-slate-600"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <ArrowDownCircle className="w-6 h-6 text-slate-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 flex justify-between">
                      <span>대출할 XP</span>
                      <span className="text-slate-500">
                        최대: <span className="text-white">
                          {((parseFloat(collateralAmount) || 0) * poolStats.ltv / 100).toFixed(4)} XP
                        </span>
                      </span>
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="bg-orange-900/20 border border-orange-900 rounded-lg p-4 flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      <p className="font-bold text-orange-400 mb-1">청산 리스크 주의</p>
                      담보 가치가 하락하거나 이자가 누적되면 건강 지수가 1.0 미만으로 떨어질 수 있습니다.
                      이 경우 담보가 {poolStats.liquidationBonus}% 페널티와 함께 청산됩니다.
                    </div>
                  </div>
                </>
              )}

              {/* Repay Tab Content */}
              {activeTab === 'REPAY' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 flex justify-between">
                      <span>상환할 XP</span>
                      <span className="text-slate-500">
                        대출 잔액: <span className="text-orange-400">
                          {(userPosition.borrowed + userPosition.accruedInterest).toFixed(4)} XP
                        </span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-4 pr-20 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="0.00"
                      />
                      <button
                        onClick={() => setAmount(
                          (userPosition.borrowed + userPosition.accruedInterest).toString()
                        )}
                        className="absolute right-2 top-2 bg-slate-700 text-xs px-2 py-1.5 rounded text-emerald-300 hover:bg-slate-600"
                      >
                        전액
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-900 rounded-lg p-4 flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      <p className="font-bold text-blue-300 mb-1">대출 상환 안내</p>
                      대출을 전액 상환하면 예치된 담보가 자동으로 반환됩니다.
                      부분 상환 시 건강 지수가 개선됩니다.
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleAction}
                className={`w-full py-4 text-lg ${
                  activeTab === 'SUPPLY' || activeTab === 'REPAY'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : activeTab === 'BORROW'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-slate-600 hover:bg-slate-700'
                }`}
              >
                {activeTab === 'SUPPLY' && (
                  <><ArrowDownCircle className="w-5 h-5 mr-2 inline" /> XP 공급하기</>
                )}
                {activeTab === 'WITHDRAW' && (
                  <><ArrowUpCircle className="w-5 h-5 mr-2 inline" /> XP 인출하기</>
                )}
                {activeTab === 'BORROW' && (
                  <><Activity className="w-5 h-5 mr-2 inline" /> XP 대출 받기</>
                )}
                {activeTab === 'REPAY' && (
                  <><Coins className="w-5 h-5 mr-2 inline" /> 대출 상환하기</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
