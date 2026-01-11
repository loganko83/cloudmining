import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Zap } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) {
      navigate('/');
    } else {
      alert('로그인 실패: 이메일과 비밀번호를 확인하세요.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-900/30 text-blue-500 mb-4">
                    <Zap className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Xphere Mining Cloud</h1>
                <p className="text-slate-400">로그인하여 채굴 현황을 확인하세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">이메일</label>
                    <input 
                        type="email" 
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="user@xphere.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">비밀번호</label>
                    <input 
                        type="password" 
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <Button type="submit" className="w-full py-3" isLoading={isLoading}>
                    로그인
                </Button>
            </form>
            
            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                    계정이 없으신가요? <button onClick={() => alert("데모 버전입니다. 아무 이메일/비밀번호로 로그인하세요.")} className="text-blue-400 hover:underline">회원가입</button>
                </p>
                <div className="mt-4 p-3 bg-slate-900/50 rounded text-xs text-slate-500">
                    Tip: 데모입니다. 아무 값이나 입력하면 로그인됩니다.
                </div>
            </div>
        </div>
    </div>
  );
};