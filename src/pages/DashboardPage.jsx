import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchScanLogs } from '../api';

export default function DashboardPage({ onNavigate }) {
  const { student, logout, refreshStats } = useAuth();
  const [logs, setLogs]                   = useState([]);
  const [logsLoading, setLogsLoading]     = useState(!!student?.student_id);
  const [logsError, setLogsError]         = useState('');
  const [statsLoading, setStatsLoading]   = useState(true);
  const [currentTime, setCurrentTime]     = useState(new Date());
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!student?.student_id) return;
    let cancelled = false;
    refreshStats(student.student_id)
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, [student?.student_id]); // eslint-disable-line

  useEffect(() => {
    if (!student?.student_id) return;
    let cancelled = false;
    fetchScanLogs(student.student_id, 10)
      .then(data => {
        if (cancelled) return;
        if (data.success) setLogs(data.logs);
        else setLogsError('Could not load scan logs.');
      })
      .catch(() => { if (!cancelled) setLogsError('Network error loading logs.'); })
      .finally(() => { if (!cancelled) setLogsLoading(false); });
    return () => { cancelled = true; };
  }, [student?.student_id]);

  const initials    = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const pad         = (n) => String(n).padStart(2, '0');
  const fmtHM       = (h, m) => `${h}:${pad(m)}`;
  const fmtHMS      = (h, m, s) => `${h}:${pad(m)}:${pad(s ?? 0)}`;
  const pct         = student?.percent ?? 0;
  const displayName = student?.name || student?.fullname || 'Student';
  const firstName   = displayName.split(' ')[0];

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f0f4f8; }

        .d-shell { display: flex; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; background: #f0f4f8; }

        /* ── Overlay for mobile ── */
        .d-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 40; }
        .d-overlay.open { display: block; }

        /* ── Sidebar ── */
        .d-sidebar {
          width: 256px; flex-shrink: 0; background: #fff;
          border-right: 1px solid #e2eaf3;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 24px 0; position: sticky; top: 0; height: 100vh;
          box-shadow: 2px 0 12px rgba(99,140,199,0.07); z-index: 50;
          transition: transform 0.3s ease;
        }
        .d-logo-wrap { display: flex; align-items: center; gap: 11px; padding: 0 22px 24px; border-bottom: 1px solid #eef2f8; }
        .d-logo-icon { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg,#3b82f6,#6366f1); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(59,130,246,0.35); }
        .d-logo-name { font-size: 15px; font-weight: 700; color: #1e293b; }
        .d-logo-sub  { font-size: 11px; color: #94a3b8; margin-top: 1px; }
        .d-nav { padding: 18px 14px; display: flex; flex-direction: column; gap: 3px; }
        .d-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.18s; }
        .d-nav-item:hover { background: #f1f5fd; color: #3b82f6; }
        .d-nav-item.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
        .d-nav-icon { width: 18px; height: 18px; flex-shrink: 0; }
        .d-profile-wrap { padding: 0 14px 14px; }
        .d-profile { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #f8faff; border-radius: 12px; border: 1px solid #e2eaf3; margin-bottom: 10px; }
        .d-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg,#3b82f6,#6366f1); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; overflow: hidden; border: 2px solid #bfdbfe; }
        .d-profile-name { font-size: 13px; font-weight: 600; color: #1e293b; }
        .d-profile-id   { font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 1px; }
        .d-btn-logout { width: 100%; padding: 10px; background: transparent; border: 1px solid #e2eaf3; border-radius: 10px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: #64748b; cursor: pointer; transition: all 0.18s; font-weight: 500; }
        .d-btn-logout:hover { border-color: #fca5a5; color: #ef4444; background: #fff5f5; }

        /* ── Main ── */
        .d-main { flex: 1; padding: 24px 28px 60px; overflow: auto; min-width: 0; }

        /* Mobile topbar */
        .d-mobile-bar {
          display: none; align-items: center; justify-content: space-between;
          background: #fff; padding: 14px 18px; margin-bottom: 16px;
          border-radius: 14px; border: 1px solid #e2eaf3;
          box-shadow: 0 2px 8px rgba(99,140,199,0.08);
        }
        .d-hamburger { background: none; border: none; cursor: pointer; padding: 4px; color: #64748b; }
        .d-mobile-logo { font-size: 15px; font-weight: 800; color: #1e293b; }
        .d-mobile-logo span { color: #3b82f6; }
        .d-mobile-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#3b82f6,#6366f1); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; overflow: hidden; border: 2px solid #bfdbfe; }

        /* Desktop topbar */
        .d-topbar {
          display: flex; justify-content: space-between; align-items: center;
          background: #fff; border-radius: 16px; padding: 16px 24px;
          margin-bottom: 20px; box-shadow: 0 2px 12px rgba(99,140,199,0.08);
          border: 1px solid #e2eaf3;
        }
        .d-welcome  { font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 3px; }
        .d-title    { font-size: 22px; font-weight: 800; color: #1e293b; }
        .d-title span { color: #3b82f6; }
        .d-topbar-right { text-align: right; }
        .d-clock    { font-size: 20px; font-weight: 700; color: #1e293b; font-family: 'JetBrains Mono', monospace; line-height: 1; }
        .d-date     { font-size: 11px; color: #94a3b8; margin-top: 3px; }
        .d-status-pill { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #16a34a; font-weight: 600; }
        .d-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: dpulse 2s infinite; }
        @keyframes dpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* Student card */
        .d-student-card { background: #fff; border-radius: 20px; margin-bottom: 20px; border: 1px solid #e2eaf3; box-shadow: 0 4px 20px rgba(99,140,199,0.1); overflow: hidden; }
        .d-student-banner { height: 72px; background: linear-gradient(135deg,#3b82f6 0%,#6366f1 50%,#8b5cf6 100%); position: relative; }
        .d-student-banner::after { content:''; position:absolute; inset:0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/svg%3E"); }
        .d-student-body { padding: 0 24px 22px; }
        .d-student-top  { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px; margin-top: -32px; position: relative; z-index: 1; flex-wrap: wrap; }
        .d-student-photo { width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg,#3b82f6,#6366f1); border: 4px solid #fff; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #fff; box-shadow: 0 4px 16px rgba(59,130,246,0.3); }
        .d-student-name  { font-size: 18px; font-weight: 800; color: #1e293b; line-height: 1.1; }
        .d-student-id    { font-size: 12px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 3px; }
        .d-student-status-active    { display:inline-flex;align-items:center;gap:5px;margin-top:5px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:3px 10px;font-size:11px;color:#16a34a;font-weight:700; }
        .d-student-status-completed { display:inline-flex;align-items:center;gap:5px;margin-top:5px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:20px;padding:3px 10px;font-size:11px;color:#2563eb;font-weight:700; }
        .d-student-status-other     { display:inline-flex;align-items:center;gap:5px;margin-top:5px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:3px 10px;font-size:11px;color:#64748b;font-weight:700; }

        .d-student-grid { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid #eef2f8; border-radius: 14px; overflow: hidden; }
        .d-info-cell { padding: 13px 16px; border-right: 1px solid #eef2f8; border-bottom: 1px solid #eef2f8; transition: background 0.15s; }
        .d-info-cell:hover { background: #f8faff; }
        .d-info-cell:nth-child(3n)       { border-right: none; }
        .d-info-cell:nth-last-child(-n+3) { border-bottom: none; }
        .d-info-cell-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .d-info-cell-value { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .d-info-cell-mono  { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

        /* Stats */
        .d-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
        .d-stat { background: #fff; border-radius: 16px; padding: 18px 20px; border: 1px solid #e2eaf3; box-shadow: 0 2px 10px rgba(99,140,199,0.07); position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
        .d-stat:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,140,199,0.13); }
        .d-stat-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; }
        .d-stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; margin-bottom: 10px; }
        .d-stat-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .d-stat-value { font-size: 20px; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1; margin-bottom: 4px; }
        .d-stat-sub   { font-size: 11px; color: #94a3b8; }
        .d-stat-skel  { height: 24px; width: 70%; background: #f1f5f9; border-radius: 6px; margin: 4px 0 8px; animation: dskel 1.5s infinite; }
        @keyframes dskel { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* Bottom */
        .d-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .d-card { background: #fff; border-radius: 16px; padding: 20px 22px; border: 1px solid #e2eaf3; box-shadow: 0 2px 10px rgba(99,140,199,0.07); }
        .d-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .d-card-title  { font-size: 14px; font-weight: 700; color: #1e293b; }
        .d-card-badge  { font-size: 12px; font-weight: 600; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 3px 12px; border-radius: 20px; }
        .d-card-sub    { font-size: 11px; color: #94a3b8; }
        .d-prog-track  { height: 10px; background: #f1f5f9; border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
        .d-prog-fill   { height: 100%; border-radius: 8px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); background: linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6); position: relative; overflow: hidden; }
        .d-prog-fill::after { content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);animation:shimmer 2.5s infinite; }
        @keyframes shimmer { 0%{left:-100%} 100%{left:100%} }
        .d-prog-labels { display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
        .d-log-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .d-log-row:last-child { border-bottom: none; }
        .d-log-date   { font-size: 13px; color: #1e293b; font-weight: 600; }
        .d-log-time   { font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
        .d-log-in     { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 6px; letter-spacing: 1px; }
        .d-log-out    { background: #fefce8; color: #ca8a04; border: 1px solid #fde68a; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 6px; letter-spacing: 1px; }
        .d-log-device { font-size: 10px; color: #94a3b8; text-align: right; margin-top: 3px; }
        .d-empty      { font-size: 13px; color: #94a3b8; text-align: center; padding: 28px 0; }
        .d-skel       { height: 40px; background: #f1f5f9; border-radius: 8px; margin-bottom: 8px; animation: dskel 1.5s infinite; }
        .d-err        { font-size: 13px; color: #ef4444; background: #fff5f5; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; }

        .fade-in { animation: fadeUp 0.45s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .d-stats { grid-template-columns: repeat(2,1fr); }
          .d-student-grid { grid-template-columns: repeat(2,1fr); }
          .d-info-cell:nth-child(3n)        { border-right: 1px solid #eef2f8; }
          .d-info-cell:nth-child(2n)        { border-right: none; }
          .d-info-cell:nth-last-child(-n+3) { border-bottom: 1px solid #eef2f8; }
          .d-info-cell:nth-last-child(-n+2) { border-bottom: none; }
        }
        @media (max-width: 900px) {
          .d-bottom { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .d-sidebar { position: fixed; top: 0; left: 0; height: 100vh; transform: translateX(-100%); }
          .d-sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
          .d-mobile-bar { display: flex; }
          .d-topbar { flex-direction: column; align-items: flex-start; gap: 10px; }
          .d-topbar-right { text-align: left; }
          .d-main { padding: 16px 16px 60px; }
          .d-stats { grid-template-columns: repeat(2,1fr); gap: 10px; }
          .d-stat-value { font-size: 17px; }
          .d-student-grid { grid-template-columns: repeat(2,1fr); }
          .d-info-cell:nth-child(3n)        { border-right: 1px solid #eef2f8; }
          .d-info-cell:nth-child(2n)        { border-right: none; }
          .d-info-cell:nth-last-child(-n+3) { border-bottom: 1px solid #eef2f8; }
          .d-info-cell:nth-last-child(-n+2) { border-bottom: none; }
          .d-student-name { font-size: 16px; }
        }
        @media (max-width: 480px) {
          .d-stats { grid-template-columns: 1fr 1fr; gap: 8px; }
          .d-stat { padding: 14px; }
          .d-stat-value { font-size: 15px; }
          .d-stat-label { font-size: 9px; }
          .d-student-grid { grid-template-columns: 1fr 1fr; }
          .d-main { padding: 12px 12px 60px; }
          .d-clock { font-size: 16px; }
          .d-title { font-size: 18px; }
        }
      `}</style>

      {/* Mobile overlay */}
      <div className={`d-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className="d-shell">
        {/* Sidebar */}
        <aside className={`d-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div>
            <div className="d-logo-wrap">
              <div className="d-logo-icon">OJT</div>
              <div>
                <div className="d-logo-name">DTR Portal</div>
                <div className="d-logo-sub">Student View</div>
              </div>
            </div>
            <nav className="d-nav">
              <div className="d-nav-item active" onClick={() => setSidebarOpen(false)}>
                <svg className="d-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                Dashboard
              </div>
              <div className="d-nav-item" onClick={() => { onNavigate('dtr'); setSidebarOpen(false); }}>
                <svg className="d-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                DTR Form
              </div>
            </nav>
          </div>
          <div className="d-profile-wrap">
            <div className="d-profile">
              <div className="d-avatar">
                {student?.photo_url
                  ? <img src={student.photo_url} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} onError={e=>{e.target.style.display='none';}}/>
                  : initials(displayName)
                }
              </div>
              <div>
                <div className="d-profile-name">{displayName}</div>
                <div className="d-profile-id">#{student?.student_id}</div>
              </div>
            </div>
            <button onClick={logout} className="d-btn-logout">Sign out</button>
          </div>
        </aside>

        <main className="d-main">
          {/* Mobile top bar */}
          <div className="d-mobile-bar">
            <button className="d-hamburger" onClick={() => setSidebarOpen(true)}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="d-mobile-logo">DTR <span>Portal</span></div>
            <div className="d-mobile-avatar">
              {student?.photo_url
                ? <img src={student.photo_url} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} onError={e=>{e.target.style.display='none';}}/>
                : initials(displayName)
              }
            </div>
          </div>

          {/* Desktop topbar */}
          <div className="d-topbar fade-in">
            <div>
              <div className="d-welcome">Good to see you</div>
              <div className="d-title">Welcome back, <span>{firstName}</span></div>
            </div>
            <div className="d-topbar-right">
              <div className="d-clock">{timeStr}</div>
              <div className="d-date">{dateStr}</div>
              <div><span className="d-status-pill"><span className="d-status-dot"/>{student?.status || 'Active'}</span></div>
            </div>
          </div>

          {/* Student Info */}
          <div className="d-student-card fade-in" style={{animationDelay:'0.08s'}}>
            <div className="d-student-banner"/>
            <div className="d-student-body">
              <div className="d-student-top">
                <div className="d-student-photo">
                  {student?.photo_url
                    ? <img src={student.photo_url} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>
                    : initials(displayName)
                  }
                </div>
                <div>
                  <div className="d-student-name">{displayName}</div>
                  <div className="d-student-id">#{student?.student_id}</div>
                  <span className={student?.status==='Active'?'d-student-status-active':student?.status==='Completed'?'d-student-status-completed':'d-student-status-other'}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}}/>
                    {student?.status || 'Active'}
                  </span>
                </div>
              </div>
              <div className="d-student-grid">
                {[
                  { label:'School',      value: student?.school      || '—' },
                  { label:'Coordinator', value: student?.coordinator || '—' },
                  { label:'Status',      value: student?.status      || 'Active' },
                  { label:'Contact No.', value: student?.contact     || '—', mono: true },
                  { label:'Email',       value: student?.email       || '—' },
                  { label:'Student ID',  value: `#${student?.student_id}`, mono: true },
                ].map(r => (
                  <div className="d-info-cell" key={r.label}>
                    <div className="d-info-cell-label">{r.label}</div>
                    <div className={`d-info-cell-value${r.mono?' d-info-cell-mono':''}`} title={r.value}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="d-stats">
            {[
              { label:'Required Hours',  value: statsLoading ? null : `${student?.total_hours??0}:00`,                                                                sub:'Total OJT hours',    color:'#3b82f6', bar:'linear-gradient(90deg,#3b82f6,#6366f1)', icon:'🎯', iconBg:'#eff6ff' },
              { label:'Rendered Hours',  value: statsLoading ? null : fmtHMS(student?.rendered_h??0, student?.rendered_m??0, student?.rendered_s??0),                 sub:'Completed so far',   color:'#16a34a', bar:'linear-gradient(90deg,#22c55e,#16a34a)', icon:'✅', iconBg:'#f0fdf4' },
              { label:'Remaining Hours', value: statsLoading ? null : fmtHM(student?.remaining_h??0, student?.remaining_m??0),                                        sub:'Still needed',       color:'#f59e0b', bar:'linear-gradient(90deg,#f59e0b,#f97316)', icon:'⏳', iconBg:'#fffbeb' },
              { label:'Progress',        value: statsLoading ? null : `${pct}%`,                                                                                      sub:'Overall completion', color:'#8b5cf6', bar:'linear-gradient(90deg,#8b5cf6,#a855f7)', icon:'📈', iconBg:'#faf5ff' },
            ].map((c,i) => (
              <div className="d-stat fade-in" key={c.label} style={{animationDelay:`${0.16+i*0.07}s`}}>
                <div className="d-stat-bar" style={{background:c.bar}}/>
                <div className="d-stat-icon" style={{background:c.iconBg}}>{c.icon}</div>
                <div className="d-stat-label">{c.label}</div>
                {c.value===null ? <div className="d-stat-skel"/> : <div className="d-stat-value" style={{color:c.color}}>{c.value}</div>}
                <div className="d-stat-sub">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Progress + Logs */}
          <div className="d-bottom fade-in" style={{animationDelay:'0.44s'}}>
            <div className="d-card">
              <div className="d-card-header">
                <div className="d-card-title">OJT Progress</div>
                <div className="d-card-badge">{statsLoading?'—':`${pct}% Complete`}</div>
              </div>
              <div className="d-prog-track">
                <div className="d-prog-fill" style={{width:statsLoading?'0%':`${Math.min(pct,100)}%`}}/>
              </div>
              <div className="d-prog-labels">
                <span>{statsLoading?'—':`${fmtHMS(student?.rendered_h??0,student?.rendered_m??0,student?.rendered_s??0)} rendered`}</span>
                <span>{student?.total_hours??0}:00:00 required</span>
              </div>
              {!statsLoading && (
                <div style={{marginTop:18,display:'flex',flexDirection:'column',gap:10}}>
                  {[
                    { label:'Rendered',  val:fmtHMS(student?.rendered_h??0,student?.rendered_m??0,student?.rendered_s??0), pct:pct,       color:'#3b82f6' },
                    { label:'Remaining', val:fmtHM(student?.remaining_h??0,student?.remaining_m??0),                       pct:100-pct,   color:'#e2e8f0' },
                  ].map(r => (
                    <div key={r.label}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                        <span style={{fontSize:12,color:'#64748b',fontWeight:500}}>{r.label}</span>
                        <span style={{fontSize:12,fontFamily:'JetBrains Mono,monospace',color:'#1e293b',fontWeight:600}}>{r.val}</span>
                      </div>
                      <div style={{height:5,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${Math.min(r.pct,100)}%`,background:r.color,borderRadius:4,transition:'width 1s ease'}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="d-card">
              <div className="d-card-header">
                <div className="d-card-title">Recent Scan Logs</div>
                <div className="d-card-sub">{logsLoading?'Loading…':`${logs.length} entries`}</div>
              </div>
              {logsError && <div className="d-err">{logsError}</div>}
              {!logsError&&!logsLoading&&logs.length===0&&<div className="d-empty">No scan logs found.</div>}
              {logsLoading&&[...Array(4)].map((_,i)=><div key={i} className="d-skel"/>)}
              {!logsLoading&&logs.map((log,i)=>(
                <div key={log.ID??i} className="d-log-row">
                  <div>
                    <div className="d-log-date">{log.ScanDate}</div>
                    <div className="d-log-time">{log.ScanTime||'—'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <span className={log.ScanType==='IN'?'d-log-in':'d-log-out'}>{log.ScanType}</span>
                    {log.DeviceName&&<div className="d-log-device">{log.DeviceName}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}