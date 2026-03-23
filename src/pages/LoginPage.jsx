import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(studentId.trim(), password);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #f0f4f8; }

        .lp-page {
          display: flex; min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Left panel ── */
        .lp-left {
          flex: 1; background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 60px 48px; position: relative; overflow: hidden;
        }
        .lp-left::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Ccircle cx='40' cy='40' r='30' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='15' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 80px 80px;
        }
        .lp-left-blob1 {
          position: absolute; width: 320px; height: 320px; border-radius: 50%;
          background: rgba(99,102,241,0.2); filter: blur(80px);
          top: -80px; right: -80px; pointer-events: none;
        }
        .lp-left-blob2 {
          position: absolute; width: 240px; height: 240px; border-radius: 50%;
          background: rgba(59,130,246,0.15); filter: blur(60px);
          bottom: -60px; left: -60px; pointer-events: none;
        }
        .lp-left-inner { max-width: 420px; position: relative; z-index: 1; }
        .lp-logo-mark {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center; margin-bottom: 36px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .lp-logo-text { color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 1px; }
        .lp-hero-title {
          color: #fff; font-size: 34px; font-weight: 800; line-height: 1.2;
          margin-bottom: 16px; letter-spacing: -0.5px;
        }
        .lp-hero-title span { color: #93c5fd; }
        .lp-hero-sub { color: #94a3b8; font-size: 15px; line-height: 1.7; margin-bottom: 36px; }
        .lp-features { display: flex; flex-direction: column; gap: 14px; }
        .lp-feature-item {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 12px 14px;
          backdrop-filter: blur(6px);
        }
        .lp-feature-icon {
          width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
        }
        .lp-feature-text { color: #cbd5e1; font-size: 13px; font-weight: 500; }

        /* ── Right panel ── */
        .lp-right {
          width: 480px; display: flex; align-items: center; justify-content: center;
          padding: 48px 44px; background: #fff;
          box-shadow: -4px 0 40px rgba(0,0,0,0.08);
        }
        .lp-form { width: 100%; max-width: 380px; }
        .lp-form-header { margin-bottom: 36px; }
        .lp-form-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg,#2563eb,#6366f1);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 12px; font-weight: 800; letter-spacing: 1px;
          margin-bottom: 22px; box-shadow: 0 4px 14px rgba(37,99,235,0.4);
        }
        .lp-form-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.3px; }
        .lp-form-sub   { font-size: 14px; color: #64748b; line-height: 1.5; }

        .lp-field { margin-bottom: 18px; }
        .lp-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 7px; }
        .lp-input-wrap { position: relative; }
        .lp-input {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; color: #0f172a; outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f8faff; transition: all 0.18s; font-weight: 500;
        }
        .lp-input::placeholder { color: #94a3b8; font-weight: 400; }
        .lp-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .lp-input-pass { padding-right: 44px; }
        .lp-pass-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8;
          display: flex; align-items: center; padding: 4px; transition: color 0.18s;
        }
        .lp-pass-toggle:hover { color: #475569; }

        .lp-err {
          display: flex; align-items: center; gap: 10px;
          background: #fff5f5; border: 1px solid #fecaca; border-radius: 10px;
          padding: 11px 14px; font-size: 13px; color: #dc2626;
          margin-bottom: 18px; font-weight: 500;
        }
        .lp-err-icon {
          width: 20px; height: 20px; border-radius: 50%; background: #fee2e2;
          color: #dc2626; display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; flex-shrink: 0;
        }

        .lp-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg,#2563eb,#4f46e5);
          color: #fff; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.18s; letter-spacing: 0.2px;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          margin-top: 4px;
        }
        .lp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.45); }
        .lp-btn:active { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .lp-btn-loading { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .lp-spinner {
          width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff; border-radius: 50%; animation: lp-spin 0.7s linear infinite;
        }
        @keyframes lp-spin { to { transform: rotate(360deg); } }

        .lp-help { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 22px; line-height: 1.5; }
        .lp-divider {
          display: flex; align-items: center; gap: 12px; margin: 22px 0;
        }
        .lp-divider-line { flex: 1; height: 1px; background: #f1f5f9; }
        .lp-divider-text { font-size: 11px; color: #cbd5e1; font-weight: 500; }

        /* ── RESPONSIVE ── */

        /* Tablet */
        @media (max-width: 900px) {
          .lp-left { padding: 48px 36px; }
          .lp-right { width: 420px; padding: 48px 36px; }
          .lp-hero-title { font-size: 28px; }
        }

        /* Mobile — stack vertically */
        @media (max-width: 680px) {
          .lp-page { flex-direction: column; }
          .lp-left {
            padding: 40px 24px 36px;
            min-height: auto;
          }
          .lp-hero-title { font-size: 24px; margin-bottom: 12px; }
          .lp-hero-sub { font-size: 13px; margin-bottom: 24px; }
          .lp-logo-mark { width: 44px; height: 44px; margin-bottom: 24px; }
          .lp-features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .lp-feature-item { padding: 10px 12px; }
          .lp-feature-text { font-size: 12px; }
          .lp-right {
            width: 100%; padding: 36px 24px 48px;
            box-shadow: none; flex: 1;
          }
          .lp-form { max-width: 100%; }
          .lp-form-title { font-size: 22px; }
        }

        /* Small mobile */
        @media (max-width: 400px) {
          .lp-left { padding: 32px 20px 28px; }
          .lp-right { padding: 28px 20px 40px; }
          .lp-features { grid-template-columns: 1fr; }
          .lp-hero-title { font-size: 22px; }
          .lp-btn { font-size: 14px; padding: 12px; }
        }
      `}</style>

      <div className="lp-page">
        {/* Left */}
        <div className="lp-left">
          <div className="lp-left-blob1" />
          <div className="lp-left-blob2" />
          <div className="lp-left-inner">
            <div className="lp-logo-mark">
              <span className="lp-logo-text">DTR</span>
            </div>
            <h1 className="lp-hero-title">
              OJT Daily<br/><span>Time Record</span>
            </h1>
            <p className="lp-hero-sub">
              Track your on-the-job training hours, view scan logs, and monitor your progress — all in one place.
            </p>
            <div className="lp-features">
              {[
                { icon: '🕐', text: 'Real-time scan log tracking' },
                { icon: '📊', text: 'Hours progress monitoring' },
                { icon: '👤', text: 'Coordinator contact details' },
              ].map(f => (
                <div key={f.text} className="lp-feature-item">
                  <div className="lp-feature-icon">{f.icon}</div>
                  <span className="lp-feature-text">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lp-right">
          <form onSubmit={handleSubmit} className="lp-form">
            <div className="lp-form-header">
              <div className="lp-form-icon">OJT</div>
              <h2 className="lp-form-title">Student Login</h2>
              <p className="lp-form-sub">Enter your credentials to access your DTR</p>
            </div>

            <div className="lp-field">
              <label className="lp-label">Student ID</label>
              <div className="lp-input-wrap">
                <input
                  type="text"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="e.g. 59828781"
                  className="lp-input"
                  required autoFocus
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label">Password</label>
              <div className="lp-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="lp-input lp-input-pass"
                  required
                />
                <button type="button" className="lp-pass-toggle" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                  {showPass
                    ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div className="lp-err">
                <div className="lp-err-icon">!</div>
                {error}
              </div>
            )}

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading
                ? <span className="lp-btn-loading"><span className="lp-spinner"/>&nbsp;Signing in…</span>
                : 'Sign In →'
              }
            </button>

            <div className="lp-divider">
              <div className="lp-divider-line"/>
              <span className="lp-divider-text">OJT PORTAL</span>
              <div className="lp-divider-line"/>
            </div>

            <p className="lp-help">Contact your coordinator if you have trouble logging in.</p>
          </form>
        </div>
      </div>
    </>
  );
}