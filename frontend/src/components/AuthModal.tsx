"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck
} from "lucide-react";
import { requestOtp, verifyOtpAndPassword } from "@/services/api";
import { AuthUser } from "@/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Password Validation Rules: max 10 chars, at least 1 capital, 1 number, 1 special char
  const hasMinMax = password.length >= 6 && password.length <= 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinMax && hasUpper && hasNumber && hasSpecial && passwordsMatch;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setDevOtp(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await requestOtp(email);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
        setOtp(res.dev_otp);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Unable to send verification code. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleCreatePasswordAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please satisfy all password security requirements.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtpAndPassword({
        email,
        otp,
        password,
        confirm_password: confirmPassword
      });
      const user: AuthUser = {
        email: res.email,
        token: res.token,
        logged_in_at: Date.now()
      };
      localStorage.setItem("apex_user", JSON.stringify(user));
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200/90 shadow-2xl shadow-slate-900/15 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Sleek Minimal Header */}
        <div className="p-5 pb-0 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {step === 1 && "Account Access"}
                {step === 2 && "Verification Code"}
                {step === 3 && "Set Password"}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {step === 1 && "Enter your email to continue"}
                {step === 2 && `Sent to ${email}`}
                {step === 3 && "Max 10 characters"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtle Progress Bar */}
        <div className="px-5 pt-3">
          <div className="flex items-center space-x-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-8 bg-blue-600"
                    : s < step
                    ? "w-4 bg-emerald-500"
                    : "w-4 bg-slate-150"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center space-x-2 text-[11px] text-rose-700 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 pt-4">
          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Sending..." : "Continue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              {devOtp && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                  <span>Code: <strong className="font-mono">{devOtp}</strong></span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    Auto-filled
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">
                    6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[10px] text-blue-600 hover:underline flex items-center space-x-0.5 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-2.5 h-2.5" />
                    <span>Change</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Verify Code</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* STEP 3: Password Creation (2 times enter, max 10 chars, 1 capital, 1 number, 1 special char) */}
          {step === 3 && (
            <form onSubmit={handleCreatePasswordAndLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    maxLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Max 10 chars"
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={10}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden"
                  />
                </div>
              </div>

              {/* Minimalist Checklist Grid */}
              <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-50 text-[10px] font-medium text-slate-500 border border-slate-150">
                <div className={`flex items-center space-x-1 ${hasMinMax ? "text-emerald-700 font-bold" : ""}`}>
                  <CheckCircle2 className={`w-3 h-3 ${hasMinMax ? "text-emerald-600" : "text-slate-300"}`} />
                  <span>6-10 Chars</span>
                </div>
                <div className={`flex items-center space-x-1 ${hasUpper ? "text-emerald-700 font-bold" : ""}`}>
                  <CheckCircle2 className={`w-3 h-3 ${hasUpper ? "text-emerald-600" : "text-slate-300"}`} />
                  <span>1 Capital (A-Z)</span>
                </div>
                <div className={`flex items-center space-x-1 ${hasNumber ? "text-emerald-700 font-bold" : ""}`}>
                  <CheckCircle2 className={`w-3 h-3 ${hasNumber ? "text-emerald-600" : "text-slate-300"}`} />
                  <span>1 Number (0-9)</span>
                </div>
                <div className={`flex items-center space-x-1 ${hasSpecial ? "text-emerald-700 font-bold" : ""}`}>
                  <CheckCircle2 className={`w-3 h-3 ${hasSpecial ? "text-emerald-600" : "text-slate-300"}`} />
                  <span>1 Special (!@#$)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-40"
              >
                <span>{loading ? "Authenticating..." : "Complete Setup"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
