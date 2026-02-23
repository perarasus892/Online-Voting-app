import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, LogOut, Users, Vote, BarChart3, Settings,
  Plus, Edit, Trash2, Eye, UserCheck, Calendar, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Loader2, User,
  Layers, Database, Activity, Search, Filter, RefreshCw
} from 'lucide-react';
import { adminAPI, electionAPI } from '../services/api';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateElectionModal, setShowCreateElectionModal] = useState(false);

  const [stats, setStats] = useState<any>({ totalVoters: 0, activeElections: 0, totalVotes: 0, voterTurnout: 0 });
  const [elections, setElections] = useState<any[]>([]);
  const [recentVoters, setRecentVoters] = useState<any[]>([]);
  const [voters, setVoters] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, electionsData, voteRecords, logData, usersData] = await Promise.all([
        adminAPI.getStats(),
        electionAPI.getAll(),
        adminAPI.getVoteRecords().catch(() => []),
        adminAPI.getLogs().catch(() => []),
        adminAPI.getUsers().catch(() => [])
      ]);

      setStats(statsData || { totalVoters: 0, activeElections: 0, totalVotes: 0, voterTurnout: 0 });
      setElections(electionsData || []);
      setRecentVoters(voteRecords || []);
      setSecurityLogs(logData || []);
      setVoters(usersData || []);

    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      setError('System synchronization failed. Check database connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Secure Admin Protocol</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center bg-slate-50/50 pb-24">
      {/* Header Section */}
      <div className="w-full premium-gradient-dark px-8 pt-16 pb-32 rounded-b-[4rem] shadow-2xl shadow-indigo-950/30 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[2.25rem] flex items-center justify-center border border-white/20 shadow-2xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </div>
              </div>
              <div>
                <p className="text-indigo-300 text-[9px] uppercase font-black tracking-[0.25em] mb-1">Root Access</p>
                <h1 className="text-white text-3xl font-black tracking-tighter italic">{user.name}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white/50 hover:text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={onLogout}
                className="p-4 bg-rose-500/10 backdrop-blur-md rounded-2xl border border-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white transition-all active:scale-90"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Grid In Header */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-[2.5rem] p-6 border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-500/20 p-2.5 rounded-2xl text-indigo-300">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-indigo-200/50 text-[10px] uppercase font-black tracking-widest leading-none">Real-Time Monitoring</span>
              </div>
              <div className="space-y-1">
                <p className="text-white text-3xl font-black tracking-tighter leading-none">{stats.totalVotes.toLocaleString()}</p>
                <p className="text-indigo-300/60 text-[10px] font-black uppercase tracking-widest">Total Ballots</p>
              </div>
            </div>

            <div className="glass-card rounded-[2.5rem] p-6 border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-500/20 p-2.5 rounded-2xl text-emerald-300">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-emerald-200/50 text-[10px] uppercase font-black tracking-widest leading-none">Identity Database</span>
              </div>
              <div className="space-y-1">
                <p className="text-white text-3xl font-black tracking-tighter leading-none">{stats.totalVoters.toLocaleString()}</p>
                <p className="text-emerald-300/60 text-[10px] font-black uppercase tracking-widest">Registered Citizens</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pill Container */}
      <div className="w-full px-8 -mt-10 mb-8 relative z-20">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-3 shadow-2xl shadow-indigo-950/10 border border-slate-200 flex gap-2 overflow-x-auto hide-scrollbar">
          {[
            { id: 'overview', label: 'Monitor', icon: BarChart3 },
            { id: 'elections', label: 'Elections', icon: Vote },
            { id: 'voters', label: 'Voters', icon: Users },
            { id: 'logs', label: 'Security', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-[1.75rem] font-black transition-all whitespace-nowrap active:scale-95 ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-y-[-2px]'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest">{tab.id === 'overview' ? 'Hub' : tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-lg px-6 space-y-8 animate-in">

        {/* Hub Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Efficiency</h4>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.voterTurnout}% <span className="text-xs text-emerald-500 ml-1 font-bold">+2.4%</span></p>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="bg-indigo-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Resources</h4>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">Healthy</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative group">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 italic tracking-tighter">Live Activity Ledger</h3>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
              <div className="p-2">
                <div className="space-y-1">
                  {recentVoters.length === 0 ? (
                    <div className="py-20 text-center">
                      <Clock className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Awaiting User Engagement...</p>
                    </div>
                  ) : (
                    recentVoters.map((voter) => (
                      <div key={voter.id} className="group/item flex items-center justify-between p-6 hover:bg-slate-50 transition-all rounded-[2rem]">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm group-hover/item:scale-110 group-hover/item:shadow-lg transition-all">
                            <User className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors">{voter.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">{voter.voterId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-xl uppercase tracking-tighter">
                            {new Date(voter.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex justify-center">
                <button className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">Download Security Audit</button>
              </div>
            </div>

            <button
              onClick={() => setShowCreateElectionModal(true)}
              className="w-full premium-gradient text-white p-8 rounded-[3rem] shadow-2xl shadow-indigo-300 font-black tracking-[0.1em] text-sm flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Plus className="w-7 h-7 relative z-10" />
              <span className="relative z-10 text-lg">PROVISION NEW ELECTION</span>
            </button>
          </div>
        )}

        {/* Elections Registry Tab */}
        {activeTab === 'elections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">Election Registry</h2>
              <div className="flex gap-2">
                <button className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><Filter className="w-5 h-5" /></button>
                <button className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><Plus className="w-5 h-5" /></button>
              </div>
            </div>
            {elections.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <Layers className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">Registry Empty</p>
              </div>
            ) : (
              elections.map((election) => (
                <div key={election.id} className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl hover:translate-y-[-4px] transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rotate-45 translate-x-16 translate-y-[-16px] group-hover:bg-indigo-50 transition-colors" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${election.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'} animate-pulse`} />
                          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">{election.status} Protocol</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-none">{election.title}</h3>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Calendar className="w-5 h-5" /></div>
                    </div>

                    <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed max-w-xs">{election.description}</p>

                    <div className="flex gap-3">
                      <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Configure System</button>
                      <button className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all">Destroy</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Voter Base Tab */}
        {activeTab === 'voters' && (
          <div className="space-y-6">
            <div className="px-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic mb-6">Verified Voter Base</h2>
              <div className="relative mb-6">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search Global Registry..."
                  className="w-full bg-white rounded-[2rem] pl-16 pr-8 py-6 border border-slate-100 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all font-black text-sm outline-none placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-4">
                {voters.length === 0 ? (
                  <div className="p-24 text-center">
                    <Users className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                    <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.3em] italic">No Identity Match Found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {voters.map((voter) => (
                      <div key={voter.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all rounded-[2rem] group/voter">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center group-hover/voter:bg-indigo-600 transition-all shadow-sm">
                            <User className="w-7 h-7 text-indigo-600 group-hover:text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{voter.name.toUpperCase()}</p>
                            <p className="text-[10px] font-mono text-slate-400 font-bold tracking-widest">{voter.voterId}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${voter.hasVoted
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                          }`}>
                          {voter.hasVoted ? 'Ballot Synced' : 'Ready'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">Security Audit Ledger</h2>
              <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.15em] animate-pulse">Live SSL Monitoring</div>
            </div>
            <div className="space-y-4">
              {securityLogs.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Shield className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                  <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">Ledger Untouched</p>
                </div>
              ) : (
                securityLogs.map(log => (
                  <div key={log._id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex gap-5 items-start shadow-sm hover:shadow-2xl transition-all group">
                    <div className={`p-4 rounded-2xl shadow-lg shadow-current opacity-20 ${log.type === 'success' ? 'bg-emerald-500 text-emerald-500' :
                      log.type === 'danger' ? 'bg-rose-500 text-rose-500' :
                        log.type === 'warning' ? 'bg-amber-500 text-amber-500' :
                          'bg-indigo-500 text-indigo-500'
                      }`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{log.category} System</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm font-black text-slate-800 break-words leading-tight mb-4">{log.message}</p>
                      <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.userId || 'Core Engine'}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-mono text-slate-400 font-bold italic">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="w-full max-w-lg px-6 mt-16 text-center">
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">Integrated Secure Voting Environment</p>
        <p className="text-slate-200 text-[8px] font-mono mt-2">© 2024 VOTE-SECURE PRIVACY PROTOCOL V2.4.1</p>
      </div>
    </div>
  );
}