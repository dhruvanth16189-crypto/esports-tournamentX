import React, { useState } from 'react';
import { Wallet, ArrowLeft, QrCode, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function DepositForm({ userEmail, onBack }: { userEmail: string; onBack: () => void }) {
  const [amount, setAmount] = useState<number | ''>('');
  const [txnID, setTxnID] = useState('');
  const [upiLink, setUpiLink] = useState('');
  const [payeeVPA, setPayeeVPA] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGenerateLink = async () => {
    if (!amount || amount <= 0) return;
    try {
      const res = await fetch(`/api/upi-link?amount=${amount}`);
      const data = await res.json();
      setUpiLink(data.link);
      setPayeeVPA(data.vpa);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !txnID) return;
    
    setStatus('loading');
    try {
      const res = await fetch('/api/transactions/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, amount, txnID })
      });
      
      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to submit deposit request');
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage('Network error occurred');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Deposit Request Sent</h2>
          <p className="text-neutral-400 mb-8">
            Your deposit of ₹{amount} with UTR {txnID} is pending admin verification. Your virtual balance will be updated soon.
          </p>
          <button 
            onClick={onBack}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="flex items-center gap-4 border-b border-neutral-800 pb-6 pt-4">
          <button onClick={onBack} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Wallet size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Deposit Money</h1>
              <p className="text-sm text-neutral-400">Add funds to your virtual wallet</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Amount to Deposit (₹)</label>
            <div className="flex gap-4">
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || '')}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                placeholder="Enter amount"
                min="1"
                required
              />
              <button 
                type="button"
                onClick={handleGenerateLink}
                disabled={!amount}
                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <QrCode size={18} />
                Generate UPI
              </button>
            </div>
          </div>

          {upiLink && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-neutral-950 border border-neutral-800 rounded-xl p-5"
            >
              <div className="text-sm text-neutral-400 mb-4">
                Pay to: <span className="text-white font-medium">{payeeVPA}</span>
              </div>
              <a 
                href={upiLink}
                className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-center transition-colors shadow-lg shadow-blue-600/20"
              >
                Open UPI App to Pay
              </a>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Transaction ID / UTR</label>
            <input 
              type="text"
              value={txnID}
              onChange={(e) => setTxnID(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter 12-digit UTR number"
              required
            />
            <p className="text-xs text-neutral-500 mt-2">
              Enter the transaction ID after completing the payment. Admin will verify this before crediting your account.
            </p>
          </div>

          {status === 'error' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} />
              {errorMessage}
            </div>
          )}

          <button 
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : 'Submit Deposit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
