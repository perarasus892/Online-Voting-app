import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, Mail, User, Key, Eye, EyeOff, Loader2, RefreshCw,
  Smartphone, CheckCircle2, AlertCircle, ArrowRight,
  Fingerprint
} from 'lucide-react';
import { authAPI } from '../services/api';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./ui/input-otp";

interface AuthModuleProps {
  onLogin: (user: any) => void;
}

export default function AuthModule({ onLogin }: AuthModuleProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    voterId: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverOtp, setServerOtp] = useState('');
  const [pendingUserData, setPendingUserData] = useState<any>(null);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Premium'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.voterId) newErrors.voterId = 'Official ID required';
    if (!isLogin) {
      if (!formData.name) newErrors.name = 'Full name required';
      if (!formData.mobile) newErrors.mobile = 'Mobile required';
      else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = '10-digit number required';
    }
    if (!formData.password) newErrors.password = 'Password required';
    else if (!isLogin && formData.password.length < 8) newErrors.password = '8+ characters required';
    if (!isLogin && formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mismatch detected';
    if (captchaInput.toLowerCase() !== captcha.toLowerCase()) newErrors.captcha = 'Invalid CAPTCHA';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      if (!isLogin) {
        const response = await authAPI.signup(formData.password, formData.name, formData.voterId, formData.mobile, 'voter');
        setServerOtp(response.otp);
        setShowOtpStep(true);
      } else {
        const response = await authAPI.signin(formData.voterId.trim(), formData.password.trim());
        setServerOtp(response.otp);
        setPendingUserData(response.user);
        setShowOtpStep(true);
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Identity verification failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp) { setErrors({ otp: 'OTP required' }); return; }
    setIsLoading(true);
    try {
      const identifier = isLogin ? (pendingUserData?.mobile || formData.voterId) : formData.mobile;
      await authAPI.verifyOTP(identifier, formData.otp);
      if (isLogin && pendingUserData) onLogin(pendingUserData);
      else onLogin({ mobile: formData.mobile, voterId: formData.voterId, name: formData.name, role: 'voter' });
    } catch (error: any) {
      setErrors({ otp: error.message || 'Verification failure.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blooms */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-lg relative z-10 animate-in">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-200 mb-6 group animate-float">
            <Shield className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic mb-2">VOTE-SECURE</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Multi-Chain Biometric Auth</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[3.5rem] shadow-2xl shadow-indigo-950/5 border border-white p-10 overflow-hidden relative">

          {!showOtpStep ? (
            <>
              {/* Custom Switch */}
              <div className="flex bg-slate-100/50 p-2 rounded-[2rem] mb-10 border border-slate-200/50">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] text-[10px] uppercase font-black tracking-widest transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-slate-400'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] text-[10px] uppercase font-black tracking-widest transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-slate-400'}`}
                >
                  Enrolment
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="animate-in" style={{ animationDelay: '100ms' }}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Legal Full Name</label>
                    <div className="relative">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-50 border-0 rounded-3xl pl-16 pr-6 py-5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-200"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="animate-in" style={{ animationDelay: '200ms' }}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Voter ID / Mobile</label>
                  <div className="relative">
                    <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.voterId}
                      onChange={(e) => setFormData({ ...formData, voterId: e.target.value })}
                      className="w-full bg-slate-50 border-0 rounded-3xl pl-16 pr-6 py-5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-200"
                      placeholder="ABC1234567"
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div className="animate-in" style={{ animationDelay: '300ms' }}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Secure Mobile Link</label>
                    <div className="relative">
                      <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full bg-slate-50 border-0 rounded-3xl pl-16 pr-6 py-5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-200"
                        placeholder="9998887770"
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}

                <div className="animate-in" style={{ animationDelay: '400ms' }}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Access Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-50 border-0 rounded-3xl pl-16 pr-16 py-5 focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {!isLogin && formData.password && (
                    <div className="mt-3 px-4">
                      <div className="flex gap-1.5 h-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className={`flex-1 rounded-full ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-100'}`} />
                        ))}
                      </div>
                      <p className="text-[10px] font-black uppercase italic mt-2 text-slate-400 tracking-tighter">Cipher: {strengthLabels[passwordStrength - 1]}</p>
                    </div>
                  )}
                </div>

                {/* CAPTCHA - Visual Polish */}
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 animate-in" style={{ animationDelay: '500ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Anti-Bot Challenge</span>
                    <button type="button" onClick={generateCaptcha} className="text-indigo-600 active:rotate-180 transition-transform"><RefreshCw className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white px-8 py-4 rounded-[1.5rem] font-black text-2xl tracking-[0.2em] italic text-indigo-950 border border-slate-200 shadow-inner select-none pointer-events-none">
                      {captcha}
                    </div>
                    <input
                      className="flex-1 bg-white border border-slate-200 rounded-[1.5rem] px-6 font-black text-lg focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="???"
                    />
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-[1.5rem] text-xs font-black flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> {errors.submit}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full premium-gradient text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Fingerprint className="w-6 h-6" /> Authenticate Identity</>}
                </button>
              </form>
            </>
          ) : (
            /* OTP PREMIUM SCREEN */
            <form onSubmit={handleOtpVerify} className="animate-in text-center space-y-10">
              <div className="relative inline-flex mb-2">
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

              <div className="flex justify-center py-4 relative">
                <InputOTP
                  maxLength={6}
                  value={formData.otp}
                  onChange={(val) => setFormData({ ...formData, otp: val })}
                  className="gap-3"
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <InputOTPSlot
                        key={idx}
                        index={idx}
                        className="w-14 h-16 rounded-2xl bg-slate-50 border-0 text-3xl font-black text-slate-900 transition-all focus:ring-4 focus:ring-emerald-100 focus:bg-white data-[active=true]:bg-white data-[active=true]:ring-4 data-[active=true]:ring-emerald-100 italic"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {errors.otp && <p className="absolute -bottom-6 left-0 right-0 text-rose-500 text-[10px] font-black uppercase tracking-widest">{errors.otp}</p>}
              </div>

              <div className="space-y-4 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Commit Transaction'} <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtpStep(false)}
                  className="text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-indigo-600"
                >
                  Abort Protocol
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12 text-center text-slate-300 font-black uppercase tracking-[0.4em] text-[8px] space-y-2">
          <p>End-to-End Encrypted Session • ISO 27001 Certified Environment</p>
          <p>Powered by Advanced Ledger Protocols</p>
        </div>
      </div>
    </div>
  );
}