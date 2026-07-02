import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowDownCircle, ArrowUpCircle, History, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
}

export default function Wallet({ userEmail, balance, onBalanceUpdate }: { userEmail: string, balance: number, onBalanceUpdate: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeAction, setActiveAction] = useState<'none' | 'deposit' | 'withdraw'>('none');
  const [proofImage, setProofImage] = useState<string>('');

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/user/transactions?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userEmail]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateUpiLinkAndPay = async () => {
    const amount = Number(depositAmount);
    if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount');
    try {
      const res = await fetch(`/api/upi-link?amount=${amount}`);
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.link;
      } else {
        alert('Failed to get UPI link');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount');
    if (!proofImage) return alert('Please upload a screenshot of your payment');
    
    // Create deposit transaction via API
    try {
      const res = await fetch('/api/transactions/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, amount, proofImage })
      });
      if (res.ok) {
        fetchTransactions();
        setDepositAmount('');
        setProofImage('');
        setActiveAction('none');
        alert('Deposit request created! Wait for admin approval.');
      } else {
        alert('Failed to create deposit request');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount');
    if (amount > balance) return alert('Insufficient balance');

    try {
      const res = await fetch('/api/transactions/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, amount })
      });
      
      if (res.ok) {
        fetchTransactions();
        onBalanceUpdate(); // updates local balance via parent
        setWithdrawAmount('');
        setActiveAction('none');
        alert('Withdrawal request submitted! Wait for admin approval.');
      } else {
        alert('Failed to submit withdrawal request');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center">
            <CreditCard size={32} />
          </div>
          <div>
            <div className="text-sm text-neutral-400 mb-1">Current Balance</div>
            <div className="text-4xl font-bold text-white">₹{balance}</div>
          </div>
        </div>
        <div className="flex w-full md:w-auto gap-4 mt-4 md:mt-0">
          <button 
            onClick={() => setActiveAction(activeAction === 'deposit' ? 'none' : 'deposit')}
            className="flex-1 md:flex-none justify-center items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all flex"
          >
            <ArrowDownCircle size={20} /> Deposit
          </button>
          <button 
            onClick={() => setActiveAction(activeAction === 'withdraw' ? 'none' : 'withdraw')}
            className="flex-1 md:flex-none justify-center items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all border border-neutral-700 flex"
          >
            <ArrowUpCircle size={20} /> Withdraw
          </button>
        </div>
      </div>

      {/* Actions (Deposit/Withdraw Form) */}
      {activeAction === 'deposit' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Deposit Funds (via UPI)</h3>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="number" 
                placeholder="Amount in ₹" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)} 
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 min-h-[44px] focus:outline-none focus:border-orange-500"
              />
              <button onClick={generateUpiLinkAndPay} className="px-6 py-3 min-h-[44px] bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all border border-neutral-700">
                1. Pay via UPI
              </button>
            </div>
            
            <form onSubmit={handleDeposit} className="flex flex-col gap-4 border-t border-neutral-800 pt-6">
              <div className="text-sm text-neutral-400">After payment, upload the screenshot to submit your deposit request:</div>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload} 
                  className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-500 hover:file:bg-orange-500/20"
                />
                <button type="submit" disabled={!proofImage} className="px-6 py-3 min-h-[44px] bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
                  2. Submit Payment Proof
                </button>
              </div>
              {proofImage && <img src={proofImage} alt="Proof" className="max-h-40 rounded-xl object-contain self-start" />}
            </form>
          </div>
        </motion.div>
      )}

      {activeAction === 'withdraw' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
          <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="number" 
              placeholder="Amount in ₹" 
              value={withdrawAmount} 
              onChange={(e) => setWithdrawAmount(e.target.value)} 
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 min-h-[44px] focus:outline-none focus:border-orange-500"
              required 
            />
            <button type="submit" className="px-6 py-3 min-h-[44px] bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 font-semibold rounded-xl transition-all">
              Request Withdrawal
            </button>
          </form>
        </motion.div>
      )}

      {/* Transaction History */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><History size={20} /> Transaction History</h3>
        {loading ? (
          <div className="text-center py-4 text-neutral-500">Loading history...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">No transactions found.</div>
        ) : (
          <div className="space-y-4">
            {transactions.map(t => (
              <div key={t._id} className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {t.type === 'deposit' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                  </div>
                  <div>
                    <div className="font-semibold capitalize">{t.type}</div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock size={12} /> {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${t.type === 'deposit' ? 'text-green-500' : 'text-white'}`}>
                    {t.type === 'deposit' ? '+' : '-'}₹{t.amount}
                  </div>
                  <div className={`text-xs uppercase font-semibold ${t.status === 'pending' ? 'text-yellow-500' : t.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
