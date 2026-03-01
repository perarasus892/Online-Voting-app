import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, LogOut, Users, Vote, BarChart3, Settings,
  Plus, Edit, Trash2, Eye, UserCheck, Calendar, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Loader2, User,
  Layers, Database, Activity, Search, Filter, RefreshCw,
  ArrowRight, Network, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI, electionAPI, announcementAPI } from '../services/api';
import { SymbolRenderer } from './SymbolRenderer';
import { Bell, Megaphone, Send } from 'lucide-react';


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
  const [searchQuery, setSearchQuery] = useState('');
  const [showElectionSearch, setShowElectionSearch] = useState(false);

  // Create Election form state
  const [newElection, setNewElection] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [newCandidates, setNewCandidates] = useState<Array<{ name: string; party: string; symbol: string; slogan: string }>>([
    { name: '', party: '', symbol: '', slogan: '' },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState<'details' | 'candidates'>('details');

  // Announcement state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'low'
  });
  const [isPosting, setIsPosting] = useState(false);

  const handleDownloadLedger = () => {
    try {
      const ledgerContent = `VOTEON - SECURITY LEDGER\n` +
        `Generated: ${new Date().toLocaleString()}\n` +
        `------------------------------------------\n\n` +
        recentVoters.map(v =>
          `[${new Date(v.timestamp).toISOString()}] \n` +
          `Voter ID: ${v.voterId}\n` +
          `Name: ${v.name}\n` +
          `Status: SUCCESSFUL_VOTE_RECORDED\n` +
          `------------------------------------------`
        ).join('\n');

      const blob = new Blob([ledgerContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security_ledger_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Security Ledger Exported Successfully");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, electionsData, voteRecords, logData, usersData, announcementsData] = await Promise.all([
        adminAPI.getStats(),
        electionAPI.getAll(),
        adminAPI.getVoteRecords().catch(() => []),
        adminAPI.getLogs().catch(() => []),
        adminAPI.getUsers().catch(() => []),
        announcementAPI.getAll().catch(() => [])
      ]);

      setStats(statsData || { totalVoters: 0, activeElections: 0, totalVotes: 0, voterTurnout: 0 });
      setElections(electionsData || []);
      setRecentVoters(voteRecords || []);
      setSecurityLogs(logData || []);
      setVoters(usersData || []);
      setAnnouncements(announcementsData || []);

    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      setError('System synchronization failed. Check database connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateElection = async () => {
    if (!newElection.title || !newElection.startDate || !newElection.endDate) {
      setCreateError('Please fill in all required fields (Title, Start Date, End Date).');
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      // Step 1: Create the election
      const election = await electionAPI.create(
        newElection.title,
        newElection.description,
        newElection.startDate,
        newElection.endDate
      );

      // Step 2: Add candidates (filter out empty ones)
      const validCandidates = newCandidates.filter(c => c.name.trim() && c.party.trim());
      for (const candidate of validCandidates) {
        await import('../services/api').then(mod =>
          mod.candidateAPI.create(
            election.id,
            candidate.name,
            candidate.party,
            candidate.symbol || '🏛️',
            '',
            candidate.slogan
          )
        );
      }

      // Reset form and close modal
      setNewElection({ title: '', description: '', startDate: '', endDate: '' });
      setNewCandidates([{ name: '', party: '', symbol: '', slogan: '' }]);
      setCreateStep('details');
      setShowCreateElectionModal(false);

      // Refresh data
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsPosting(true);
      await announcementAPI.create(
        newAnnouncement.title,
        newAnnouncement.content,
        newAnnouncement.category,
        newAnnouncement.priority
      );
      toast.success('Bulletin broadcasted successfully');
      setShowCreateAnnouncement(false);
      setNewAnnouncement({ title: '', content: '', category: 'General', priority: 'low' });
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post bulletin');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Decommission this broadcast?')) return;
    try {
      await announcementAPI.delete(id);
      toast.success('Bulletin decommissioned');
      await fetchData();
    } catch (err) {
      toast.error('Failed to delete bulletin');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
          <Shield className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[9px] mt-6">Authorizing Root Credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24">
      {/* ===== SYSTEM HEADER ===== */}
      <div className="w-full bg-[#1a1a5e] px-6 pt-14 pb-24 relative overflow-hidden rounded-b-[3.5rem] shadow-2xl shadow-indigo-900/20">
        {/* Decorative Elements */}
        <div className="absolute top-[-40px] left-[-40px] w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20px] right-[-20px] w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden p-2">
                  <img src="/logo.png" className="w-full h-full object-contain" alt="VoteOn" />
                </div>
                <div className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-sm" />
                </div>
              </div>
              <div>
                <p className="text-indigo-300/60 text-[9px] uppercase font-bold tracking-[0.2em] mb-0.5">VoteOn Secondary System Admin</p>
                <h1 className="text-white text-2xl font-bold tracking-tight capitalize">{user.name}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                className="w-11 h-11 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={onLogout}
                className="w-11 h-11 bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Core Analytics Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl group transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-300">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-indigo-100 text-[9px] uppercase font-bold tracking-widest">Global metrics</span>
              </div>
              <p className="text-white text-4xl font-black tracking-tighter leading-none">{stats.totalVotes.toLocaleString()}</p>
              <p className="text-indigo-200/50 text-[9px] uppercase font-bold tracking-[0.2em] mt-2">Verified Ballots Cast</p>
            </div>

            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl group transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-300">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-emerald-100 text-[9px] uppercase font-bold tracking-widest">Registry size</span>
              </div>
              <p className="text-white text-4xl font-black tracking-tighter leading-none">{stats.totalVoters.toLocaleString()}</p>
              <p className="text-emerald-200/50 text-[9px] uppercase font-bold tracking-[0.2em] mt-2">Authenticated Citizens</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SYSTEM NAVIGATION ===== */}
      <div className="w-full px-6 -mt-8 relative z-[100]">
        <div className="bg-white rounded-3xl p-1.5 shadow-xl shadow-slate-200 border border-slate-100 flex gap-1 overflow-x-auto hide-scrollbar">
          {[
            { id: 'overview', label: 'Monitor', icon: BarChart3 },
            { id: 'elections', label: 'Elections', icon: Vote },
            { id: 'bulletins', label: 'Bulletins', icon: Bell },
            { id: 'voters', label: 'Citizens', icon: Users },
            { id: 'logs', label: 'Security', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab(tab.id);
                setSearchQuery(''); // Reset search when switching tabs
                setShowElectionSearch(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all active:scale-95 whitespace-nowrap ${activeTab === tab.id
                ? 'bg-[#1a1a5e] text-white shadow-lg shadow-indigo-200'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
            >
              <tab.icon className="w-4 h-4 pointer-events-none" />
              <span className="text-[10px] uppercase tracking-widest pointer-events-none">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-lg px-6 space-y-8 animate-in relative z-10 mx-auto mt-8">

        {/* Hub Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h4 className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">System Participation</h4>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">{stats.voterTurnout}% <span className="text-[10px] text-emerald-500 ml-1 font-bold">+2.4%</span></p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                  <Database className="w-6 h-6" />
                </div>
                <h4 className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Network Status</h4>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">Active Node</p>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
              <div className="p-7 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
                <div>
                  <h3 className="font-bold tracking-tight text-lg flex items-center gap-2 italic">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Security HUD
                  </h3>
                  <p className="text-[9px] text-indigo-300 uppercase font-black tracking-widest mt-0.5">Quantum-Safe Network Sync Active</p>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="text-[9px] font-mono text-indigo-400 mr-2 animate-pulse">TX_SCAN_ACTIVE</span>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]" style={{ animationDelay: '200ms' }} />
                </div>
              </div>
              <div className="p-3 bg-slate-950 relative overflow-hidden h-[340px] flex flex-col">
                {/* HUD Grid Effect */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
                />

                <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 relative z-10 p-2">
                  {recentVoters.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                      <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                      <p className="text-indigo-200 font-mono text-[10px] uppercase tracking-[0.3em]">Listening for incoming packets...</p>
                    </div>
                  ) : (
                    recentVoters.map((voter, i) => (
                      <div key={voter.id} className="bg-white/5 border border-white/5 p-4 rounded-3xl group/hud hover:bg-white/10 transition-all animate-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover/hud:scale-110 transition-transform">
                              <Network className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-indigo-50 tracking-tight">{voter.name.toUpperCase()}</p>
                                <div className="w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_5px_#6366f1]" />
                              </div>
                              <p className="text-[9px] text-indigo-400 font-mono flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                {voter.voterId.substring(0, 10)}... [HASH_SIG]
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-emerald-400 font-bold mb-0.5">SIG_VERIFIED</p>
                            <p className="text-[9px] text-slate-500 font-mono">
                              {new Date(voter.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="p-5 bg-slate-900 border-t border-white/5 text-center">
                <button
                  onClick={handleDownloadLedger}
                  className="w-full bg-indigo-600/20 text-indigo-400 border border-indigo-400/20 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  Download Integrity Ledger <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowCreateElectionModal(true)}
              className="w-full bg-[#1a1a5e] text-white p-7 rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-indigo-900 active:scale-95 transition-all group overflow-hidden"
            >
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm">Provision New Election</span>
            </button>
          </div>
        )}

        {/* Elections Registry Tab */}
        {activeTab === 'elections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Election Registry</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowElectionSearch(!showElectionSearch)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${showElectionSearch ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm'}`}
                >
                  <Filter className="w-4 h-4" />
                </button>
                <button onClick={() => setShowCreateElectionModal(true)} className="w-10 h-10 bg-[#1a1a5e] rounded-xl text-white shadow-lg shadow-indigo-200 flex items-center justify-center hover:bg-indigo-900 transition-all"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {showElectionSearch && (
              <div className="px-2 mb-6 animate-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search elections by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-white rounded-2xl pl-12 pr-4 py-4 border border-slate-100 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-xs outline-none"
                  />
                </div>
              </div>
            )}

            {elections.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Layers className="w-10 h-10 text-slate-100" />
                </div>
                <p className="text-slate-300 font-bold uppercase text-[9px] tracking-[0.3em]">{searchQuery ? 'No Elections Match Search' : 'Registry Empty'}</p>
              </div>
            ) : (
              elections
                .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((election) => (
                  <div key={election.id} className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${election.status === 'active' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-300'}`} />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{election.status} protocol active</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{election.title}</h3>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                        <Calendar className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 mb-6">{election.description}</p>

                    <div className="pt-5 border-t border-slate-50 flex flex-col gap-3">
                      <div className="flex gap-3">
                        <button className="flex-1 bg-[#1a1a5e] text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/10 hover:bg-indigo-900 transition-all active:scale-95">Configure Node</button>
                        <button className="flex-1 bg-rose-50 text-rose-500 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95">Decommission</button>
                      </div>
                      <button
                        onClick={() => navigate('/results')}
                        className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        View Live Results
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Bulletins Tab */}
        {activeTab === 'bulletins' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight italic">Global Bulletins</h2>
              <button
                onClick={() => setShowCreateAnnouncement(true)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Draft Broadcast
              </button>
            </div>

            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100">
                  <Megaphone className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-300 font-bold uppercase text-[9px] tracking-[0.3em]">No Active Broadcasts</p>
                </div>
              ) : (
                announcements.map((ann, idx) => (
                  <div key={ann.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${ann.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                          }`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">{ann.category}</span>
                            {ann.priority === 'high' && <span className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Urgent</span>}
                          </div>
                          <h4 className="font-bold text-slate-800 uppercase text-sm tracking-tight">{ann.title}</h4>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{ann.content}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {new Date(ann.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create Announcement Modal */}
            {showCreateAnnouncement && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/40 animate-in">
                <div className="bg-white w-full max-w-md rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/20">
                  <div className="bg-[#1a1a5e] p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black tracking-tight italic">Draft Bulletin</h3>
                      <p className="text-indigo-300 text-[9px] uppercase font-black tracking-widest mt-1">Official Neural Broadcast</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateAnnouncement} className="p-8 space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulletin Title</label>
                      <input
                        type="text"
                        required
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm outline-none"
                        placeholder="e.g., Election Results Finalized"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <select
                          value={newAnnouncement.category}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-[10px] outline-none uppercase tracking-widest"
                        >
                          <option value="General">General</option>
                          <option value="Election">Election</option>
                          <option value="Result">Result</option>
                          <option value="Security">Security</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                        <select
                          value={newAnnouncement.priority}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-[10px] outline-none uppercase tracking-widest"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulletin Content</label>
                      <textarea
                        required
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-3xl py-4 px-6 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-sm outline-none min-h-[120px] resize-none"
                        placeholder="Type the official message here..."
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateAnnouncement(false)}
                        className="flex-1 py-4 px-6 rounded-2xl font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        disabled={isPosting}
                        className="flex-1 bg-indigo-600 text-white py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isPosting ? 'Broadcasting...' : 'Broadcast Now'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voter Base Tab */}
        {activeTab === 'voters' && (
          <div className="space-y-6">
            <div className="px-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-4">Verified Citizen Base</h2>
              <div className="relative mb-6">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Query identity database..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white rounded-2xl pl-14 pr-8 py-5 border border-slate-100 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-xs outline-none placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
              <div className="p-2">
                {voters.filter(v =>
                  (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (v.voterId || '').toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <div className="p-24 text-center">
                    <Users className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <p className="text-slate-300 font-bold uppercase text-[9px] tracking-[0.3em] italic">No Identity Match Found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {voters
                      .filter(v =>
                        (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (v.voterId || '').toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((voter, idx) => (
                        <div key={voter._id || voter.id || `voter-${idx}`} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-all rounded-[2rem] group/voter">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover/voter:bg-[#1a1a5e] group-hover/voter:border-[#1a1a5e] group-hover/voter:text-white transition-all shadow-sm">
                              <User className="w-6 h-6 text-slate-300 group-hover:text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 capitalize">{voter.name}</p>
                              <p className="text-[9px] font-mono text-slate-400 font-bold tracking-widest leading-none mt-1">{voter.voterId}</p>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider ${voter.hasVoted
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                            {voter.hasVoted ? 'Ballot Synced' : 'Action Ready'}
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
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Security Audit Ledger</h2>
              <div className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.1em] border border-emerald-100">Live SSL Monitoring</div>
            </div>
            <div className="space-y-4">
              {securityLogs.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-slate-100" />
                  </div>
                  <p className="text-slate-300 font-bold uppercase text-[9px] tracking-[0.3em]">Ledger Clean</p>
                </div>
              ) : (
                securityLogs.map(log => (
                  <div key={log._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex gap-5 items-start shadow-sm hover:shadow-xl transition-all group">
                    <div className={`p-4 rounded-2xl shadow-lg opacity-20 ${log.type === 'success' ? 'bg-emerald-500 text-emerald-500' :
                      log.type === 'danger' ? 'bg-rose-500 text-rose-500' :
                        log.type === 'warning' ? 'bg-amber-500 text-amber-500' :
                          'bg-indigo-500 text-indigo-500'
                      }`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-300">{log.category} Layer</span>
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 break-words leading-tight mb-4">{log.message}</p>
                      <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.userId || 'Core Protocol'}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[9px] font-mono text-slate-400 italic">{new Date(log.timestamp).toLocaleDateString()}</span>
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
      <div className="w-full max-w-lg px-6 mt-16 text-center opacity-40">
        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em]">Integrated Network Environment</p>
        <p className="text-slate-300 text-[8px] font-mono mt-2">SECURE-VOTING PROTOCOL V2.4.1 • ENCRYPTED NODE</p>
      </div>

      {/* ======= CREATE ELECTION MODAL ======= */}
      {showCreateElectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white rounded-t-[3rem] p-8 pb-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500 mb-1">
                    {createStep === 'details' ? 'Step 1 of 2' : 'Step 2 of 2'}
                  </p>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">
                    {createStep === 'details' ? 'Election Details' : 'Add Candidates'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowCreateElectionModal(false);
                    setCreateStep('details');
                    setCreateError(null);
                  }}
                  className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
                >
                  ✕
                </button>
              </div>
              {/* Progress Bar */}
              <div className="flex gap-2 mt-6">
                <div className={`flex-1 h-1.5 rounded-full ${createStep === 'details' ? 'bg-indigo-500' : 'bg-indigo-500'}`} />
                <div className={`flex-1 h-1.5 rounded-full ${createStep === 'candidates' ? 'bg-indigo-500' : 'bg-slate-100'}`} />
              </div>
            </div>

            <div className="p-8 space-y-6">
              {createError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-xs font-black flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {createError}
                </div>
              )}

              {createStep === 'details' ? (
                <>
                  {/* Election Title */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Election Title *</label>
                    <input
                      type="text"
                      value={newElection.title}
                      onChange={(e) => setNewElection({ ...newElection, title: e.target.value })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-300 outline-none"
                      placeholder="e.g. National Election 2026"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Description</label>
                    <textarea
                      value={newElection.description}
                      onChange={(e) => setNewElection({ ...newElection, description: e.target.value })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-300 outline-none resize-none h-28"
                      placeholder="Brief description of the election..."
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={newElection.startDate}
                      onChange={(e) => setNewElection({ ...newElection, startDate: e.target.value })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 outline-none"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={newElection.endDate}
                      onChange={(e) => setNewElection({ ...newElection, endDate: e.target.value })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!newElection.title || !newElection.startDate || !newElection.endDate) {
                        setCreateError('Please fill in Title, Start Date, and End Date.');
                        return;
                      }
                      setCreateError(null);
                      setCreateStep('candidates');
                    }}
                    className="w-full premium-gradient text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.15em] text-sm shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Next: Add Candidates <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  {/* Candidates List */}
                  <div className="space-y-4">
                    {newCandidates.map((candidate, index) => (
                      <div key={index} className="bg-slate-50 rounded-[2rem] p-6 space-y-4 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Candidate {index + 1}</span>
                          {newCandidates.length > 1 && (
                            <button
                              onClick={() => setNewCandidates(newCandidates.filter((_, i) => i !== index))}
                              className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-all text-xs"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={candidate.name}
                            onChange={(e) => {
                              const updated = [...newCandidates];
                              updated[index].name = e.target.value;
                              setNewCandidates(updated);
                            }}
                            className="bg-white border-0 rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm placeholder:text-slate-300 outline-none"
                            placeholder="Full Name *"
                          />
                          <input
                            type="text"
                            value={candidate.party}
                            onChange={(e) => {
                              const updated = [...newCandidates];
                              updated[index].party = e.target.value;
                              setNewCandidates(updated);
                            }}
                            className="bg-white border-0 rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm placeholder:text-slate-300 outline-none"
                            placeholder="Party Name *"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={candidate.symbol}
                              onChange={(e) => {
                                const updated = [...newCandidates];
                                updated[index].symbol = e.target.value;
                                setNewCandidates(updated);
                              }}
                              className="w-full bg-white border-0 rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm placeholder:text-slate-300 outline-none"
                              placeholder="Symbol (emoji or /path) 🌟"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                              <SymbolRenderer symbol={candidate.symbol || '🏛️'} className="w-5 h-5" />
                            </div>
                            <label className="absolute -bottom-6 left-2 text-[8px] font-bold text-indigo-400 cursor-pointer hover:underline uppercase">
                              Upload Image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const updated = [...newCandidates];
                                      updated[index].symbol = reader.result as string;
                                      setNewCandidates(updated);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            value={candidate.slogan}
                            onChange={(e) => {
                              const updated = [...newCandidates];
                              updated[index].slogan = e.target.value;
                              setNewCandidates(updated);
                            }}
                            className="bg-white border-0 rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm placeholder:text-slate-300 outline-none"
                            placeholder="Slogan"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add More Candidate Button */}
                  <button
                    onClick={() => setNewCandidates([...newCandidates, { name: '', party: '', symbol: '', slogan: '' }])}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Another Candidate
                  </button>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => { setCreateStep('details'); setCreateError(null); }}
                      className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateElection}
                      disabled={isCreating}
                      className="flex-1 premium-gradient text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Deploy</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}