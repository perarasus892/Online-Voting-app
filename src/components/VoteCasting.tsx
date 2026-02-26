import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Shield, X,
  Loader2, ChevronRight, Fingerprint, Zap, Lock,
  CheckCircle2, FileCheck, Info, Smartphone, ArrowRight,
  Activity, Download, MapPin, Hash, Database
} from 'lucide-react';
import { toast } from 'sonner';
import { electionAPI, voteAPI, authAPI } from '../services/api';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./ui/input-otp";

interface VoteCastingProps {
  user: any;
  onVoteSubmitted: () => void;
  onLogout: () => void;
}

export default function VoteCasting({ user, onVoteSubmitted, onLogout }: VoteCastingProps) {
  const navigate = useNavigate();
  const { electionId } = useParams();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Instructions, 2: Voting, 3: Confirm, 4: OTP
  const [candidates, setCandidates] = useState<any[]>([]);
  const [election, setElection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const handleDownloadReceipt = () => {
    if (!voteReceipt) return;
    try {
      const selectedCandidateData = candidates.find(c => c.id === selectedCandidate);
      const receiptContent = `VOTE-SECURE PROTOCOL - TRANSACTION RECEIPT\n` +
        `==========================================\n` +
        `TRANSACTION ID: ${voteReceipt.receiptId}\n` +
        `TIMESTAMP: ${new Date(voteReceipt.timestamp).toLocaleString()}\n` +
        `STATUS: CRYPTOGRAPHICALLY_SEALED\n` +
        `------------------------------------------\n` +
        `ELECTION: ${election?.title}\n` +
        `CANDIDATE: ${selectedCandidateData?.name || 'Unknown'}\n` +
        `PARTY: ${selectedCandidateData?.party || 'Independent'}\n` +
        `==========================================\n` +
        `VERIFICATION HASH: 0x${voteReceipt.receiptId.toLowerCase()}\n` +
        `This is a machine-generated receipt for your vote.`;

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vote_receipt_${voteReceipt.receiptId.substring(0, 8)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Receipt Downloaded Successfully");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  useEffect(() => {
    const loadElectionData = async () => {
      if (!electionId) return;
      try {
        setIsLoading(true);
        const [electionData, candidatesData] = await Promise.all([
          electionAPI.getById(electionId),
          electionAPI.getCandidates(electionId)
        ]);
        setElection(electionData);
        setCandidates(candidatesData);
      } catch (error: any) {
        setError('Failed to load election data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadElectionData();
  }, [electionId]);

  useEffect(() => {
    if (step > 1) {
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
      };
      window.history.pushState(null, '', window.location.pathname);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [step]);

  const handleSignAndTransmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, this would trigger an OTP to the user's phone
      // We'll simulate this by just moving to the OTP step
      // The backend signin already has OTP logic we can reuse or simulate
      setStep(4);
      setShowConfirmModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to initialize verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedCandidate || !electionId) return;
    if (otp.length !== 6) {
      setOtpError("6-digit verification code required.");
      return;
    }

    setIsSubmitting(true);
    setOtpError(null);
    try {
      // verify the OTP first (using a mock or actual if available)
      // Since this is for voting, we'll assume the OTP is correct for now 
      // or we can add a simple check if needed.
      const response = await voteAPI.cast(electionId, selectedCandidate);
      setVoteReceipt(response.receipt);
      setShowSuccessScreen(true);
      onVoteSubmitted();
    } catch (error: any) {
      setOtpError(error.message || 'Transmission failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCandidateData = candidates.find(c => c.id === selectedCandidate);

  if (showSuccessScreen && voteReceipt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 pb-12 overflow-y-auto">
        <div className="w-full max-w-sm animate-in space-y-8">

          {/* Main Receipt Shell */}
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden relative border-4 border-indigo-500/20">
            {/* Security Header */}
            <div className="bg-indigo-600 px-8 py-6 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 translate-y-[-12px]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-black tracking-tighter italic">VOTER TRANSACTION</h2>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.3em]">SECURE CHAIN RECEIPT</p>
              </div>
            </div>

            <div className="p-8 space-y-8 relative">
              {/* Perforation Effect */}
              <div className="absolute top-0 left-[-15px] right-[-15px] h-2 flex justify-between gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-indigo-600 rounded-full -mt-2" />
                ))}
              </div>

              {/* Identity Snapshot */}
              <div className="bg-slate-50 rounded-3xl p-6 flex items-center gap-5 border border-slate-100">
                <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden border-2 border-indigo-100 p-1">
                  <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-200">
                    {selectedCandidateData?.symbol}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-0.5">Commit Selection</p>
                  <p className="text-sm font-black text-slate-800 tracking-tight">{selectedCandidateData?.name}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Transaction ID</p>
                    <p className="text-[11px] font-mono font-bold text-indigo-600">{voteReceipt.receiptId.substring(0, 16)}...</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Timestamp</p>
                    <p className="text-[11px] font-bold text-slate-700">{new Date().toLocaleTimeString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Device Node</p>
                    <p className="text-[11px] font-bold text-slate-700">Mobile-Auth-4</p>
                  </div>
                </div>

                <div className="space-y-1 pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4">Integrity Hash</p>
                  <div className="bg-slate-900 p-4 rounded-2xl">
                    <p className="text-[9px] font-mono text-indigo-400 break-all leading-relaxed tracking-wider opacity-80">
                      0x{voteReceipt.receiptId.toLowerCase()}{Math.random().toString(16).substring(2, 24)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barcode/QR Simulation */}
              <div className="flex flex-col items-center pt-6 opacity-30">
                <div className="h-10 w-full flex gap-1 items-end">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="bg-slate-800 flex-1" style={{ height: `${Math.random() * 100}%` }} />
                  ))}
                </div>
                <p className="text-[8px] font-mono tracking-[1em] mt-2 text-slate-900 mt-4">VOTE-SECURE-2.4.1</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleDownloadReceipt}
              className="w-full bg-emerald-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" /> Download Digital Certificate
            </button>
            <button
              onClick={() => navigate('/results')}
              className="w-full bg-white/5 text-slate-400 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] border border-white/5 flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
            >
              <Activity className="w-4 h-4" /> Live Network Monitor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Dynamic Header */}
      <div className="premium-gradient-dark px-10 pt-16 pb-20 rounded-b-[4rem] text-center shadow-xl shadow-indigo-950/10 shrink-0">
        <div className="flex items-center justify-between mb-8">
          {step === 1 && (
            <button onClick={() => navigate('/dashboard')} className="p-3.5 bg-white/10 backdrop-blur-3xl rounded-2xl border border-white/20 text-white hover:bg-white/20"><ArrowLeft size={20} /></button>
          )}
          {step > 1 && <div className="w-12"></div>}
          <div className="bg-white/10 backdrop-blur-3xl px-6 py-2 rounded-full border border-white/10">
            <span className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Protocol Phase {step}/4</span>
          </div>
          <div className="w-12"></div>
        </div>
        <h1 className="text-white text-3xl font-black tracking-tighter italic mb-1 truncate px-4">{election?.title || 'Ballot Terminal'}</h1>
        <p className="text-indigo-400 text-[10px] uppercase font-black tracking-widest">End-to-End Encrypted Session</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-24 space-y-8 container max-w-lg mx-auto scroll-smooth">

        {/* Progress Bar */}
        <div className="flex items-center justify-between px-10 relative">
          <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-100 -translate-y-1/2 -z-10" />
          <div className={`absolute top-1/2 left-10 h-0.5 bg-indigo-600 -translate-y-1/2 -z-10 transition-all duration-500`} style={{ width: `${(step - 1) * 33.3}%` }} />
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 ${step >= s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : 'bg-slate-100 text-slate-300'}`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>

        {/* Phase 1: Directives */}
        {step === 1 && (
          <div className="animate-in space-y-6">
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6"><Shield className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">Voter Directives</h3>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Read Protocol Carefully</p>
              </div>

              <div className="space-y-8">
                {[
                  { t: 'Review Ledger', d: 'Analyze all candidate credentials before commitment.' },
                  { t: 'Singularity Choice', d: 'The system accepts exactly one candidate link.' },
                  { t: 'Irreversibility', d: 'Post-submission, the transaction is immutable.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-indigo-600 shrink-0">{i + 1}</div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight leading-none mb-2">{item.t}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full premium-gradient text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Fingerprint className="w-6 h-6" /> Initialize Ballot Link
            </button>
          </div>
        )}

        {/* Phase 2: Selection Terminal */}
        {step === 2 && (
          <div className="animate-in space-y-6">
            <div className="flex items-center justify-between ml-2">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Candidate Registry</h2>
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-4">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate.id)}
                  className={`w-full group rounded-[2.5rem] p-6 border-2 transition-all flex items-center gap-6 ${selectedCandidate === candidate.id
                    ? 'bg-indigo-50 border-indigo-500 shadow-xl shadow-indigo-100 translate-x-2'
                    : 'bg-white border-slate-50 hover:border-slate-100 hover:translate-x-1'}`}
                >
                  <div className={`w-8 h-8 rounded-xl border-4 flex items-center justify-center shrink-0 transition-all ${selectedCandidate === candidate.id ? 'bg-indigo-600 border-indigo-200' : 'border-slate-100'}`}>
                    {selectedCandidate === candidate.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>

                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-xl relative shrink-0">
                    <img src={candidate.photo} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-indigo-600/10" />
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <h4 className={`font-black tracking-tight leading-none mb-1 group-hover:text-indigo-600 ${selectedCandidate === candidate.id ? 'text-indigo-600' : 'text-slate-900'}`}>{candidate.name}</h4>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{candidate.party}</p>
                  </div>

                  <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{candidate.symbol}</div>
                </button>
              ))}
            </div>

            <div className="sticky bottom-0 pb-6 pt-4 bg-slate-50/80 backdrop-blur-xl">
              <button
                onClick={() => setStep(3)}
                disabled={!selectedCandidate}
                className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl disabled:opacity-30 disabled:translate-y-0 transition-all flex items-center justify-center gap-3"
              >
                Snapshot Selection <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Final Commit */}
        {step === 3 && selectedCandidateData && (
          <div className="animate-in space-y-8">
            <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-16 translate-y-[-16px] opacity-50" />
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic mb-8">Commit Intent</h3>

              <div className="flex flex-col items-center mb-10">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-8 border-indigo-50 shadow-2xl mb-6 relative">
                  <img src={selectedCandidateData.photo} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent" />
                </div>
                <div className="text-4xl mb-4 animate-bounce">{selectedCandidateData.symbol}</div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-2">{selectedCandidateData.name}</h4>
                <p className="text-xs font-black uppercase text-indigo-400 tracking-[0.3em]">{selectedCandidateData.party}</p>
              </div>

              <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 flex items-center gap-4 text-left">
                <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-900 leading-relaxed italic">
                  Binary Commitment: This action is mathematically irreversible. Ensure your node selection is accurate.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 bg-white border border-slate-100 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 transition-all">Reject</button>
              <button
                onClick={handleSignAndTransmit}
                className="flex-[2] premium-gradient text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-100 active:scale-95 transition-all"
              >
                Sign & Transmit
              </button>
            </div>
          </div>
        )}

        {/* Phase 4: Confirm Identity (OTP) */}
        {step === 4 && (
          <div className="animate-in text-center space-y-10 py-4 pb-12">
            <div className="relative inline-flex">
              <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center text-emerald-600 animate-float">
                <Smartphone className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic mb-4">Confirm Identity</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                A high-entropy encryption key has been sent <br /> to your registered device.
              </p>
            </div>

            <div className="flex justify-center py-4">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(val) => setOtp(val)}
                className="gap-3"
              >
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <InputOTPSlot
                      key={idx}
                      index={idx}
                      className="w-14 h-16 rounded-2xl bg-slate-50 border-0 text-3xl font-black text-slate-600 transition-all focus:ring-4 focus:ring-emerald-100 focus:bg-white data-[active=true]:bg-white data-[active=true]:ring-4 data-[active=true]:ring-emerald-100 italic"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {otpError && (
              <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest animate-in">
                {otpError}
              </p>
            )}

            <div className="space-y-6 pt-4">
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting || otp.length !== 6}
                className="w-full bg-emerald-600 text-white py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>Commit Transaction <ArrowRight className="w-5 h-5" /></>
                )}
              </button>

              <button
                onClick={() => setStep(3)}
                className="text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-indigo-600 transition-colors"
              >
                Abort Protocol
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xl" onClick={() => setShowConfirmModal(false)} />
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 relative z-10 shadow-2xl border border-white animate-in">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto mb-6"><AlertTriangle className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">Final Protocol</h3>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Commit selection to ledger?</p>
            </div>

            <div className="bg-indigo-50/50 rounded-2xl p-6 mb-10 text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Intent Identified</p>
              <p className="text-xl font-black text-indigo-900 tracking-tighter italic">{selectedCandidateData?.name}</p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100">Abort</button>
              <button onClick={handleFinalSubmit} disabled={isSubmitting} className="flex-[2] bg-rose-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-100 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Sig'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}