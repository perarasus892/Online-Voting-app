import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, User, Eye, EyeOff, Loader2,
  Smartphone, CheckCircle2, AlertCircle, ArrowRight,
  Mail
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
  const [errors, setErrors] = useState<any>({});
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverOtp, setServerOtp] = useState('');
  const [pendingUserData, setPendingUserData] = useState<any>(null);

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.voterId) newErrors.voterId = 'Voter ID / Mobile required';
    if (!isLogin) {
      if (!formData.name) newErrors.name = 'Full name required';
      if (!formData.mobile) newErrors.mobile = 'Mobile required';
      else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = '10-digit number required';
    }
    if (!formData.password) newErrors.password = 'Password required';
    else if (!isLogin && formData.password.length < 8) newErrors.password = '8+ characters required';
    if (!isLogin && formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
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
      setErrors({ submit: error.message || 'Authentication failed.' });
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
      setErrors({ otp: error.message || 'Verification failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ===== DARK NAVY HEADER ===== */}
      <div className="w-full bg-[#1a1a5e] px-6 pt-14 pb-10 text-center relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a5e] via-[#252580] to-[#1a1a5e] opacity-80" />
        <div className="relative z-10">
          <h1 className="text-white text-2xl font-bold tracking-wide">Vote App</h1>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col items-center px-6 -mt-4 relative z-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

          {!showOtpStep ? (
            <>
              {/* Tab Switcher */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-4 text-sm font-bold tracking-wide transition-all ${isLogin
                    ? 'text-[#1a1a5e] border-b-2 border-[#1a1a5e]'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-4 text-sm font-bold tracking-wide transition-all ${!isLogin
                    ? 'text-[#1a1a5e] border-b-2 border-[#1a1a5e]'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  Register
                </button>
              </div>

              <div className="p-8">
                {/* Logo / Icon */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{isLogin ? 'Login' : 'Register'}</h2>
                  <p className="text-slate-400 text-xs mt-1">
                    {isLogin ? 'Sign in to your account' : 'Create a new account'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name (Register only) */}
                  {!isLogin && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300"
                          placeholder="Enter your full name"
                        />
                      </div>
                      {errors.name && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.name}</p>}
                    </div>
                  )}

                  {/* Voter ID / Mobile */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                      {isLogin ? 'Voter ID / Mobile' : 'Voter ID'}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.voterId}
                        onChange={(e) => setFormData({ ...formData, voterId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300"
                        placeholder={isLogin ? 'Voter ID or Mobile Number' : 'Enter your Voter ID'}
                      />
                    </div>
                    {errors.voterId && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.voterId}</p>}
                  </div>

                  {/* Mobile (Register only) */}
                  {!isLogin && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Mobile Number</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300"
                          placeholder="Enter 10-digit mobile"
                          maxLength={10}
                        />
                      </div>
                      {errors.mobile && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.mobile}</p>}
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.password}</p>}
                  </div>

                  {/* Confirm Password (Register only) */}
                  {!isLogin && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300"
                          placeholder="Re-enter your password"
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.confirmPassword}</p>}
                    </div>
                  )}

                  {/* Error Banner */}
                  {errors.submit && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errors.submit}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#1a1a5e] hover:bg-[#252580] text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>{isLogin ? 'Login' : 'Register'}</>
                    )}
                  </button>
                </form>

                {/* Footer Link */}
                <p className="text-center text-xs text-slate-400 mt-6">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-[#4f46e5] font-semibold hover:underline"
                  >
                    {isLogin ? 'Register' : 'Login'}
                  </button>
                </p>
              </div>
            </>
          ) : (
            /* ===== OTP VERIFICATION SCREEN ===== */
            <div className="p-8">
              <form onSubmit={handleOtpVerify} className="text-center space-y-8">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 mb-4">
                    <Smartphone className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -mt-1 ml-14">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 bg-white rounded-full" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">OTP Verification</h3>
                  <p className="text-slate-400 text-sm">
                    Enter the 6-digit code sent to your mobile
                  </p>
                  {/* Dev Mode OTP Display */}
                  {serverOtp && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 inline-block">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-0.5">Dev Mode — Your OTP</p>
                      <p className="text-xl font-bold text-amber-700 tracking-[0.3em]">{serverOtp}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center py-2 relative">
                  <InputOTP
                    maxLength={6}
                    value={formData.otp}
                    onChange={(val) => setFormData({ ...formData, otp: val })}
                    className="gap-2"
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <InputOTPSlot
                          key={idx}
                          index={idx}
                          className="w-12 h-14 rounded-xl bg-slate-50 border border-slate-200 text-2xl font-bold text-slate-800 transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white data-[active=true]:bg-white data-[active=true]:ring-2 data-[active=true]:ring-indigo-500"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {errors.otp && <p className="absolute -bottom-6 left-0 right-0 text-rose-500 text-[11px] font-semibold">{errors.otp}</p>}
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#1a1a5e] hover:bg-[#252580] text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify OTP <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOtpStep(false)}
                    className="text-slate-400 font-semibold text-xs hover:text-[#4f46e5] transition-colors"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Disclaimer */}
        <div className="mt-8 mb-6 text-center">
          <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-widest">Secured by Vote-Secure Protocol</p>
        </div>
      </div>
    </div>
  );
}