import { useState, useEffect } from 'react';
import { Trophy, Users, Shield, Wallet, Gamepad2, AlertCircle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import AdminDashboard from './components/AdminDashboard.tsx';
import DepositForm from './components/DepositForm.tsx';
import TournamentsList from './components/TournamentsList.tsx';
import Login from './components/Login.tsx';

export default function App() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [view, setView] = useState<'home' | 'admin' | 'deposit'>('home');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') setApiStatus('ok');
        else setApiStatus('error');
      })
      .catch(() => setApiStatus('error'));
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

  if (view === 'admin') {
    return <AdminDashboard userEmail={currentUser?.email || ''} onBack={() => setView('home')} />;
  }

  if (view === 'deposit') {
    return <DepositForm userEmail={currentUser?.email || ''} onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col">
      {/* Top Bar for Firebase Auth Login */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex justify-end items-center gap-4 h-16">
        <Login 
          user={currentUser} 
          onLogin={(user) => setCurrentUser(user)} 
          onLogout={() => setCurrentUser(null)} 
          onNavigate={(view) => setView(view)}
        />
      </div>

      {/* Hero Section */}
      <header className="relative py-20 px-6 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-medium mb-6"
          >
            <Gamepad2 size={16} />
            <span>MERN Stack Powered</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent"
          >
            Free Fire Tournament
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-10"
          >
            Join elite tournaments, compete with professional players, and win massive prize pools. Secure, fast, and competitive.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <button 
              onClick={handleLaunchGame}
              className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center gap-2"
            >
              <ExternalLink size={18} />
              Launch Free Fire MAX
            </button>
            <button className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all active:scale-95">
              Explore Tournaments
            </button>
            <button 
              onClick={() => {
                if (currentUser?.isAdmin) {
                  setView('admin');
                } else {
                  alert("Access Denied: You must be an admin to view this page.");
                }
              }}
              className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <Shield size={18} />
              Admin Dashboard
            </button>
          </motion.div>
        </div>
      </header>

      {/* Backend Status */}
      <section className="px-6 py-12 border-y border-neutral-900 bg-neutral-900/50 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${apiStatus === 'ok' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : apiStatus === 'loading' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-neutral-300">
              API Status: {apiStatus === 'ok' ? 'Online' : apiStatus === 'loading' ? 'Checking...' : 'Disconnected'}
            </span>
          </div>
          {apiStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle size={14} />
              <span>Make sure MONGODB_URI is set in your secrets.</span>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        {currentUser ? (
          <TournamentsList userEmail={currentUser.email} />
        ) : (
          <div className="text-center p-12 bg-neutral-900/50 rounded-2xl border border-neutral-800 text-neutral-400">
            Please sign in to view and join tournaments.
          </div>
        )}
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
    </div>
  );
}
