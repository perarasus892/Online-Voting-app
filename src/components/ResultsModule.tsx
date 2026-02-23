import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ArrowLeft, TrendingUp, Users, CheckCircle, Shield,
  Search, Loader2, Award, Percent, Hash, Activity,
  Database, Zap
} from 'lucide-react';
import { electionAPI, voteAPI } from '../services/api';

interface ResultsModuleProps {
  user: any;
  onLogout: () => void;
  hasVoted: boolean;
}

export default function ResultsModule({ user, onLogout, hasVoted }: ResultsModuleProps) {
  const navigate = useNavigate();
  const [verifyVoteId, setVerifyVoteId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [resultsData, setResultsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const elections = await electionAPI.getAll();
        if (!elections || elections.length === 0) {
          setError('Synchronizing network... No active election nodes found.');
          return;
        }
        const activeElection = elections.find((e: any) => e.status === 'active') || elections[0];
        const data = await electionAPI.getResults(activeElection.id);
        setResultsData(data);
      } catch (error: any) {
        setError('Network synchronization failure.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleVerifyVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyVoteId.trim()) {
      try {
        const result = await voteAPI.verifyReceipt(verifyVoteId.trim());
        setVerificationResult(result);
      } catch (error: any) {
        setVerificationResult({ verified: false, message: error.message || 'Identity hash not found.' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Filtering Real-Time Data Streams...</p>
      </div>
    );
  }

  if (error || !resultsData) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center">
        <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 text-center max-w-xs">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-rose-600 font-black text-[10px] uppercase tracking-widest">{error || 'Data Stream Offline'}</p>
        </div>
      </div>
    );
  }

  const results = resultsData.results.map((r: any, idx: number) => ({
    name: r.name,
    votes: r.votes,
    percentage: resultsData.totalVotes > 0 ? ((r.votes / resultsData.totalVotes) * 100).toFixed(1) : 0,
    color: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'][idx] || '#cbd5e1'
  }));

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="premium-gradient-dark px-10 pt-20 pb-24 rounded-b-[4rem] relative overflow-hidden flex flex-col items-center shadow-xl shadow-indigo-950/10">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="w-full max-w-lg relative">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-4 bg-white/10 backdrop-blur-3xl rounded-[1.5rem] border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-2xl border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-100 font-black text-[10px] uppercase tracking-widest">Live Link</span>
            </div>
          </div>
          <h1 className="text-white text-4xl font-black tracking-tighter italic mb-2">Live Analytics</h1>
          <p className="text-indigo-300/60 text-xs font-black uppercase tracking-[0.2em]">{resultsData.election?.title}</p>
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto px-6 -mt-10 space-y-8 animate-in">

        {/* Topline Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Ballots</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{resultsData.totalVotes.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Global Turnout</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{resultsData.voterTurnout}%</p>
            </div>
          </div>
        </div>

        {/* Visual Analytics */}
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart className="w-5 h-5 text-indigo-600" />
              Vote Distribution
            </h3>
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Ready</span>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" hide />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontDisplay: 'Outfit', fontWeight: 'bold' }}
                />
                <Bar dataKey="votes" radius={[16, 16, 16, 16]} barSize={40}>
                  {results.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Leaderboard */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Official Standings</h2>
          <div className="space-y-4">
            {results.map((candidate, idx) => (
              <div key={idx} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 group transition-all hover:translate-y-[-2px] hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center font-black text-xl text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{candidate.name}</h4>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{candidate.votes.toLocaleString()} Verified Votes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black tracking-tighter" style={{ color: candidate.color }}>{candidate.percentage}%</p>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-[1500ms]"
                    style={{ width: `${candidate.percentage}%`, backgroundColor: candidate.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Section */}
        <div className="premium-gradient p-0.5 rounded-[3rem] shadow-2xl shadow-indigo-100">
          <div className="bg-white rounded-[2.9rem] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Receipt Validation</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Blockchain Verification Protocol</p>
              </div>
            </div>

            <form onSubmit={handleVerifyVote} className="relative mb-6">
              <input
                type="text"
                value={verifyVoteId}
                onChange={(e) => setVerifyVoteId(e.target.value)}
                className="w-full bg-slate-50 rounded-[1.75rem] pl-16 pr-6 py-5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-200 outline-none"
                placeholder="Enter 32-byte hash..."
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all active:scale-90">
                <ArrowRight size={20} />
              </button>
            </form>

            {verificationResult && (
              <div className={`animate-in p-6 rounded-[2rem] flex flex-col items-center text-center ${verificationResult.verified !== false ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                <CheckCircle className={`w-10 h-10 mb-4 ${verificationResult.verified !== false ? 'text-emerald-500' : 'text-rose-500'}`} />
                <h4 className={`font-black tracking-tight mb-2 ${verificationResult.verified !== false ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {verificationResult.verified !== false ? 'ID HASH COMMITTED' : 'UNABLE TO RESOLVE'}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 break-all px-4">{verificationResult.voteId || verificationResult.message}</p>
                {verificationResult.timestamp && (
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-4">Node Synced: {new Date(verificationResult.timestamp).getLocalestring()}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Security Disclaimer */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white text-center relative overflow-hidden">
          <Shield className="w-8 h-8 text-indigo-400 mx-auto mb-4 opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">Integrity Disclaimer</p>
          <p className="text-indigo-200/50 text-[10px] leading-relaxed font-medium italic">
            This system uses homomorphic encryption to ensure results are 100% accurate <br />
            while keeping individual ballots mathematically impossible to decrypt.
          </p>
        </div>
      </div>
    </div>
  );
}

const ArrowRight = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);