import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import { MiningProvider } from './context/MiningContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Market } from './pages/Market';
import { Wallet } from './pages/Wallet';
import { Login } from './pages/Login';
import { Calculator } from './pages/Calculator';
import { FAQ } from './pages/FAQ';
import { About } from './pages/About';
import { Dex } from './pages/Dex';
import { Staking } from './pages/Staking';
import { Lending } from './pages/Lending';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route 
                path="/dashboard" 
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } 
            />
             <Route 
                path="/about" 
                element={
                    <PrivateRoute>
                        <About />
                    </PrivateRoute>
                } 
            />
            <Route 
                path="/market" 
                element={
                    <PrivateRoute>
                        <Market />
                    </PrivateRoute>
                } 
            />
            <Route 
                path="/wallet" 
                element={
                    <PrivateRoute>
                        <Wallet />
                    </PrivateRoute>
                } 
            />
            <Route 
                path="/dex" 
                element={
                    <PrivateRoute>
                        <Dex />
                    </PrivateRoute>
                } 
            />
            <Route
                path="/staking"
                element={
                    <PrivateRoute>
                        <Staking />
                    </PrivateRoute>
                }
            />
            <Route
                path="/lending"
                element={
                    <PrivateRoute>
                        <Lending />
                    </PrivateRoute>
                }
            />
             <Route
                path="/calculator" 
                element={
                    <PrivateRoute>
                        <Calculator />
                    </PrivateRoute>
                } 
            />
             <Route 
                path="/faq" 
                element={
                    <PrivateRoute>
                        <FAQ />
                    </PrivateRoute>
                } 
            />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default function App() {
  return (
    <Router>
        <ToastProvider>
            <AuthProvider>
                <Web3Provider>
                    <MiningProvider>
                        <AppRoutes />
                    </MiningProvider>
                </Web3Provider>
            </AuthProvider>
        </ToastProvider>
    </Router>
  );
}