import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Plus, Trophy, ChevronRight, CheckCircle, ArrowLeft, Loader2, Calendar, Clock } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface User {
  _id: string;
  name: string;
  email: string;
  virtualBalance: number;
}

interface Tournament {
  _id: string;
  matchMode: string;
  subMode: string;
  entryFee: number;
  prizePool: number;
  startTime: string;
  matchStatus: 'scheduled' | 'full' | 'ongoing' | 'completed';
  registeredUsers: User[];
  createdAt: string;
}

const MATCH_MODES = {
  BR: ['Solo', 'Duo', 'Squad (4v4)'],
  CS: ['1v1', '2v2', '4v4', '6v6'],
  LW: ['1v1', '2v2']
};

interface Transaction {
  _id: string;
  userId: User;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'approved' | 'denied';
  txnID: string;
  upiId?: string;
  createdAt: string;
}

export default function AdminDashboard({ 
  userEmail, 
  onBack 
}: { 
  userEmail: string; 
  onBack: () => void;
}) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'transactions' | 'settings'>('tournaments');
  const [adminUpiId, setAdminUpiId] = useState('');
  const [serverTime, setServerTime] = useState<number>(0);
  
  // Form State
  const [matchMode, setMatchMode] = useState<keyof typeof MATCH_MODES>('BR');
  const [subMode, setSubMode] = useState(MATCH_MODES.BR[0]);
  const [entryFee, setEntryFee] = useState(0);
  const [prizePool, setPrizePool] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Security Check
  useEffect(() => {
    if (userEmail !== 'dhruvanth16189@gmail.com') {
      onBack();
    }
  }, [userEmail, onBack]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, trRes, sRes, timeRes] = await Promise.all([
        fetch(`/api/admin/tournaments?email=${encodeURIComponent(userEmail)}`),
        fetch(`/api/admin/transactions?email=${encodeURIComponent(userEmail)}`),
        fetch('/api/payment-settings'),
        fetch('/api/server-time')
      ]);
      
      if (tRes.ok) {
        const data = await tRes.json();
        setTournaments(data);
      }
      if (trRes.ok) {
        const data = await trRes.json();
        setTransactions(data);
      }
      if (sRes.ok) {
        const data = await sRes.json();
        if (data.upiId) setAdminUpiId(data.upiId);
      }
      if (timeRes.ok) {
        const data = await timeRes.json();
        setServerTime(data.serverTime);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, upiId: adminUpiId })
      });
      if (res.ok) alert('Settings saved successfully');
      else alert('Failed to save settings');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userEmail === 'dhruvanth16189@gmail.com') {
      fetchData();
    }
  }, [userEmail]);

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as keyof typeof MATCH_MODES;
    setMatchMode(mode);
    setSubMode(MATCH_MODES[mode][0]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tournaments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          matchMode,
          subMode,
          entryFee,
          prizePool,
          startTime
        })
      });
      if (res.ok) {
        fetchData();
        setEntryFee(0);
        setPrizePool(0);
        setStartTime(null);
      } else {
        alert('Failed to create tournament');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclareWinner = async (tournamentId: string, winnerId: string) => {
    if (!confirm('Are you sure you want to declare this user as the winner? The prize pool will be distributed.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, winnerId })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to declare winner');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceStart = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to force start this tournament?')) return;
    
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/force-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to force start');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceEnd = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to force end this tournament without a winner?')) return;
    
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/force-end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to force end');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransactionAction = async (transactionId: string, action: 'approve' | 'deny') => {
    if (!confirm(`Are you sure you want to ${action} this transaction?`)) return;

    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert(`Failed to ${action} transaction`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (userEmail !== 'dhruvanth16189@gmail.com') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-6 gap-4 sm:gap-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Shield size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-neutral-400">Manage tournaments and results</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-2 text-xs sm:text-sm ml-14 sm:ml-0">
            <div className="bg-neutral-900 px-4 py-2 rounded-full border border-neutral-800 text-neutral-400 overflow-hidden text-ellipsis max-w-full">
              {userEmail}
            </div>
            {serverTime > 0 && (
              <div className="text-neutral-500 flex items-center gap-1">
                <Clock size={14} /> Server Time: {new Date(serverTime).toLocaleTimeString()}
              </div>
            )}
          </div>
        </header>

        <div className="flex border-b border-neutral-800 gap-6 sm:gap-8 mb-6 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'tournaments' ? 'border-orange-500 text-orange-500' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Manage Tournaments
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'transactions' ? 'border-orange-500 text-orange-500' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Pending Transactions
            {transactions.length > 0 && (
              <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">
                {transactions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'settings' ? 'border-orange-500 text-orange-500' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Admin Settings
          </button>
        </div>

        {activeTab === 'tournaments' ? (
          <div className="grid lg:grid-cols-[350px_1fr] gap-8">
            {/* Create Tournament Form */}
            <div className="space-y-6">
              <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                <div className="flex items-center gap-2 mb-6">
                  <Plus size={20} className="text-orange-500" />
                  <h2 className="text-lg font-bold">Create Tournament</h2>
                </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Match Mode</label>
                  <select 
                    value={matchMode}
                    onChange={handleModeChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  >
                    {Object.keys(MATCH_MODES).map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Sub Mode</label>
                  <select 
                    value={subMode}
                    onChange={(e) => setSubMode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  >
                    {MATCH_MODES[matchMode].map(sm => (
                      <option key={sm} value={sm}>{sm}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Entry Fee (₹)</label>
                    <input 
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Prize Pool (₹)</label>
                    <input 
                      type="number"
                      value={prizePool}
                      onChange={(e) => setPrizePool(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Start Time</label>
                  <div className="relative">
                    <DatePicker
                      selected={startTime}
                      onChange={(date) => setStartTime(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-orange-500 transition-colors text-white"
                      placeholderText="Select date and time"
                      required
                      wrapperClassName="w-full"
                    />
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  </div>
                  <style>{`
                    .react-datepicker {
                      background-color: #171717 !important;
                      border: 1px solid #262626 !important;
                      font-family: inherit;
                    }
                    .react-datepicker__header {
                      background-color: #171717 !important;
                      border-bottom: 1px solid #262626 !important;
                    }
                    .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
                      color: #fff !important;
                    }
                    .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
                      color: #d4d4d4 !important;
                    }
                    .react-datepicker__day:hover, .react-datepicker__month-text:hover, .react-datepicker__quarter-text:hover, .react-datepicker__year-text:hover {
                      background-color: #262626 !important;
                    }
                    .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range, .react-datepicker__month-text--selected, .react-datepicker__month-text--in-selecting-range, .react-datepicker__month-text--in-range, .react-datepicker__quarter-text--selected, .react-datepicker__quarter-text--in-selecting-range, .react-datepicker__quarter-text--in-range, .react-datepicker__year-text--selected, .react-datepicker__year-text--in-selecting-range, .react-datepicker__year-text--in-range {
                      background-color: #f97316 !important;
                      color: #fff !important;
                    }
                    .react-datepicker-popper[data-placement^=bottom] .react-datepicker__triangle::before, .react-datepicker-popper[data-placement^=bottom] .react-datepicker__triangle::after {
                      border-bottom-color: #171717 !important;
                    }
                    .react-datepicker__time-container {
                      border-left: 1px solid #262626 !important;
                    }
                    .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
                      background-color: #171717 !important;
                      color: #fff !important;
                    }
                    .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
                      background-color: #262626 !important;
                    }
                    .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
                      background-color: #f97316 !important;
                      color: white !important;
                    }
                  `}</style>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 mt-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]"
                >
                  Publish Tournament
                </button>
              </form>
            </div>
          </div>

          {/* Tournament List */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={20} className="text-orange-500" />
              <h2 className="text-lg font-bold">Manage Tournaments</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 text-neutral-500">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center p-12 bg-neutral-900 rounded-2xl border border-neutral-800 text-neutral-500">
                No tournaments created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {tournaments.map((t) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={t._id} 
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{t.matchMode} - {t.subMode}</h3>
                          <span className={`text-xs px-2 py-1 rounded-md font-medium uppercase tracking-wider ${
                            t.matchStatus === 'scheduled' ? 'bg-blue-500/10 text-blue-400' :
                            t.matchStatus === 'completed' ? 'bg-green-500/10 text-green-400' :
                            'bg-orange-500/10 text-orange-400'
                          }`}>
                            {t.matchStatus}
                          </span>
                        </div>
                        <div className="text-sm text-neutral-400 mb-2">
                          {new Date(t.startTime).toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                          {t.matchStatus === 'scheduled' && (
                            <button
                              onClick={() => handleForceStart(t._id)}
                              className="text-xs px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors"
                            >
                              Force Start
                            </button>
                          )}
                          {t.matchStatus === 'ongoing' && (
                            <button
                              onClick={() => handleForceEnd(t._id)}
                              className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
                            >
                              Force End
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-400">Prize Pool</div>
                        <div className="text-2xl font-bold text-orange-500">₹{t.prizePool}</div>
                      </div>
                    </div>

                    {/* Registered Users */}
                    <div className="border-t border-neutral-800 pt-6">
                      <h4 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wider">
                        Registered Players ({(t.registeredUsers || []).length})
                      </h4>
                      
                      {(t.registeredUsers || []).length > 0 ? (
                        <div className="space-y-2">
                          {(t.registeredUsers || []).map(u => (
                            <div key={u._id} className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                              <div>
                                <div className="font-medium">{u.name}</div>
                                <div className="text-xs text-neutral-500">{u.email}</div>
                              </div>
                              {t.matchStatus !== 'completed' && (
                                <button 
                                  onClick={() => handleDeclareWinner(t._id, u._id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-sm font-medium transition-colors"
                                >
                                  <CheckCircle size={16} />
                                  Declare Winner
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-600 bg-neutral-950 p-4 rounded-xl border border-neutral-800 border-dashed text-center">
                          No players registered yet.
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </div>
        ) : activeTab === 'transactions' ? (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center p-12 text-neutral-500">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center p-12 bg-neutral-900 rounded-2xl border border-neutral-800 text-neutral-500">
                No pending transactions.
              </div>
            ) : (
              <div className="grid gap-4">
                {transactions.map(tx => (
                  <div key={tx._id} className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                            tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {tx.type}
                          </span>
                          <span className="font-medium text-lg">₹{tx.amount}</span>
                        </div>
                        <div className="text-sm text-neutral-400">
                          User: {tx.userId?.name} ({tx.userId?.email})
                        </div>
                        <div className="text-sm text-neutral-500 mt-2">
                          {tx.type === 'deposit' ? `UTR/TXN ID: ${tx.txnID}` : `UPI ID: ${tx.upiId || tx.txnID}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <button 
                        onClick={() => handleTransactionAction(tx._id, 'approve')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                      >
                        {tx.type === 'deposit' ? 'Approve' : 'Mark as Paid'}
                      </button>
                      <button 
                        onClick={() => handleTransactionAction(tx._id, 'deny')}
                        className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg font-medium transition-colors"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-2xl">
            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
              <h2 className="text-xl font-bold mb-6">Payment Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Admin UPI ID</label>
                  <p className="text-xs text-neutral-500 mb-2">Users will send deposits to this UPI ID.</p>
                  <input 
                    type="text" 
                    value={adminUpiId}
                    onChange={e => setAdminUpiId(e.target.value)}
                    placeholder="e.g. admin@ybl"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <button 
                  onClick={saveSettings}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
