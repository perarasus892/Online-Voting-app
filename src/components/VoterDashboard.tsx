import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle, AlertCircle, BarChart3,
  Vote, Shield, ChevronRight, Loader2, LogOut,
  User as UserIcon, Bell, Star, Trophy, ArrowRight, Activity
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

  const [votedElections, setVotedElections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await electionAPI.getAll();
        setElections(data || []);

        // Fetch vote status for each active election
        if (data && data.length > 0) {
          const statusPromises = data.map(async (e: any) => {
            if (e.status === 'active') {
              const status = await electionAPI.getVoteStatus(e.id);
              return { id: e.id, status };
            }
            return { id: e.id, status: false };
          });
          const statuses = await Promise.all(statusPromises);
          const statusMap: Record<string, boolean> = {};
          statuses.forEach(s => {
            statusMap[s.id] = s.status;
          });
          setVotedElections(statusMap);
        }
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
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
          <div className="w-10 h-10 absolute inset-0 m-auto overflow-hidden rounded-xl bg-white p-1 shadow-sm">
            <img src="/logo.png" className="w-full h-full object-contain" alt="VoteOn" />
          </div>
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[9px] mt-6">Establishing Secure Node...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24">
      {/* ===== HERO SECTION ===== */}
      <div className="w-full bg-[#1a1a5e] px-6 pt-14 pb-20 relative overflow-hidden rounded-b-[3.5rem] shadow-2xl shadow-indigo-900/20">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-indigo-500/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-purple-500/10 rounded-full blur-[60px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-white/10 shadow-xl overflow-hidden p-1">
                  <img src="/logo.png" className="w-full h-full object-contain" alt="VoteOn" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#1a1a5e] rounded-full shadow-sm" />
              </div>
              <div className="flex flex-col">
                <p className="text-indigo-300 text-[9px] uppercase font-black tracking-[0.2em] mb-1 opacity-80 leading-none">Verified Identity</p>
                <h1 className="text-white text-3xl font-black tracking-tighter capitalize leading-none">{user.name}</h1>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all active:scale-95 shadow-inner"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Identity Pass Card */}
          <div className="bg-white/10 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-7 shadow-2xl overflow-hidden relative group">
            {/* Background Decorative Element removed */}

            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-2">
                <p className="text-indigo-200/40 text-[9px] uppercase font-black tracking-[0.2em] leading-none">Voting protocol ID</p>
                <p className="text-white font-mono font-black text-xl tracking-tight leading-none">{user.voterId}</p>
              </div>
              <div className={`px-5 py-2.5 rounded-2xl flex items-center gap-2.5 border backdrop-blur-md ${hasVoted
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${hasVoted ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-amber-400 shadow-amber-400/50'}`} />
                <span className="text-[10px] font-black uppercase tracking-wider">{hasVoted ? 'Ballot Synced' : 'Ready to Vote'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== VOTING PROGRESS ===== */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Election Cycle Progress</span>
            <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-full">
              {hasVoted ? 'Completed' : 'Phase 02/03'}
            </span>
          </div>
          <div className="flex gap-2">
            <div className="h-1.5 flex-1 bg-emerald-500 rounded-full" />
            <div className={`h-1.5 flex-1 rounded-full ${hasVoted ? 'bg-emerald-500' : 'bg-indigo-600'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${hasVoted ? 'bg-emerald-500' : 'bg-slate-100'}`} />
          </div>
          <div className="flex justify-between mt-3">
            <p className="text-[9px] text-slate-400 font-medium italic">Identity Verified</p>
            <p className="text-[9px] text-slate-400 font-medium italic">{hasVoted ? 'Ballot Recorded' : 'Cast Vote'}</p>
            <p className="text-[9px] text-slate-400 font-medium italic">Final Audit</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-10 space-y-10">
        {/* ===== QUICK ACTIONS ===== */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/results')}
            className="group bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all text-left"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-1 leading-none">Live Results</h3>
            <p className="text-[10px] text-slate-400 font-medium">Track standing metrics</p>
          </button>

          <div
            onClick={() => navigate('/announcements')}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="bg-orange-50 w-12 h-12 rounded-[1.25rem] flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">Announcements</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Citizen updates & alerts</p>
          </div>
        </div>

        {/* ===== ACTIVE ELECTIONS ===== */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h2 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.15em]">Official Ballots</h2>
            </div>
            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">{elections.length} Active</span>
          </div>

          <div className="space-y-4">
            {elections.length === 0 ? (
              <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Vote className="w-10 h-10 text-slate-100" />
                </div>
                <h4 className="font-bold text-slate-300 tracking-tight text-lg">Scanning Voting Network</h4>
                <p className="text-slate-200 text-xs mt-1 font-medium italic">No active nodes detected...</p>
              </div>
            ) : (
              elections.map((election) => (
                <div key={election.id} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all group relative overflow-hidden">
                  {election.status === 'active' && !votedElections[election.id] && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-indigo-600 text-white text-[8px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-tighter">Live Ballot</div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${election.status === 'active' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-300'}`} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{election.status} election</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{election.title}</h3>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                      <Calendar className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 mb-6">{election.description}</p>

                  <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-none">Registration Ends</p>
                      </div>
                      <p className="text-xs font-bold text-slate-700">{new Date(election.endDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    {election.status === 'active' && !votedElections[election.id] ? (
                      <button
                        onClick={() => navigate(`/vote/${election.id}`)}
                        className="bg-[#1a1a5e] hover:bg-indigo-900 text-white px-7 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/20 active:scale-95 transition-all flex items-center gap-2"
                      >
                        Enter Ballot <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : votedElections[election.id] || hasVoted ? (
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl border border-emerald-100">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-bold text-[10px] uppercase tracking-widest">Receipt Verified</span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 text-slate-400 px-5 py-3 rounded-2xl border border-slate-100">
                        <span className="font-bold text-[10px] uppercase tracking-widest">Ballot Closed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ===== SECURITY FOOTER ===== */}
        <div className="bg-[#1a1a5e] rounded-[3rem] p-8 text-white relative overflow-hidden mb-8 shadow-2xl shadow-indigo-900/10">
          <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <h4 className="font-bold tracking-tight text-lg leading-none">End-to-End Verifiable</h4>
                <p className="text-[9px] uppercase font-bold text-indigo-300 tracking-[0.2em] mt-1">Blockchain Hash Protocol v2.4</p>
              </div>
            </div>
            <p className="text-indigo-200/50 text-xs leading-relaxed font-medium">
              Every vote cast is encrypted with zero-knowledge proof technology.
              Your contribution is anonymous, immutable, and part of the national ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}