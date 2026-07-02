import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Trophy, Users, Shield, Wallet, Gamepad2, AlertCircle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import AdminDashboard from './components/AdminDashboard.tsx';
import DepositForm from './components/DepositForm.tsx';
import TournamentsList from './components/TournamentsList.tsx';
import Login from './components/Login.tsx';

function AppContent() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') setApiStatus('ok');
        else setApiStatus('error');
      })
      .catch(() => setApiStatus('error'));
  }, []);

  // Try to load user from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setCurrentUser(profile);
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }
  }, []);

  const handleLaunchGame = () => {
    const intentUrl = 'intent://#Intent;scheme=com.garena.freefiremax;package=com.dts.freefiremax;end';
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.dts.freefiremax';
    window.location.href = intentUrl;
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.open(playStoreUrl, '_blank');
      }
    }, 1500);
  };

  const TopBar = () => (
    <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex justify-end items-center gap-4 h-16">
      <Login 
        user={currentUser} 
        onLogin={(user) => setCurrentUser(user)} 
        onLogout={() => { setCurrentUser(null); navigate('/login'); }} 
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col">
      <Routes>
        <Route path="/login" element={
          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-8 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
            >
              Free Fire Tournament
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl flex flex-col items-center gap-6 text-center max-w-md w-full"
            >
              <h2 className="text-xl font-semibold">Sign In Required</h2>
              <p className="text-neutral-400 text-sm">Please sign in with your Google account to participate in tournaments, manage your balance, and access your dashboard.</p>
              <Login 
                user={currentUser} 
                onLogin={(user) => setCurrentUser(user)} 
                onLogout={() => { setCurrentUser(null); navigate('/login'); }} 
              />
            </motion.div>
          </div>
        } />
        
        <Route path="/admin" element={
          currentUser?.email === 'dhruvanth16189@gmail.com' ? (
            <AdminDashboard userEmail={currentUser.email} onBack={() => navigate('/dashboard')} />
          ) : (
            <Navigate to={currentUser ? "/dashboard" : "/login"} replace />
          )
        } />

        <Route path="/dashboard" element={
          currentUser ? (
            <>
              <TopBar />
              {/* Hero Section */}
              <header className="relative py-12 px-6 overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent"
                  >
                    Welcome back, {currentUser.name}
                  </motion.h1>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap justify-center gap-4"
                  >
                    <button 
                      onClick={handleLaunchGame}
                      className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center gap-2"
                    >
                      <ExternalLink size={18} />
                      Launch Free Fire MAX
                    </button>
                    {currentUser.email === 'dhruvanth16189@gmail.com' && (
                      <button 
                        onClick={() => navigate('/admin')}
                        className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Shield size={18} />
                        Admin Dashboard
                      </button>
                    )}
                  </motion.div>
                </div>
              </header>

              {/* Backend Status */}
              <section className="px-6 py-4 border-y border-neutral-900 bg-neutral-900/50 flex-shrink-0">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${apiStatus === 'ok' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : apiStatus === 'loading' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-neutral-300">
                      API Status: {apiStatus === 'ok' ? 'Online' : apiStatus === 'loading' ? 'Checking...' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Main Content */}
              <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
                <TournamentsList userEmail={currentUser.email} />
              </main>

              {/* Stats */}
              <footer className="py-12 border-t border-neutral-900 flex-shrink-0">
                <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-500">10k+</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Players</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-500">$50k+</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Distributed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-500">500+</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Daily Matches</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-500">24/7</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Support</div>
                  </div>
                </div>
              </footer>
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        
        {/* Add a catch-all route to redirect / to /dashboard (or /login if not authed) */}
        <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
