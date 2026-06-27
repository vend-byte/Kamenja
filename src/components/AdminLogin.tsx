'use client';

import React, { useState } from 'react';
import { useAdminAuth } from './AdminAuthProvider';
import { Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

async function signIn(username: string, password: string) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Authentication failed.');
  return data;
}

export default function AdminLogin() {
  const { login } = useAdminAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setStatus('error');
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      await signIn(username.trim(), password);
      setStatus('success');
      setTimeout(() => {
        login();
      }, 1000);
    } catch (error: any) {
      setStatus('error');
      setErrorMsg(error.message || 'Incorrect username or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B2C63] to-[#0F3D91] px-4 perspective-[1000px]">
      <motion.div 
        className="w-full max-w-sm relative"
        initial={false}
        animate={{ 
          rotateX: status === 'error' ? [0, -10, 10, -10, 10, 0] : status === 'success' ? 360 : 0,
          scale: status === 'success' ? 1.1 : 1 
        }}
        transition={{ 
          duration: status === 'error' ? 0.5 : status === 'success' ? 1 : 0.2,
          ease: "easeInOut"
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative backface-hidden">
          <div className="h-1.5 bg-gradient-to-r from-secondary via-orange-400 to-secondary" />
          
          <div className="p-8 space-y-7">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg border-4 border-secondary/30">
                <ShieldCheck className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h1 className="text-xl font-black text-primary tracking-tight">KAMENJA ENTERPRISES</h1>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Admin Dashboard</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center space-y-3"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <div>
                    <p className="font-black text-green-700 text-base">Authentication Successful!</p>
                    <p className="text-xs text-green-600 mt-1 font-medium">Entering secure dashboard...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {status === 'error' && (
                    <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">{errorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Username</label>
                      <div className="relative">
                        <User className="absolute inset-y-0 left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" required value={username} onChange={e => { setUsername(e.target.value); if (status === 'error') setStatus('idle'); }} placeholder="Username" 
                               className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-200 rounded-xl outline-none focus:border-primary bg-gray-50 focus:bg-white transition-colors" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute inset-y-0 left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type={showPwd ? 'text' : 'password'} required value={password} onChange={e => { setPassword(e.target.value); if (status === 'error') setStatus('idle'); }} placeholder="Password" 
                               className="w-full pl-10 pr-11 py-3 text-sm border-2 border-gray-200 rounded-xl outline-none focus:border-primary bg-gray-50 focus:bg-white transition-colors" />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-primary">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={status === 'loading'} className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-blue-800 disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl text-sm transition-colors mt-2">
                      {status === 'loading' ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                      {status === 'loading' ? 'Authenticating...' : 'Secure Login'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
