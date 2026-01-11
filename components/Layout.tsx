import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { LayoutDashboard, ShoppingCart, Wallet, Calculator, HelpCircle, LogOut, Menu, X, User as UserIcon, Zap, Info, ArrowRightLeft, Layers, Coins } from 'lucide-react';
import { Button } from './Button';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isConnected, connectWallet, address, disconnectWallet, balanceUSDT } = useWeb3();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Xphere 소개', href: '/about', icon: Info },
    { name: '채굴기 구매', href: '/market', icon: ShoppingCart },
    { name: '지갑 및 정산', href: '/wallet', icon: Wallet },
    { name: 'Xphere DEX', href: '/dex', icon: ArrowRightLeft },
    { name: '스테이킹', href: '/staking', icon: Layers },
    { name: '렌딩', href: '/lending', icon: Coins },
    { name: '수익 계산기', href: '/calculator', icon: Calculator },
    { name: 'FAQ', href: '/faq', icon: HelpCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-800 border-r border-slate-700">
        <Link to="/" className="p-6 flex items-center space-x-2 border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
            <Zap className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold tracking-tight">Xphere<span className="text-blue-500">Mining</span></span>
        </Link>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 mb-4 px-2">
             <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-slate-300" />
             </div>
             <div>
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
           <Link to="/" className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-500" />
              <span className="font-bold">Xphere</span>
           </Link>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
           </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
           <div className="md:hidden bg-slate-800 p-4 border-b border-slate-700 absolute w-full z-50">
               <nav className="space-y-2">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700"
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                    </Link>
                ))}
                <button 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-700"
                >
                    <LogOut className="h-5 w-5" />
                    <span>로그아웃</span>
                </button>
               </nav>
           </div>
        )}

        {/* Desktop Topbar */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold hidden md:block">
                {navigation.find(n => n.href === location.pathname)?.name || 'Xphere Mining'}
            </h1>
            
            <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
                {isConnected ? (
                    <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-400">Connected</span>
                            <span className="text-sm font-mono text-green-400 font-bold">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-700 mx-2"></div>
                        <div className="flex flex-col items-end">
                             <span className="text-xs text-slate-400">USDT</span>
                             <span className="text-sm font-bold">{balanceUSDT.toLocaleString()}</span>
                        </div>
                        <button onClick={disconnectWallet} className="ml-2 text-slate-400 hover:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <Button onClick={connectWallet} variant="outline" size="sm" className="space-x-2">
                        <Wallet className="h-4 w-4" />
                        <span>지갑 연결 (MetaMask)</span>
                    </Button>
                )}
            </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};