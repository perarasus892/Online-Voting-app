import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface SessionTimeoutProps {
  onTimeout: () => void;
}

export default function SessionTimeout({ onTimeout }: SessionTimeoutProps) {
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before timeout

  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION);

  const resetTimer = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
  };

  useEffect(() => {
    const events = ['touchstart', 'touchmove', 'touchend', 'mousedown', 'keydown', 'scroll', 'click'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    return () => events.forEach(event => document.removeEventListener(event, resetTimer));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      const remaining = SESSION_DURATION - timeSinceLastActivity;
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onTimeout();
      } else if (remaining <= WARNING_TIME && !showWarning) {
        setShowWarning(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastActivity, showWarning, onTimeout]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-20 left-6 right-6 z-[100] animate-in slide-in-from-top duration-500">
      <div className="bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl shadow-indigo-950/20 p-8 border border-white max-w-lg mx-auto overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldAlert className="w-24 h-24" /></div>
        <div className="flex items-start gap-5 relative z-10">
          <div className="bg-amber-100 p-4 rounded-2xl flex-shrink-0 text-amber-600 animate-float">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-[.25em] text-amber-600 mb-1">Security Alert</h4>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter italic mb-3">Session Expiring</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
              Your encrypted session token will be revoked in <span className="text-indigo-600 font-black font-mono text-lg ml-1">{formatTime(timeRemaining)}</span>
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              Perform activity to renew
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
