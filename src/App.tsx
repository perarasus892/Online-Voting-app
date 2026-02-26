import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthModule from './components/AuthModule';
import VoterDashboard from './components/VoterDashboard';
import VoteCasting from './components/VoteCasting';
import ResultsModule from './components/ResultsModule';
import AdminDashboard from './components/AdminDashboard';
import SessionTimeout from './components/SessionTimeout';
import BottomNav from './components/BottomNav';
import { setAccessToken } from './services/api';
import { Shield, Loader2, User as UserIcon, LogOut, ChevronRight } from 'lucide-react';
import { Toaster } from 'sonner';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ready' | 'pending'>('checking');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedUser = localStorage.getItem('votingSystemUser');
        const savedToken = localStorage.getItem('votingSystemToken');
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setAccessToken(savedToken);
        }
        const votedStatus = localStorage.getItem('hasVoted');
        if (votedStatus === 'true') setHasVoted(true);

        setBackendStatus('ready');
      } catch (error) {
        console.error('App initialization error:', error);
        setBackendStatus('pending');
      } finally {
        setTimeout(() => setIsInitializing(false), 800); // Smooth transition
      }
    };

    initializeApp();

    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('votingSystemUser', JSON.stringify(userData));
    if (userData.token) localStorage.setItem('votingSystemToken', userData.token);
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('votingSystemUser');
    localStorage.removeItem('votingSystemToken');
    localStorage.removeItem('hasVoted');
    setHasVoted(false);
  };

  const handleVoteSubmitted = () => {
    setHasVoted(true);
    localStorage.setItem('hasVoted', 'true');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px]" />

        <div className="relative z-10 text-center animate-in">
          <div className="w-20 h-20 premium-gradient rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-indigo-500/20 animate-float">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic mb-4">VOTE-SECURE</h1>
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <p className="text-indigo-200/60 text-[10px] uppercase font-black tracking-[0.3em]">Synching Neural Ledger</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" richColors />
      <div className="flex-1 flex flex-col relative overflow-x-hidden">
        {user && <SessionTimeout onTimeout={handleLogout} />}

        {backendStatus === 'pending' && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-900 z-[60]">
            <span className="animate-pulse">⚠️ SYSTEM OFFLINE: INITIALIZE DATABASE NODE</span>
          </div>
        )}

        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto hide-scrollbar">
          <Routes>
            <Route
              path="/auth"
              element={
                user ? (
                  <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />
                ) : (
                  <AuthModule onLogin={handleLogin} />
                )
              }
            />

            <Route
              path="/dashboard"
              element={
                user && user.role === 'voter' ? (
                  <VoterDashboard user={user} onLogout={handleLogout} hasVoted={hasVoted} />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            <Route
              path="/vote/:electionId"
              element={
                user && user.role === 'voter' && !hasVoted ? (
                  <VoteCasting user={user} onVoteSubmitted={handleVoteSubmitted} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/results"
              element={
                user ? (
                  <ResultsModule user={user} onLogout={handleLogout} hasVoted={hasVoted} />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            <Route
              path="/admin"
              element={
                user && user.role === 'admin' ? (
                  <AdminDashboard user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            <Route
              path="/profile"
              element={
                user ? (
                  <div className="animate-in flex flex-col min-h-full bg-slate-50 pb-12">
                    <div className="premium-gradient-dark px-8 pt-16 pb-12 rounded-b-[3.5rem] text-center mb-8 shadow-xl shadow-indigo-900/10 shrink-0">
                      <div className="relative inline-block mb-4">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-3xl rounded-[2rem] border border-white/20 flex items-center justify-center shadow-2xl animate-float">
                          <UserIcon className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-indigo-950 rounded-full" />
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-tighter italic leading-none">{user.name}</h2>
                      <p className="text-indigo-400 text-[9px] uppercase font-black tracking-widest mt-2 opacity-60">Level 4 Citizen Access</p>
                    </div>

                    <div className="px-6 space-y-4">
                      <div className="bg-white rounded-[2.5rem] p-2 shadow-sm border border-slate-100 divide-y divide-slate-50">
                        {[
                          { label: 'Official Mobile', value: user.mobile, icon: Smartphone },
                          { label: 'Protocol Role', value: user.role.toUpperCase(), icon: Key },
                        ].map((item: any) => (
                          <div key={item.label} className="p-6 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-0.5">{item.label}</p>
                                <p className="text-xs font-black text-slate-900">{item.value}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-100 group-hover:text-slate-200 transition-colors" />
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-6 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Terminate Session
                      </button>
                    </div>
                  </div>
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            <Route path="/" element={<Navigate to="/auth" />} />
          </Routes>
        </main>

        {user && (
          <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-8 py-4 z-50">
            <BottomNav currentRoute={window.location.pathname.substring(1)} userRole={user.role} />
          </div>
        )}
      </div>
    </Router>
  );
}

// Just in case Smartphone and Smartphone are used
const Smartphone = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smartphone"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
);
const Key = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4a1 1 0 0 0-1.4 0l-1.1 1.1a2 2 0 0 1-3 0 2 2 0 0 1 0-3L14.6 1a1 1 0 0 0-1.4 0l-2.1 2.1a1 1 0 0 0 0 1.4l2.3 2.3" /><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3" /></svg>
);
