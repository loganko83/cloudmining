import React, { useState, useMemo } from 'react';
import { MOCK_PLANS } from '../constants';
import { Calculator as CalcIcon, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export const Calculator: React.FC = () => {
  const [investmentUSDT, setInvestmentUSDT] = useState<number>(1000);
  
  // Constants
  const XP_PRICE = 0.362; // USDT
  
  // Find best combination logic (Simplified for demo: just ratio based on Standard Node)
  // Standard Node: 500 USDT -> 7.5 XP/Day
  // 1 USDT -> 0.015 XP/Day
  const XP_PER_USDT_DAILY = 0.015;

  const results = useMemo(() => {
    const dailyXP = investmentUSDT * XP_PER_USDT_DAILY;
    const dailyUSDT = dailyXP * XP_PRICE;
    
    return {
      daily: { xp: dailyXP, usdt: dailyUSDT },
      weekly: { xp: dailyXP * 7, usdt: dailyUSDT * 7 },
      monthly: { xp: dailyXP * 30, usdt: dailyUSDT * 30 },
      yearly: { xp: dailyXP * 365, usdt: dailyUSDT * 365 },
      roiDays: investmentUSDT / dailyUSDT
    };
  }, [investmentUSDT]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center">
          <CalcIcon className="mr-2 text-blue-500" />
          수익률 계산기
        </h2>
        <p className="text-slate-400">투자 금액에 따른 예상 채굴 수익을 확인해보세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="md:col-span-1 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-fit">
          <label className="block text-sm font-medium text-slate-300 mb-2">투자 금액 (USDT)</label>
          <div className="relative rounded-md shadow-sm mb-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-400 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              className="block w-full rounded-md border-slate-600 bg-slate-900 pl-7 py-3 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="0.00"
              value={investmentUSDT}
              onChange={(e) => setInvestmentUSDT(Number(e.target.value))}
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-2">빠른 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {[100, 500, 1000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setInvestmentUSDT(amt)}
                  className={`px-3 py-2 text-sm rounded-lg border ${
                    investmentUSDT === amt 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div className="text-slate-400 text-sm mb-1 flex items-center"><TrendingUp className="w-4 h-4 mr-1"/>일간 수익</div>
                <div className="text-xl font-bold text-white">{results.daily.xp.toFixed(2)} XP</div>
                <div className="text-sm text-green-400">≈ ${results.daily.usdt.toFixed(2)}</div>
             </div>
             <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div className="text-slate-400 text-sm mb-1 flex items-center"><Calendar className="w-4 h-4 mr-1"/>월간 수익</div>
                <div className="text-xl font-bold text-white">{results.monthly.xp.toFixed(2)} XP</div>
                <div className="text-sm text-green-400">≈ ${results.monthly.usdt.toFixed(2)}</div>
             </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900 to-slate-800 p-6 rounded-xl border border-blue-800">
            <h3 className="text-lg font-semibold text-white mb-4">예상 ROI (투자 회수 기간)</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-bold text-white">{Math.round(results.roiDays)}</span>
              <span className="text-lg text-blue-300 mb-1">일</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              * 현재 XP 가격($0.362) 및 난이도 기준이며, 시장 상황에 따라 변동될 수 있습니다.
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">상세 분석</h3>
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 border-b border-slate-700">
                <tr>
                  <th className="py-2">기간</th>
                  <th className="py-2">예상 채굴량</th>
                  <th className="py-2">예상 수익 (USDT)</th>
                </tr>
              </thead>
              <tbody className="text-slate-300 divide-y divide-slate-700">
                <tr>
                  <td className="py-3">1주</td>
                  <td>{results.weekly.xp.toFixed(2)} XP</td>
                  <td>${results.weekly.usdt.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-3">1개월</td>
                  <td>{results.monthly.xp.toFixed(2)} XP</td>
                  <td>${results.monthly.usdt.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-3">1년</td>
                  <td>{results.yearly.xp.toFixed(2)} XP</td>
                  <td>${results.yearly.usdt.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};