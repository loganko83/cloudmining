import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Zap, Shield, TrendingUp, Cpu, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-800 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
             <Zap className="h-8 w-8 text-blue-500" />
             <span className="text-xl font-bold tracking-tight">Xphere<span className="text-blue-500">Mining</span></span>
          </div>
          <div className="space-x-4">
             <Button variant="outline" onClick={() => navigate('/login')}>로그인</Button>
             <Button onClick={handleStart}>채굴 시작하기</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full transform -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">
            Xphere 블록체인<br />클라우드 마이닝
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            고가의 ASIC XP1 장비 없이도 누구나 손쉽게 XP 코인을 채굴하세요.<br />
            검증된 데이터센터에서 24시간 관리되는 해시파워를 임대해드립니다.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Button size="lg" className="px-10 py-4 text-lg shadow-blue-500/20 shadow-xl" onClick={handleStart}>
                지금 바로 채굴 시작
             </Button>
             <Button size="lg" variant="outline" className="px-10 py-4 text-lg">
                서비스 소개서 보기
             </Button>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <div className="border-y border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 py-10 px-6 text-center">
            <div>
                <div className="text-3xl font-bold text-white mb-1">45.2 EH/s</div>
                <div className="text-sm text-slate-500">Total Network Hashrate</div>
            </div>
            <div>
                <div className="text-3xl font-bold text-white mb-1">12,402</div>
                <div className="text-sm text-slate-500">Active Miners</div>
            </div>
            <div>
                <div className="text-3xl font-bold text-white mb-1">$0.362</div>
                <div className="text-sm text-slate-500">XP Coin Price</div>
            </div>
            <div>
                <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                <div className="text-sm text-slate-500">Uptime</div>
            </div>
        </div>
      </div>

      {/* Features */}
      <section className="py-24 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16">왜 Xphere Mining인가요?</h2>
            <div className="grid md:grid-cols-3 gap-12">
                <div className="p-8 rounded-2xl bg-slate-800 border border-slate-700 hover:border-blue-500 transition-colors">
                    <div className="w-14 h-14 bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                        <Cpu className="h-7 w-7 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">최신 ASIC XP1 장비</h3>
                    <p className="text-slate-400 leading-relaxed">
                        최고 효율을 자랑하는 최신형 ASIC XP1 장비로 채굴 클러스터를 구성하여 최고의 수익률을 보장합니다.
                    </p>
                </div>
                <div className="p-8 rounded-2xl bg-slate-800 border border-slate-700 hover:border-purple-500 transition-colors">
                    <div className="w-14 h-14 bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                        <TrendingUp className="h-7 w-7 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">일일 자동 정산</h3>
                    <p className="text-slate-400 leading-relaxed">
                        복잡한 절차 없이 매일 14:00(KST)에 채굴된 XP가 귀하의 계정으로 자동 정산되어 적립됩니다.
                    </p>
                </div>
                <div className="p-8 rounded-2xl bg-slate-800 border border-slate-700 hover:border-green-500 transition-colors">
                    <div className="w-14 h-14 bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
                        <Shield className="h-7 w-7 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">안전한 자산 보호</h3>
                    <p className="text-slate-400 leading-relaxed">
                        콜드 월렛 시스템과 멀티 시그니처 보안을 통해 고객님의 자산을 외부 위협으로부터 안전하게 보호합니다.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Zap className="h-5 w-5 text-slate-600" />
                <span>© 2024 Xphere Mining Cloud. All rights reserved.</span>
            </div>
            <div className="flex space-x-6">
                <a href="#" className="hover:text-white">이용약관</a>
                <a href="#" className="hover:text-white">개인정보처리방침</a>
                <a href="#" className="hover:text-white">고객센터</a>
            </div>
        </div>
      </footer>
    </div>
  );
};