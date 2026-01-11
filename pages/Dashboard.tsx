import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_DATA } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useMining } from '../context/MiningContext';
import { Cpu, Pickaxe, Coins, TrendingUp, Server, Activity, Thermometer, Clock, RefreshCw } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string; subValue?: string; icon: React.ElementType; color: string }> = ({ title, value, subValue, icon: Icon, color }) => (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110 ${color.replace('text-', 'bg-')}`}></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
            <div className={`p-2 rounded-lg bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </div>
        <div className="flex flex-col relative z-10">
            <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
            {subValue && <span className="text-sm text-slate-500 mt-1">{subValue}</span>}
        </div>
    </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { balanceXP, accumulatedXP, hashrate, ownedMachines } = useMining();
  
  // Calculate estimated daily return based on hashrate
  // We can also sum up from ownedMachines directly for display if we wanted to be perfectly consistent with context,
  // but approximation here is fine for the "Estimated" card or we can import MOCK_PLANS. 
  // Let's stick to the simple approximation for the dashboard card.
  const estimatedDaily = (hashrate / 55) * 7.5; 

  const totalAssets = balanceXP + accumulatedXP;

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-white">반갑습니다, {user?.name}님!</h2>
                <p className="text-slate-400">Xphere ASIC XP1 채굴 현황입니다.</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-900/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold">Live Mining Active</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="총 자산 (Total Assets)" 
                value={`${totalAssets.toFixed(4)} XP`}
                subValue={`≈ $${(totalAssets * 0.362).toFixed(3)} USDT`}
                icon={Pickaxe} 
                color="text-purple-500" 
            />
             <StatCard 
                title="실시간 채굴 (미지급)" 
                value={`${accumulatedXP.toFixed(6)} XP`}
                subValue="다음 정산 시 지갑으로 이동"
                icon={RefreshCw} 
                color="text-yellow-500" 
            />
            <StatCard 
                title="나의 해시레이트" 
                value={`${hashrate} TH/s`}
                subValue={`Active: ${ownedMachines.filter(m => m.status === 'ONLINE').length} Machines`}
                icon={Cpu} 
                color="text-blue-500" 
            />
            <StatCard 
                title="일일 예상 수익" 
                value={`${estimatedDaily.toFixed(2)} XP`}
                subValue="24시간 기준 추정치"
                icon={TrendingUp} 
                color="text-green-500" 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                    <h3 className="text-lg font-semibold mb-6">채굴 수익 추이 (7일)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={CHART_DATA}>
                                <defs>
                                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#60a5fa' }}
                                />
                                <Area type="monotone" dataKey="xp" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* Machine List */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h3 className="font-semibold text-lg">가동 중인 채굴기 목록</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900 text-slate-400 uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">기기명</th>
                                    <th className="px-6 py-4">해시레이트</th>
                                    <th className="px-6 py-4">상태</th>
                                    <th className="px-6 py-4">세부 정보</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {ownedMachines.map((machine, idx) => (
                                    <tr key={machine.id} className="hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-medium text-white flex items-center">
                                            <Server className="h-4 w-4 mr-2 text-slate-400" />
                                            {machine.machineName}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-blue-300">{machine.hashrate} TH/s</td>
                                        <td className="px-6 py-4">
                                            {machine.status === 'ONLINE' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-300 border border-green-800">
                                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
                                                    Mining
                                                </span>
                                            ) : machine.status === 'MAINTENANCE' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-900 text-yellow-300 border border-yellow-800">
                                                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5"></div>
                                                    Maintenance
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                                                    Offline
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-4 text-xs text-slate-400">
                                                <div className="flex items-center" title="Device Temperature">
                                                    <Thermometer className="w-3 h-3 mr-1" />
                                                    {machine.status === 'ONLINE' ? `${65 + (idx % 5)}°C` : '-'}
                                                </div>
                                                <div className="flex items-center" title="Uptime">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {machine.status === 'ONLINE' ? '99.9%' : '0%'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {ownedMachines.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            보유한 채굴기가 없습니다. 마켓에서 구매해주세요.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-fit">
                <h3 className="text-lg font-semibold mb-4">네트워크 상태</h3>
                <div className="space-y-6 flex-1">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Total Network Hashrate</span>
                            <span className="text-slate-200">45.2 EH/s</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                    </div>
                    <div>
                         <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Network Difficulty</span>
                            <span className="text-slate-200">32.41 T</span>
                        </div>
                         <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                    </div>
                    <div>
                         <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Active Miners</span>
                            <span className="text-slate-200">12,402</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg">
                        <p className="text-xs text-slate-500 mb-2">XP Coin Price (Oracle)</p>
                        <div className="flex items-end space-x-2">
                            <span className="text-2xl font-bold text-white">$0.362</span>
                            <span className="text-sm text-green-400 mb-1">▲ 1.2%</span>
                        </div>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-900 p-4 rounded-lg">
                        <p className="text-xs text-blue-300 mb-1 font-bold">📢 공지사항</p>
                        <p className="text-sm text-slate-300">
                            XP1 펌웨어 업데이트가 예정되어 있습니다. 채굴 중단 없이 진행됩니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};