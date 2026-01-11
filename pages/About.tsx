import React from 'react';
import { Zap, Shield, Globe, Cpu, Server, Activity, Thermometer, Gauge } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">
          Xphere <span className="text-blue-500">Blockchain</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
          Xphere는 차세대 레이어-1 블록체인 솔루션으로, 초고속 트랜잭션과 낮은 수수료, 
          그리고 완벽한 EVM 호환성을 제공합니다.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">100k+</div>
            <div className="text-sm text-slate-500">TPS (초당 거래)</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">< 0.001</div>
            <div className="text-sm text-slate-500">Gas Fee ($)</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">2.4s</div>
            <div className="text-sm text-slate-500">Block Time</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-1">150+</div>
            <div className="text-sm text-slate-500">DApps</div>
        </div>
      </div>

      {/* Feature Sections */}
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
            <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-900/30 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">무한한 확장성</h3>
                    <p className="text-slate-400">
                        Xphere의 독자적인 샤딩(Sharding) 기술은 네트워크 참여자가 늘어날수록 
                        처리 속도가 빨라지는 진정한 탈중앙화 확장성을 제공합니다.
                    </p>
                </div>
            </div>
            <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-900/30 rounded-lg">
                    <Shield className="w-6 h-6 text-green-500" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">엔터프라이즈급 보안</h3>
                    <p className="text-slate-400">
                        양자 내성 암호화 알고리즘과 비잔틴 장애 허용(BFT) 합의 알고리즘을 결합하여
                        금융권 수준의 강력한 보안을 보장합니다.
                    </p>
                </div>
            </div>
             <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-900/30 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">그린 블록체인</h3>
                    <p className="text-slate-400">
                        PoS(Proof of Stake) 기반의 친환경 합의 알고리즘을 채택하여 
                        기존 비트코인 대비 99.9% 낮은 에너지를 소비합니다.
                    </p>
                </div>
            </div>
        </div>
        <div className="bg-gradient-to-br from-blue-900/50 to-slate-800 rounded-2xl p-8 border border-slate-700">
             <h3 className="text-2xl font-bold text-white mb-6">ASIC XP1 채굴 시스템</h3>
             <p className="text-slate-400 mb-6">
                 Xphere Mining Cloud는 전용 채굴기인 **ASIC XP1**을 활용하여 네트워크 보안에 기여하고 보상을 받습니다.
             </p>
             <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                     <div className="flex items-center">
                         <Cpu className="w-5 h-5 text-slate-400 mr-3" />
                         <span className="text-slate-200">Chipset Process</span>
                     </div>
                     <span className="font-mono text-blue-400">4nm AI ASIC</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                     <div className="flex items-center">
                         <Server className="w-5 h-5 text-slate-400 mr-3" />
                         <span className="text-slate-200">Energy Efficiency</span>
                     </div>
                     <span className="font-mono text-green-400">22 J/TH</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                     <div className="flex items-center">
                         <Activity className="w-5 h-5 text-slate-400 mr-3" />
                         <span className="text-slate-200">Network Share</span>
                     </div>
                     <span className="font-mono text-purple-400">12.5%</span>
                 </div>
             </div>
        </div>
      </div>

      {/* Infrastructure Monitoring Section */}
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-2xl font-bold text-white">데이터센터 실시간 현황</h3>
                <p className="text-slate-400 mt-2">Xphere 글로벌 마이닝 센터의 하드웨어 상태를 실시간으로 모니터링합니다.</p>
            </div>
            <div className="flex items-center space-x-2 text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-900/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold">Systems Operational</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* GPU Health */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-slate-300">
                        <Activity className="w-5 h-5 mr-2 text-blue-500" />
                        <span className="font-medium">ASIC/GPU Health</span>
                    </div>
                    <span className="text-xl font-bold text-white">99.98%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '99.98%' }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-3">All nodes are performing optimally.</p>
            </div>

            {/* Temperature */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-slate-300">
                        <Thermometer className="w-5 h-5 mr-2 text-red-500" />
                        <span className="font-medium">Avg Temperature</span>
                    </div>
                    <span className="text-xl font-bold text-white">62.4°C</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-3">Cooling systems running at 45% capacity.</p>
            </div>

            {/* Network Load */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-slate-300">
                        <Gauge className="w-5 h-5 mr-2 text-purple-500" />
                        <span className="font-medium">Network Load</span>
                    </div>
                    <span className="text-xl font-bold text-white">84.2%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                     <div className="bg-purple-500 h-2 rounded-full" style={{ width: '84.2%' }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-3">Stable connection with < 15ms latency.</p>
            </div>
        </div>
      </div>

      {/* Ecosystem Map (Visual Text) */}
      <div className="pt-12 border-t border-slate-800">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Xphere Ecosystem</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {['DeFi', 'NFT Marketplace', 'GameFi', 'Metaverse', 'DAO'].map((item) => (
                <div key={item} className="p-4 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-default">
                    {item}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};