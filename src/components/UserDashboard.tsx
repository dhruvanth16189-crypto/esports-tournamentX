import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import TournamentsList from './TournamentsList';
import Wallet from './Wallet';
import { Trophy, CreditCard, LayoutList } from 'lucide-react';

export default function UserDashboard({ userEmail }: { userEmail: string }) {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'my-tournaments' | 'wallet'>('tournaments');
  const [balance, setBalance] = useState(0);

  const fetchBalance = async () => {
    try {
      const res = await fetch(`/api/user/profile?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.virtualBalance || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [userEmail]);

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex justify-center overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 hide-scrollbar">
        <div className="bg-neutral-900 border border-neutral-800 p-1 rounded-xl inline-flex whitespace-nowrap min-w-max sm:min-w-0">
          <button 
            onClick={() => setActiveTab('tournaments')}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'tournaments' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <Trophy size={18} /> <span className="hidden sm:inline">Available Matches</span><span className="sm:hidden">Available</span>
          </button>
          <button 
            onClick={() => setActiveTab('my-tournaments')}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'my-tournaments' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <LayoutList size={18} /> <span className="hidden sm:inline">My Matches</span><span className="sm:hidden">Joined</span>
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'wallet' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <CreditCard size={18} /> Wallet
          </button>
        </div>
      </div>

      {activeTab === 'tournaments' && (
        <TournamentsList userEmail={userEmail} filterMode="all" onBalanceUpdate={fetchBalance} />
      )}
      
      {activeTab === 'my-tournaments' && (
        <TournamentsList userEmail={userEmail} filterMode="mine" onBalanceUpdate={fetchBalance} />
      )}

      {activeTab === 'wallet' && (
        <Wallet userEmail={userEmail} balance={balance} onBalanceUpdate={fetchBalance} />
      )}
    </div>
  );
}
