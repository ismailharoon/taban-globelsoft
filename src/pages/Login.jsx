import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  QrCode,
  KeyRound,
  ArrowRight,
  Plane
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import BooklyLogo from '../components/BooklyLogo';

export default function Login() {
  const { login, verifyOtpAndFinishLogin, addToast } = usePortal();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [require2FA, setRequire2FA] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState('credentials');
  const [pendingUser, setPendingUser] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [otpAuthUri, setOtpAuthUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginId.trim() || !password) {
      setErrorMsg('Please enter both Login ID and Password.');
      addToast('Please enter both Login ID and Password.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await login(loginId, password, require2FA);
      if (res.status === '2fa_required') {
        setPendingUser(res.user);
        setIsEnrolled(Boolean(res.isEnrolled));
        setManualKey(res.manualKey || '');
        setOtpAuthUri(res.otpAuthUri || '');
        setTotpSecret(res.secret || '');
        setOtpCode('');
        setErrorMsg('');
        setStep('otp');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message);
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await verifyOtpAndFinishLogin(pendingUser, otpCode, totpSecret);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message);
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-slate-50">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:col-span-6 bg-[#0F172A] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle Aviation Background Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('/images/login-left.jpg')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent" />

        <div className="relative z-10 flex items-center gap-3">
          <BooklyLogo size={42} />
          <div>
            <span className="font-display font-bold text-xl tracking-wide block leading-none">
              BOOKLY
            </span>
            <span className="text-[11px] text-slate-300 tracking-wider uppercase">
              B2B Aviation Portal
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-md my-auto">
          <h1 className="font-display font-semibold text-4xl leading-tight">
            Airline Inventory &amp; Partner Ticketing Portal
          </h1>
          <p className="text-slate-300 text-base mt-4 leading-relaxed">
            Centralized seat allocation, real-time partner agency reservations, automated e-ticketing, and live account statements.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-5">
          <span>&copy; {new Date().getFullYear()} KynexaSoft. All rights reserved.</span>
          <span>kynexasoft.com</span>
        </div>
      </div>

      {/* Right Sign-In Panel with Subtle Airplane Backdrop */}
      <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden bg-white">
        {/* Subtle Right-Side Aviation Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "url('/images/login-right.jpg')"
          }}
        />

        <div className="hidden lg:block" />

        <div className="relative z-10 w-full max-w-md mx-auto bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-sm p-7 sm:p-9">
          <div className="mb-7 flex items-center gap-3.5">
            <BooklyLogo size={44} />
            <div>
              <h2 className="font-display font-semibold text-2xl text-slate-900 leading-tight">
                Sign In
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Enter your credentials to access the portal
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Login ID
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter your Login ID"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none text-sm bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none text-sm bg-white transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={require2FA}
                    onChange={(e) => setRequire2FA(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#1B3664] focus:ring-[#1B3664]"
                  />
                  <span>Two-Factor Authentication (2FA)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-5 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              {!isEnrolled ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B3664] text-white text-xs font-semibold">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Google Authenticator Setup</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Open <b>Google Authenticator</b> on your phone, scan the QR code below, and enter the 6-digit code.
                  </p>
                  {otpAuthUri && (
                    <div className="flex justify-center py-1">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=170x170&ecc=M&data=${encodeURIComponent(
                          otpAuthUri
                        )}`}
                        alt="Google Authenticator QR Code"
                        className="w-40 h-40 rounded-lg border border-slate-200 bg-white p-2"
                      />
                    </div>
                  )}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                    <span className="text-slate-500">Setup key:</span>
                    <div className="font-mono font-bold text-[#1B3664] tracking-wider mt-0.5 select-all">
                      {manualKey}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-lg bg-[#1B3664] text-white flex items-center justify-center mx-auto mb-1">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h5 className="font-semibold text-sm text-slate-900">
                    Two-Factor Verification
                  </h5>
                  <p className="text-xs text-slate-600">
                    Enter the 6-digit code from your <b>Google Authenticator</b> app for <b>{pendingUser?.LoginID}</b>.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  6-Digit Code
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B3664]">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none text-base font-mono font-bold tracking-widest"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="px-4 py-3 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-5 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-semibold text-sm transition cursor-pointer"
                >
                  {isEnrolled ? 'Verify & Sign In' : 'Verify & Activate'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="relative z-10 text-center text-xs text-slate-400 pt-4">
          &copy; {new Date().getFullYear()} <b className="text-slate-600">KynexaSoft</b>. All rights reserved.
        </div>
      </div>
    </div>
  );
}
