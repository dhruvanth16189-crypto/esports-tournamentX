import React, { useState } from 'react';
import { LogIn, Loader2, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { auth, provider, signInWithPopup } from '../firebase';

interface LoginProps {
  onLogin: (user: any) => void;
  onLogout: () => void;
  onNavigate: (view: 'home' | 'admin' | 'deposit') => void;
  user: any | null;
}

export default function Login({ onLogin, onLogout, onNavigate, user }: LoginProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Log the user email upon successful login
      console.log(firebaseUser.email);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          uid: firebaseUser.uid
        })
      });
      
      if (res.ok) {
        const userData = await res.json();
        const profile = {
          email: firebaseUser.email,
          name: userData.username,
          virtualBalance: userData.virtualBalance,
          isAdmin: userData.isAdmin
        };
        onLogin(profile);

        if (firebaseUser.email === 'dhruvanth16189@gmail.com') {
          localStorage.setItem('isAdmin', 'true');
          onNavigate('admin');
        } else {
          localStorage.setItem('userProfile', JSON.stringify(profile));
          onNavigate('home');
        }
      } else {
        alert('Failed to login to the server');
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userProfile');
    onLogout();
    onNavigate('home');
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold">{user.name}</div>
          <div className="text-xs text-orange-400 font-medium">₹{user.virtualBalance}</div>
        </div>
        
        {user.email === 'dhruvanth16189@gmail.com' ? (
          <button 
            onClick={() => onNavigate('admin')}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Shield size={16} />
            Admin Dashboard
          </button>
        ) : (
          <button 
            onClick={() => { /* Future: Navigate to user profile */ }}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
          >
            <UserIcon size={16} />
            User Profile
          </button>
        )}
        
        <button
          onClick={handleLogout}
          className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
      Sign In with Google
    </button>
  );
}
