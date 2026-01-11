import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMining } from '../context/MiningContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { ArrowDownLeft, ArrowUpRight, History, Wallet as WalletIcon, Filter, AlertCircle, Hash, Clock } from 'lucide-react';
import { Transaction } from '../types';

export const Wallet: React.FC = () => {
  const { user, updateWalletAddress } = useAuth();
  const { balanceXP, accumulatedXP, transactions, withdrawXP, withdrawalFee } = useMining();
  const { showToast } = useToast();
  
  const [addressInput, setAddressInput] = useState(user?.walletAddress || '');
  const [isEditing, setIsEditing] = useState(!user?.walletAddress);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'PURCHASE' | 'MINING_REWARD'>('ALL');

  const handleSaveAddress = () => {
    if (addressInput.length < 10) {
        showToast("유효한 지갑 주소를 입력해주세요.", 'error');
        return;
    }
    updateWalletAddress(addressInput);
    setIsEditing(false);
    showToast("지갑 주소가 저장되었습니다.", 'success');
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    if (amount + withdrawalFee > balanceXP) {
        showToast(`출금 가능 잔액(수수료 ${withdrawalFee} XP 포함)을 초과했습니다.`, 'error');
        return;
    }
    if (!user?.walletAddress) {
        showToast("출금 주소를 먼저 등록해주세요.", 'error');
        return;
    }

    setIsWithdrawing(true);
    const success = await withdrawXP(amount, user.walletAddress);
    setIsWithdrawing(false);
    
    if (success) {
        setWithdrawAmount('');
        showToast("출금 신청이 완료되었습니다.", 'success');
    } else {
        showToast("출금 신청 처리에 실패했습니다.", 'error');
    }
  };

  const filteredTransactions = transactions.filter(tx => 
      filter === 'ALL' ? true : tx.type === filter
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">지갑 관리 및 정산</h2>
                <p className="text-slate-400">채굴된 XP를 수령할 개인 지갑(Metamask 등)을 관리합니다.</p>
            </div>
        </div>

        {/* Address Card */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                    <WalletIcon className="h-5 w-5 mr-2 text-blue-500" />
                    XP 정산 수신 주소
                </h3>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-blue-400 hover:text-blue-300"
                    >
                        변경하기
                    </button>
                )}
            </div>
            
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                {isEditing ? (
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={addressInput}
                            onChange={(e) => setAddressInput(e.target.value)}
                            placeholder="0x... (Metamask Address)"
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 outline-none"
                        />
                        <Button size="sm" onClick={handleSaveAddress}>저장</Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                         <span className="font-mono text-slate-300 break-all">{user?.walletAddress}</span>
                         <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">인증됨</span>
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
                * Xphere 메인넷을 지원하는 지갑 주소를 입력해야 합니다. 오입금시 복구할 수 없습니다.
            </p>
        </div>

        {/* Balance & Withdraw */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                <h3 className="text-slate-300 text-sm font-medium mb-1">출금 가능 잔액 (Withdrawable)</h3>
                <div className="text-3xl font-bold text-white mb-6">{balanceXP.toFixed(5)} <span className="text-lg text-blue-300">XP</span></div>
                
                <div className="space-y-4">
                    <div className="flex space-x-2">
                        <input 
                            type="number" 
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="출금 수량"
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <Button variant="secondary" onClick={() => {
                            // Max withdrawable = Balance - Fee
                            const max = Math.max(0, balanceXP - withdrawalFee);
                            setWithdrawAmount(Math.floor(max).toString());
                        }}>Max</Button>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                        <span>네트워크 수수료 (Gas)</span>
                        <span>{withdrawalFee} XP</span>
                    </div>

                    <Button 
                        className="w-full bg-blue-500 hover:bg-blue-600"
                        onClick={handleWithdraw}
                        isLoading={isWithdrawing}
                        disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    >
                        출금 신청하기
                    </Button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-3">최소 출금 수량: 100 XP</p>
            </div>
            
             <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col justify-center">
                <h3 className="text-slate-300 text-sm font-medium mb-1">정산 대기 중 (Pending)</h3>
                <div className="text-3xl font-bold text-white mb-2">{accumulatedXP.toFixed(6)} <span className="text-lg text-slate-400">XP</span></div>
                <div className="flex items-center text-xs text-slate-400 mt-1 mb-6">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>실시간 채굴 적립 중...</span>
                </div>

                <div className="border-t border-slate-700 pt-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">다음 정산</span>
                        <span className="text-white">약 30초 내 (데모)</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full animate-pulse" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-right text-xs text-slate-400 mt-2">Distribution Cycle</p>
                </div>

                <div className="mt-4 flex items-start space-x-2 bg-slate-900 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400">
                        자동 채굴량 분배가 완료되면 위 '출금 가능 잔액'으로 이동하며 거래 내역에 기록됩니다.
                    </p>
                </div>
            </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h3 className="font-semibold flex items-center">
                    <History className="h-5 w-5 mr-2 text-slate-400" />
                    거래 내역
                </h3>
                <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
                    {['ALL', 'MINING_REWARD', 'PURCHASE', 'WITHDRAWAL'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t as any)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${
                                filter === t 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white'
                            }`}
                        >
                            {t === 'ALL' ? '전체' : 
                             t === 'MINING_REWARD' ? '채굴 보상' :
                             t === 'PURCHASE' ? '구매' : '출금'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">유형</th>
                            <th className="px-6 py-4">수량</th>
                            <th className="px-6 py-4">수수료</th>
                            <th className="px-6 py-4">상태/Hash</th>
                            <th className="px-6 py-4 text-right">날짜</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-full mr-3 ${
                                            tx.type === 'MINING_REWARD' ? 'bg-purple-900/50 text-purple-400' :
                                            tx.type === 'PURCHASE' ? 'bg-blue-900/50 text-blue-400' :
                                            tx.type === 'DEPOSIT' ? 'bg-green-900/50 text-green-400' :
                                            'bg-slate-700 text-slate-400'
                                        }`}>
                                            {tx.type === 'PURCHASE' || tx.type === 'WITHDRAWAL' 
                                                ? <ArrowUpRight className="h-4 w-4" /> 
                                                : <ArrowDownLeft className="h-4 w-4" />}
                                        </div>
                                        <span className="font-medium text-slate-200">
                                            {tx.type === 'MINING_REWARD' ? '채굴 보상' :
                                             tx.type === 'PURCHASE' ? '채굴기 구매' :
                                             tx.type === 'DEPOSIT' ? '입금' : 
                                             tx.type === 'WITHDRAWAL' ? '출금 신청' : tx.type}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    <span className={tx.type === 'PURCHASE' || tx.type === 'WITHDRAWAL' ? 'text-slate-300' : 'text-green-400'}>
                                        {tx.type === 'PURCHASE' || tx.type === 'WITHDRAWAL' ? '-' : '+'}
                                        {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tx.currency}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400">
                                    {tx.fee ? `-${tx.fee} XP` : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-1 ${
                                            tx.status === 'COMPLETED' ? 'bg-green-900 text-green-300' :
                                            tx.status === 'PENDING' ? 'bg-yellow-900 text-yellow-300' :
                                            'bg-red-900 text-red-300'
                                        }`}>
                                            {tx.status}
                                        </span>
                                        {tx.hash && (
                                            <div className="flex items-center text-xs text-slate-500 font-mono">
                                                <Hash className="w-3 h-3 mr-1" />
                                                {tx.hash.slice(0, 10)}...
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right text-slate-400">
                                    {tx.date}
                                </td>
                            </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    거래 내역이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};