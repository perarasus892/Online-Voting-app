import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle, AlertCircle, BarChart3,
  Vote, Shield, ChevronRight, Loader2, LogOut,
  User as UserIcon, Bell, Star
} from 'lucide-react';
import { electionAPI } from '../services/api';

interface VoterDashboardProps {
  user: any;
  onLogout: () => void;
  hasVoted: boolean;
}

export default function VoterDashboard({ user, onLogout, hasVoted }: VoterDashboardProps) {
  const navigate = useNavigate();
  const [elections, setElections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await electionAPI.getAll();
        setElections(data || []);
      } catch (error: any) {
        console.error('Failed to fetch elections:', error);
        setError('Failed to load elections. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchElections();
  }, []);

  const activeElection = elections.find(e => e.status === 'active');

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const distance = end - now;
    if (distance < 0) return null;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  };

  const timeRemaining = activeElection ? getTimeRemaining(activeElection.endDate) : null;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Secure Data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center bg-slate-50/50 pb-20">
      {/* Header Section */}
      <div className="w-full premium-gradient-dark px-8 pt-16 pb-24 rounded-b-[4rem] shadow-2xl shadow-indigo-950/20 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-lg animate-float">
                  <UserIcon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-indigo-950 rounded-full" />
              </div>
              <div>
                <p className="text-indigo-300 text-[10px] uppercase font-black tracking-widest mb-0.5">Verified Identity</p>
                <h1 className="text-white text-2xl font-black tracking-tighter italic">{user.name}</h1>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white/70 hover:text-white transition-all active:scale-90"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <div className="glass-card rounded-[2.5rem] p-6 border-white/20 flex items-center justify-between shadow-2xl">
            <div className="space-y-1">
              <p className="text-indigo-900/40 text-[10px] uppercase font-black tracking-widest">Protocol ID</p>
              <p className="text-indigo-950 font-mono font-black text-lg tracking-tight">{user.voterId}</p>
            </div>
            <div className="bg-white/50 px-4 py-2 rounded-2xl border border-white/50 flex items-center gap-2">
              {hasVoted ? (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-emerald-700 font-black text-[10px] uppercase tracking-wider">Synced</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-amber-700 font-black text-[10px] uppercase tracking-wider">Awaiting</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-8 -mt-10 space-y-8 animate-in">

        {/* Featured Election / Countdown */}
        {activeElection && !hasVoted && timeRemaining && (
          <div className="premium-gradient p-0.5 rounded-[3rem] shadow-2xl shadow-indigo-200 group">
            <div className="bg-white rounded-[2.9rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 p-2.5 rounded-2xl">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight">Election Ends In</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Don't miss your chance</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { val: timeRemaining.days, label: 'Days' },
                  { val: timeRemaining.hours, label: 'Hours' },
                  { val: timeRemaining.minutes, label: 'Mins' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-3xl p-5 text-center border border-slate-100 transition-all hover:bg-slate-100">
                    <div className="text-3xl font-black text-indigo-600 tracking-tighter">{item.val}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{item.label}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate(`/vote/${activeElection.id}`)}
                className="w-full bg-indigo-600 text-white p-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Vote className="w-5 h-5" />
                Cast Your Vote Now
              </button>
            </div>
          </div>
        )}

        {/* Categories / Quick Stats */}
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Quick Navigation</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/results')}
              className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:translate-y-[-4px] transition-all group"
            >
              <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:rotate-12 transition-all">
                <BarChart3 className="w-6 h-6 text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="font-black text-slate-900 mb-1">Live Results</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Track standings</p>
            </button>

            <button className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:translate-y-[-4px] transition-all group">
              <div className="bg-purple-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:rotate-12 transition-all">
                <Bell className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="font-black text-slate-900 mb-1">Notifications</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Important alerts</p>
            </button>
          </div>
        </div>

        {/* Elections Registry */}
        <div className="space-y-4">
          <div className="flex items-center justify-between ml-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Active Registry</h2>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>

          <div className="space-y-4">
            {elections.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                <Vote className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No active elections found</p>
              </div>
            ) : (
              elections.map((election) => (
                <div key={election.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 hover:border-indigo-200 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${election.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{election.status}</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{election.title}</h3>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl text-slate-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-2">{election.description}</p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-300 uppercase font-black">Election Date</p>
                      <p className="text-xs font-black text-slate-600">
                        {new Date(election.startDate).toLocaleDateString()}
                      </p>
                    </div>

                    {election.status === 'active' && !hasVoted ? (
                      <button
                        onClick={() => navigate(`/vote/${election.id}`)}
                        className="bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                      >
                        Enter Ballot <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : hasVoted ? (
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-black text-[10px] uppercase tracking-widest">Vote Cast</span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 text-slate-400 px-5 py-2.5 rounded-2xl">
                        <span className="font-black text-[10px] uppercase tracking-widest">Ended</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security / Compliance Footer */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-indigo-400" />
              <h4 className="font-black tracking-tight text-lg">Blockchain Secured</h4>
            </div>
            <p className="text-indigo-200/60 text-xs leading-relaxed font-medium">
              Every vote in this system is immutable and end-to-end verifiable.
              Your biometric and device logs are synchronized for multi-layer security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}