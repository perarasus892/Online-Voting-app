import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Bell, Calendar, Tag, AlertTriangle,
    Info, Shield, Loader2, Megaphone, ChevronRight,
    Clock, Search, Filter, Trash2
} from 'lucide-react';
import { announcementAPI } from '../services/api';
import { toast } from 'sonner';

interface AnnouncementsModuleProps {
    user: any;
}

export default function AnnouncementsModule({ user }: AnnouncementsModuleProps) {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', 'General', 'Election', 'Result', 'Security'];

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await announcementAPI.getAll();
            setAnnouncements(data || []);
        } catch (error: any) {
            console.error('Failed to fetch announcements:', error);
            setError('Signal lost. Unable to retrieve broadcast data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to decommission this announcement?')) return;

        try {
            await announcementAPI.delete(id);
            setAnnouncements(announcements.filter(a => a.id !== id));
            toast.success('Announcement decommissioned successfully');
        } catch (err) {
            toast.error('Failed to delete announcement');
        }
    };

    const filteredAnnouncements = announcements.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Megaphone className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[9px] mt-6">Decoding Broadcast Streams...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-50/50 pb-24 overflow-y-auto hide-scrollbar">
            {/* ===== HEADER ===== */}
            <div className="premium-gradient-dark px-10 pt-20 pb-24 rounded-b-[4rem] relative overflow-hidden flex flex-col items-center shadow-xl shadow-indigo-950/10">
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl opacity-20" />
                <div className="absolute bottom-[-20%] right-[-10%] w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl opacity-30" />

                <div className="w-full max-w-lg relative">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-4 bg-white/10 backdrop-blur-3xl rounded-[1.5rem] border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-2xl border border-indigo-500/20">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                            <span className="text-indigo-100 font-black text-[10px] uppercase tracking-widest">Broadcast Active</span>
                        </div>
                    </div>
                    <h1 className="text-white text-4xl font-black tracking-tighter italic mb-2">Announcements</h1>
                    <p className="text-indigo-300/60 text-[10px] uppercase font-black tracking-[0.2em]">Official Citizen Communication Channel</p>
                </div>
            </div>

            <div className="w-full max-w-lg mx-auto px-6 -mt-12 space-y-8 animate-in relative z-10">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-[2.5rem] p-3 shadow-xl shadow-slate-200 border border-slate-100 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Search bulletins..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 rounded-[1.75rem] pl-14 pr-6 py-4 focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-200 outline-none text-sm"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto hide-scrollbar px-2 pb-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Announcements List */}
                <div className="space-y-4">
                    {filteredAnnouncements.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 italic transition-all shadow-sm">
                            <Bell className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">No Broadcasts Detected</p>
                        </div>
                    ) : (
                        filteredAnnouncements.map((ann, idx) => (
                            <div
                                key={ann.id}
                                className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all group animate-in"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${ann.priority === 'high' ? 'bg-rose-50 text-rose-500' :
                                                ann.priority === 'medium' ? 'bg-amber-50 text-amber-500' :
                                                    'bg-indigo-50 text-indigo-500'
                                            }`}>
                                            {ann.priority === 'high' ? <AlertTriangle className="w-5 h-5" /> :
                                                ann.category === 'Security' ? <Shield className="w-5 h-5" /> :
                                                    <Info className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">{ann.category} Bulletin</span>
                                                {ann.priority === 'high' && (
                                                    <span className="bg-rose-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-tighter">Urgent</span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-slate-800 tracking-tight text-lg leading-tight group-hover:text-indigo-600 transition-colors uppercase">{ann.title}</h3>
                                        </div>
                                    </div>
                                    {user.role === 'admin' && (
                                        <button
                                            onClick={(e) => handleDelete(ann.id, e)}
                                            className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6">
                                    {ann.content}
                                </p>

                                <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3 h-3 text-slate-300" />
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                                {new Date(ann.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-slate-300" />
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                                {new Date(ann.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Global Security Disclaimer */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white text-center relative overflow-hidden transition-all hover:bg-slate-950 shadow-xl shadow-indigo-900/10">
                    <Shield className="w-8 h-8 text-indigo-400 mx-auto mb-4 opacity-50" />
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-4">Official Dispatch</p>
                    <p className="text-indigo-200/50 text-[10px] leading-relaxed font-medium italic">
                        This channel is cryptographically signed and verified. <br />
                        Only authenticated administrators can post to this neural feed.
                    </p>
                </div>
            </div>
        </div>
    );
}
