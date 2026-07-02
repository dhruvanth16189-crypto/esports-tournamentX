import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Users, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Tournament {
  _id: string;
  matchMode: string;
  subMode: string;
  entryFee: number;
  prizePool: number;
  startTime: string;
  matchStatus: 'scheduled' | 'full' | 'ongoing' | 'completed';
  registeredUsers: string[];
}

export default function TournamentsList({ userEmail }: { userEmail: string }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState('');

  const fetchData = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        fetch('/api/tournaments'),
        fetch(`/api/user/profile?email=${encodeURIComponent(userEmail)}`)
      ]);
      if (tRes.ok) setTournaments(await tRes.json());
      if (uRes.ok) {
        const uData = await uRes.json();
        setBalance(uData.virtualBalance || 0);
        setUserId(uData._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [userEmail]);

  const handleJoin = async (t: Tournament) => {
    if (balance < t.entryFee) {
      alert(`Insufficient balance! You need ₹${t.entryFee} to join.`);
      return;
    }
    
    if (confirm(`Join this match for ₹${t.entryFee}?`)) {
      try {
        const res = await fetch(`/api/tournaments/${t._id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });
        
        if (res.ok) {
          alert('Successfully joined the tournament!');
          fetchData();
        } else {
          const err = await res.json();
          alert(`Failed to join: ${err.error}`);
        }
      } catch (err) {
        console.error(err);
        alert('Network error');
      }
    }
  };

  const calculateTimeLeft = (startTime: string) => {
    const diff = new Date(startTime).getTime() - new Date().getTime();
    if (diff <= 0) return 'Started/Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)} days left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Upcoming Matches</h2>
          <p className="text-neutral-400">Join a match and prove your skills</p>
        </div>
        <div className="text-right bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
          <div className="text-xs text-neutral-400">Your Balance</div>
          <div className="text-lg font-bold text-orange-500">₹{balance}</div>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center p-12 bg-neutral-900 rounded-2xl border border-neutral-800 text-neutral-500">
          No tournaments available at the moment.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {tournaments.map((t) => (
            <motion.div 
              key={t._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-colors"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t.matchMode} - {t.subMode}</h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-400 mt-1">
                        <Clock size={14} />
                        {new Date(t.startTime).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium uppercase tracking-wider ${
                    t.matchStatus === 'scheduled' ? 'bg-blue-500/10 text-blue-400' :
                    t.matchStatus === 'completed' ? 'bg-neutral-800 text-neutral-400' :
                    'bg-orange-500/10 text-orange-400'
                  }`}>
                    {t.matchStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-800 mb-4">
                  <div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Entry Fee</div>
                    <div className="text-lg font-semibold">₹{t.entryFee}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Prize Pool</div>
                    <div className="text-lg font-bold text-orange-500">₹{t.prizePool}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Users size={16} />
                    {t.registeredUsers.length} Players Registered
                  </div>
                  
                  {t.matchStatus === 'scheduled' && (
                    <button
                      onClick={() => handleJoin(t)}
                      disabled={t.registeredUsers.includes(userId)}
                      className="px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors active:scale-95"
                    >
                      {t.registeredUsers.includes(userId) ? 'Joined' : 'Join Match'}
                    </button>
                  )}
                </div>
              </div>
              
              {t.matchStatus === 'scheduled' && (
                <div className="bg-neutral-950 px-6 py-3 text-sm text-center text-orange-400 font-medium">
                  Starts in {calculateTimeLeft(t.startTime)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
