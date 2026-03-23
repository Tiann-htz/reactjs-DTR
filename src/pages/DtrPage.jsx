import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchDtrRecords, postDtrEntry, updateDtrEntry, deleteDtrEntry } from '../api';

const LIMIT    = 20;
const STATUSES = ['Regular', 'Holiday', 'Absent', 'Excuse'];
const today    = () => new Date().toISOString().slice(0, 10);
const HOURS    = ['12','1','2','3','4','5','6','7','8','9','10','11'];
const MINUTES  = ['00','15','30','45'];

const to12 = (val = '00:00') => {
  const [h, m] = val.split(':').map(Number);
  const ampm   = h < 12 ? 'AM' : 'PM';
  const hour   = h % 12 === 0 ? '12' : String(h % 12);
  const minute = String(m).padStart(2, '0');
  return { hour, minute, ampm };
};

const to24 = ({ hour, minute, ampm }) => {
  let h = parseInt(hour, 10);
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
};

const fmt12 = (val = '00:00') => {
  if (!val || val === '—') return '—';
  const [h, m] = val.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return val;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2,'0')} ${ampm}`;
};

const emptyForm = {
  dtr_id: null, date: today(),
  time_in: '08:00', time_out: '17:00',
  status: 'Regular', note: '', todo: '08:00', dsr: '17:00',
};

export default function DtrPage({ onNavigate }) {
  const { student, logout } = useAuth();
  const [records, setRecords]             = useState([]);
  const [total, setTotal]                 = useState(0);
  const [offset, setOffset]               = useState(0);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [form, setForm]                   = useState(emptyForm);
  const [submitting, setSubmitting]       = useState(false);
  const [formError, setFormError]         = useState('');
  const [formSuccess, setFormSuccess]     = useState('');
  const [deleting, setDeleting]           = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [tableMilitary, setTableMilitary] = useState(false);

  const displayName = student?.name || student?.fullname || 'Student';
  const initials    = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isEditing   = !!form.dtr_id;

  const loadRecords = async (off = 0) => {
    if (!student?.student_id) return;
    try {
      setLoading(true); setError('');
      const data = await fetchDtrRecords(student.student_id, LIMIT, off);
      setRecords(data.records); setTotal(data.total); setOffset(off);
    } catch (err) { setError(err.message || 'Failed to load records.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!student?.student_id) return;
    let cancelled = false;
    const init = async () => {
      try {
        setLoading(true);
        const data = await fetchDtrRecords(student.student_id, LIMIT, 0);
        if (cancelled) return;
        setRecords(data.records); setTotal(data.total);
      } catch (err) { if (!cancelled) setError(err.message || 'Failed to load records.'); }
      finally { if (!cancelled) setLoading(false); }
    };
    init();
    return () => { cancelled = true; };
  }, [student?.student_id]); 
  

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError(''); setFormSuccess('');
  };

  const handleTimePart = (field, part, value) => {
    handleChange(field, to24({ ...to12(form[field]), [part]: value }));
  };

  const handlePost = async () => {
    setFormError(''); setFormSuccess('');
    if (!form.date) { setFormError('Date is required.'); return; }
    try {
      setSubmitting(true);
      await postDtrEntry({ student_id: student.student_id, date: form.date, time_in: form.time_in, time_out: form.time_out, status: form.status, note: form.note, todo: form.todo, dsr: form.dsr });
      setFormSuccess('Entry posted successfully.');
      setForm({ ...emptyForm, date: form.date });
      await loadRecords(0);
    } catch (err) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    setFormError(''); setFormSuccess('');
    if (!form.dtr_id) { setFormError('No record selected.'); return; }
    try {
      setSubmitting(true);
      await updateDtrEntry({ dtr_id: form.dtr_id, student_id: student.student_id, date: form.date, time_in: form.time_in, time_out: form.time_out, status: form.status, note: form.note, todo: form.todo, dsr: form.dsr });
      setFormSuccess('Entry updated successfully.');
      setForm(emptyForm);
      await loadRecords(offset);
    } catch (err) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (dtr_id) => {
    if (!window.confirm('Delete this DTR entry?')) return;
    try {
      setDeleting(dtr_id);
      await deleteDtrEntry(dtr_id, student.student_id);
      if (form.dtr_id === dtr_id) setForm(emptyForm);
      await loadRecords(offset);
    } catch (err) { setError(err.message); }
    finally { setDeleting(null); }
  };

  const handleSelectRow = (rec) => {
    setForm({ dtr_id: rec.dtr_id, date: rec.DateReport, time_in: rec.TimeIn||'08:00', time_out: rec.TimeOut||'17:00', status: rec.Status||'Regular', note: rec.Note||'', todo: rec.Todo_text||'08:00', dsr: rec.Dsr_text||'17:00' });
    setFormError(''); setFormSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = () => { setForm(emptyForm); setFormError(''); setFormSuccess(''); };

  const totalPages  = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  const fmtTableTime = (val) => {
    if (!val || val === '—') return '—';
    return tableMilitary ? val : fmt12(val);
  };

  const statusStyle = (st) => ({
    Regular: { color:'#16a34a', background:'#f0fdf4', border:'1px solid #bbf7d0' },
    Holiday: { color:'#2563eb', background:'#eff6ff', border:'1px solid #bfdbfe' },
    Absent:  { color:'#dc2626', background:'#fff5f5', border:'1px solid #fecaca' },
    Excuse:  { color:'#d97706', background:'#fffbeb', border:'1px solid #fde68a' },
  }[st] || { color:'#64748b', background:'#f8fafc', border:'1px solid #e2e8f0' });

  // AM/PM picker only (no toggle in form)
  const TimePicker = ({ field, label }) => {
    const { hour, minute, ampm } = to12(form[field]);
    return (
      <div className="f-group">
        <label className="f-label">{label}</label>
        <div className="f-time">
          <select className="f-tsel" value={hour} onChange={e => handleTimePart(field,'hour',e.target.value)}>
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="f-colon">:</span>
          <select className="f-tsel" value={minute} onChange={e => handleTimePart(field,'minute',e.target.value)}>
            {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="f-tsel f-ampm" value={ampm} onChange={e => handleTimePart(field,'ampm',e.target.value)}>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
          <span className="f-24h">{form[field]}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f0f4f8; }
        .f-shell { display: flex; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; background: #f0f4f8; color: #1e293b; }

        .f-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 40; }
        .f-overlay.open { display: block; }

        .f-sidebar { width: 256px; flex-shrink: 0; background: #fff; border-right: 1px solid #e2eaf3; display: flex; flex-direction: column; justify-content: space-between; padding: 24px 0; position: sticky; top: 0; height: 100vh; box-shadow: 2px 0 12px rgba(99,140,199,0.07); z-index: 50; transition: transform 0.3s ease; }
        .f-logo-wrap { display: flex; align-items: center; gap: 11px; padding: 0 22px 24px; border-bottom: 1px solid #eef2f8; }
        .f-logo-icon { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg,#3b82f6,#6366f1); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(59,130,246,0.35); }
        .f-logo-name { font-size: 15px; font-weight: 700; color: #1e293b; }
        .f-logo-sub  { font-size: 11px; color: #94a3b8; margin-top: 1px; }
        .f-nav { padding: 18px 14px; display: flex; flex-direction: column; gap: 3px; }
        .f-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.18s; }
        .f-nav-item:hover { background: #f1f5fd; color: #3b82f6; }
        .f-nav-item.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
        .f-nav-icon { width: 18px; height: 18px; flex-shrink: 0; }
        .f-profile-wrap { padding: 0 14px 14px; }
        .f-profile { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #f8faff; border-radius: 12px; border: 1px solid #e2eaf3; margin-bottom: 10px; }
        .f-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg,#3b82f6,#6366f1); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; overflow: hidden; border: 2px solid #bfdbfe; }
        .f-profile-name { font-size: 13px; font-weight: 600; color: #1e293b; }
        .f-profile-id { font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 1px; }
        .f-btn-logout { width: 100%; padding: 10px; background: transparent; border: 1px solid #e2eaf3; border-radius: 10px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: #64748b; cursor: pointer; transition: all 0.18s; font-weight: 500; }
        .f-btn-logout:hover { border-color: #fca5a5; color: #ef4444; background: #fff5f5; }

        .f-main { flex: 1; padding: 24px 28px 60px; overflow: auto; min-width: 0; }

        .f-mobile-bar { display: none; align-items: center; justify-content: space-between; background: #fff; padding: 14px 18px; margin-bottom: 16px; border-radius: 14px; border: 1px solid #e2eaf3; box-shadow: 0 2px 8px rgba(99,140,199,0.08); }
        .f-hamburger { background: none; border: none; cursor: pointer; padding: 4px; color: #64748b; }
        .f-mobile-logo { font-size: 15px; font-weight: 800; color: #1e293b; }
        .f-mobile-logo span { color: #3b82f6; }
        .f-mobile-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#3b82f6,#6366f1); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; overflow: hidden; border: 2px solid #bfdbfe; }

        .f-topbar { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 16px; padding: 16px 24px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(99,140,199,0.08); border: 1px solid #e2eaf3; flex-wrap: wrap; gap: 12px; }
        .f-welcome { font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 3px; }
        .f-title { font-size: 22px; font-weight: 800; color: #1e293b; }
        .f-title span { color: #3b82f6; }
        .f-topbar-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .f-page-sub { font-size: 12px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
        .f-status-pill { display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 20px; padding: 5px 14px; font-size: 12px; color: #16a34a; font-weight: 600; }
        .f-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: fpulse 2s infinite; }
        @keyframes fpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .f-card { background: #fff; border-radius: 16px; padding: 22px 24px; margin-bottom: 20px; border: 1px solid #e2eaf3; box-shadow: 0 2px 12px rgba(99,140,199,0.08); }
        .f-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .f-card-title { font-size: 15px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .f-badge-new  { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .f-badge-edit { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
        .f-btn-clear { font-size: 12px; padding: 6px 14px; border: 1px solid #e2eaf3; border-radius: 8px; background: #f8fafc; color: #64748b; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; transition: all 0.18s; white-space: nowrap; }
        .f-btn-clear:hover { border-color: #cbd5e1; color: #1e293b; }

        .f-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .f-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .f-group { display: flex; flex-direction: column; gap: 6px; }
        .f-label { font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; }
        .f-input { padding: 10px 13px; background: #f8faff; border: 1.5px solid #e2eaf3; border-radius: 10px; font-size: 13px; color: #1e293b; outline: none; width: 100%; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; font-weight: 500; }
        .f-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .f-input-ro { padding: 10px 13px; background: #f1f5f9; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #94a3b8; width: 100%; font-family: 'JetBrains Mono', monospace; }
        .f-textarea { padding: 10px 13px; background: #f8faff; border: 1.5px solid #e2eaf3; border-radius: 10px; font-size: 13px; color: #1e293b; outline: none; width: 100%; resize: vertical; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; }
        .f-textarea:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        select.f-input { cursor: pointer; }

        .f-time { display: flex; align-items: center; gap: 3px; background: #f8faff; border: 1.5px solid #e2eaf3; border-radius: 10px; padding: 7px 10px; transition: all 0.18s; }
        .f-time:focus-within { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .f-tsel { border: none; outline: none; font-size: 13px; color: #1e293b; background: transparent; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-weight: 600; padding: 2px 3px; min-width: 0; }
        .f-ampm { color: #2563eb; font-weight: 700; font-size: 12px; }
        .f-colon { font-size: 15px; font-weight: 700; color: #cbd5e1; }
        .f-24h { margin-left: 6px; font-size: 10px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; border-left: 1.5px solid #e2eaf3; padding-left: 6px; white-space: nowrap; }

        .f-std-note { font-size: 11px; color: #94a3b8; margin-bottom: 16px; margin-top: 2px; line-height: 1.6; }
        .f-err { font-size: 13px; color: #dc2626; background: #fff5f5; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-weight: 500; }
        .f-ok  { font-size: 13px; color: #16a34a; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-weight: 500; }

        .f-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .f-btn { padding: 11px 22px; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.3px; transition: all 0.18s; white-space: nowrap; }
        .f-btn:hover:not(.f-btn-dis) { transform: translateY(-1px); }
        .f-btn-post   { background: linear-gradient(135deg,#16a34a,#22c55e); color: #fff; box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
        .f-btn-update { background: linear-gradient(135deg,#2563eb,#3b82f6); color: #fff; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
        .f-btn-delete { background: linear-gradient(135deg,#dc2626,#ef4444); color: #fff; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        .f-btn-dis    { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

        .f-rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
        .f-total-badge { font-size: 12px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
        .f-range { font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }

        /* Table time toggle */
        .f-tbl-time-toggle { display: flex; align-items: center; gap: 6px; }
        .f-tbl-time-btn { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; border: 1.5px solid #e2eaf3; cursor: pointer; transition: all 0.18s; font-family: 'JetBrains Mono', monospace; background: #f8faff; color: #94a3b8; white-space: nowrap; }
        .f-tbl-time-btn:hover { border-color: #cbd5e1; color: #64748b; }
        .f-tbl-time-btn.active-24 { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
        .f-tbl-time-btn.active-12 { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }

        .f-tbl-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #e2eaf3; -webkit-overflow-scrolling: touch; }
        .f-tbl { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px; }
        .f-th { padding: 11px 14px; text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px; background: #f8faff; border-bottom: 1.5px solid #e2eaf3; white-space: nowrap; }
        .f-tr { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; cursor: pointer; }
        .f-tr:hover { background: #f0f7ff; }
        .f-tr:last-child { border-bottom: none; }
        .f-td { padding: 12px 14px; color: #475569; vertical-align: middle; }
        .f-td-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #334155; font-weight: 500; }
        .f-td-trunc { padding: 12px 14px; color: #64748b; vertical-align: middle; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
        .f-td-dim { color: #cbd5e1; }
        .f-st-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
        .f-del-btn { padding: 5px 10px; border: 1px solid #fecaca; border-radius: 6px; background: #fff5f5; color: #dc2626; font-size: 12px; cursor: pointer; transition: all 0.18s; font-weight: 600; }
        .f-del-btn:hover { background: #fee2e2; }
        .f-skel-td div { height: 13px; background: #f1f5f9; border-radius: 4px; animation: fskel 1.5s infinite; }
        @keyframes fskel { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .f-empty-td { padding: 40px 0; text-align: center; color: #94a3b8; font-size: 13px; }
        .f-pagination { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }
        .f-page-btn { padding: 8px 18px; border: 1.5px solid #e2eaf3; border-radius: 8px; background: #fff; font-size: 13px; color: #64748b; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; transition: all 0.18s; }
        .f-page-btn:hover { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }
        .f-page-btn-dis { opacity: 0.35; cursor: not-allowed; }
        .f-page-info { font-size: 12px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }

        .fade-in { animation: fadeUp 0.45s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width: 768px) {
          .f-sidebar { position: fixed; top: 0; left: 0; height: 100vh; transform: translateX(-100%); }
          .f-sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
          .f-mobile-bar { display: flex; }
          .f-main { padding: 16px 16px 60px; }
          .f-topbar { flex-direction: column; align-items: flex-start; }
          .f-topbar-right { text-align: left; align-items: flex-start; }
          .f-row3 { grid-template-columns: 1fr 1fr; }
          .f-row2 { grid-template-columns: 1fr; }
          .f-btn-row { gap: 8px; }
          .f-btn { padding: 10px 16px; font-size: 12px; flex: 1; text-align: center; }
        }
        @media (max-width: 540px) {
          .f-row3 { grid-template-columns: 1fr; }
          .f-row2 { grid-template-columns: 1fr; }
          .f-title { font-size: 18px; }
          .f-card { padding: 16px; }
          .f-time { padding: 6px 8px; }
          .f-tsel { font-size: 12px; }
          .f-24h { display: none; }
        }
      `}</style>

      <div className={`f-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className="f-shell">
        <aside className={`f-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div>
            <div className="f-logo-wrap">
              <div className="f-logo-icon">OJT</div>
              <div>
                <div className="f-logo-name">DTR Portal</div>
                <div className="f-logo-sub">Student View — {displayName.split(' ')[0]}</div>
              </div>
            </div>
            <nav className="f-nav">
              <div className="f-nav-item" onClick={() => { onNavigate('dashboard'); setSidebarOpen(false); }}>
                <svg className="f-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                Dashboard
              </div>
              <div className="f-nav-item active" onClick={() => setSidebarOpen(false)}>
                <svg className="f-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                DTR Form
              </div>
            </nav>
          </div>
          <div className="f-profile-wrap">
            <div className="f-profile">
              <div className="f-avatar">
                {student?.photo_url
                  ? <img src={student.photo_url} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} onError={e=>{e.target.style.display='none';}}/>
                  : initials(displayName)
                }
              </div>
              <div>
                <div className="f-profile-name">{displayName}</div>
                <div className="f-profile-id">#{student?.student_id}</div>
              </div>
            </div>
            <button onClick={logout} className="f-btn-logout">Sign out</button>
          </div>
        </aside>

        <main className="f-main">
          <div className="f-mobile-bar">
            <button className="f-hamburger" onClick={() => setSidebarOpen(true)}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="f-mobile-logo">DTR <span>Form</span></div>
            <div className="f-mobile-avatar">
              {student?.photo_url
                ? <img src={student.photo_url} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} onError={e=>{e.target.style.display='none';}}/>
                : initials(displayName)
              }
            </div>
          </div>

          <div className="f-topbar fade-in">
            <div>
              <div className="f-welcome">Daily Time Record</div>
              <div className="f-title">DTR <span>Form</span></div>
            </div>
            <div className="f-topbar-right">
              <div className="f-page-sub">{isEditing ? `Editing record · ${form.date}` : 'New entry · fill in and click Post'}</div>
              <span className="f-status-pill"><span className="f-status-dot"/>{student?.status || 'Active'}</span>
            </div>
          </div>

          {/* ── Form Card ── */}
          <div className="f-card fade-in" style={{animationDelay:'0.08s'}}>
            <div className="f-card-header">
              <div className="f-card-title">
                {isEditing ? '✏️' : '➕'}&nbsp;{isEditing ? 'Edit Entry' : 'New Entry'}
                <span className={isEditing ? 'f-badge-edit' : 'f-badge-new'}>{isEditing ? 'EDITING' : 'NEW'}</span>
              </div>
              {isEditing && <button onClick={handleClear} className="f-btn-clear">✕ Clear / New</button>}
            </div>

            {/* Row 1 */}
            <div className="f-row3">
              <div className="f-group">
                <label className="f-label">Student ID</label>
                <div className="f-input-ro">{student?.student_id || '—'}</div>
              </div>
              <div className="f-group">
                <label className="f-label">Full Name</label>
                <div className="f-input-ro">{displayName}</div>
              </div>
              <div className="f-group">
                <label className="f-label">Date</label>
                <input type="date" className="f-input" value={form.date} onChange={e => handleChange('date', e.target.value)} />
              </div>
            </div>

            {/* Row 2 — no toggle, always AM/PM picker */}
            <div className="f-row3">
              <TimePicker field="time_in"  label="Time In" />
              <TimePicker field="time_out" label="Time Out" />
              <div className="f-group">
                <label className="f-label">Status</label>
                <select className="f-input" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="f-group" style={{marginBottom:14}}>
              <label className="f-label">Notes</label>
              <textarea className="f-textarea" rows={2} value={form.note} placeholder="Optional notes…" onChange={e => handleChange('note', e.target.value)} />
            </div>

            {/* Row 4 — no toggle, always AM/PM picker */}
            <div className="f-row2">
              <TimePicker field="todo" label="To-Do Time" />
              <TimePicker field="dsr"  label="DSR Time" />
            </div>

            {formError   && <div className="f-err">⚠ {formError}</div>}
            {formSuccess && <div className="f-ok">✓ {formSuccess}</div>}

            <div className="f-std-note">
              Standard: Time-in 8:00 AM · Time-Out 5:00 PM · To-Do 8:00 AM · DSR 5:00 PM · Lunch 12:00–1:00 PM deducted automatically
            </div>

            <div className="f-btn-row">
              <button className={`f-btn f-btn-post ${submitting||isEditing?'f-btn-dis':''}`} onClick={handlePost} disabled={submitting||isEditing}>
                {submitting&&!isEditing?'Posting…':'✔ Post [F2]'}
              </button>
              <button className={`f-btn f-btn-update ${submitting||!isEditing?'f-btn-dis':''}`} onClick={handleUpdate} disabled={submitting||!isEditing}>
                {submitting&&isEditing?'Updating…':'✔ Update [F3]'}
              </button>
              <button className={`f-btn f-btn-delete ${!isEditing?'f-btn-dis':''}`} onClick={() => form.dtr_id&&handleDelete(form.dtr_id)} disabled={!isEditing||!!deleting}>
                ✕ Del [F4]
              </button>
            </div>
          </div>

          {/* ── Records Card ── */}
          <div className="f-card fade-in" style={{animationDelay:'0.16s'}}>
            <div className="f-rec-header">
              <div className="f-card-title">Records</div>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                {/* ── Table time format toggle ── */}
                <div className="f-tbl-time-toggle">
                  <button
                    type="button"
                    className={`f-tbl-time-btn ${!tableMilitary ? 'active-12' : ''}`}
                    onClick={() => setTableMilitary(false)}
                  >
                    AM/PM
                  </button>
                  <button
                    type="button"
                    className={`f-tbl-time-btn ${tableMilitary ? 'active-24' : ''}`}
                    onClick={() => setTableMilitary(true)}
                  >
                    24H
                  </button>
                </div>
                {!loading&&total>0&&<span className="f-range">{offset+1}–{Math.min(offset+LIMIT,total)} of {total}</span>}
                <span className="f-total-badge">Total: {total}</span>
              </div>
            </div>

            {error && <div className="f-err">⚠ {error}</div>}

            <div className="f-tbl-wrap">
              <table className="f-tbl">
                <thead>
                  <tr>
                    {['Report Date','Time In','Time Out','Status','Notes','To-Do','DSR',''].map(h => (
                      <th key={h} className="f-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && [...Array(5)].map((_,i) => (
                    <tr key={`sk-${i}`}>
                      {[...Array(8)].map((__,j) => (
                        <td key={j} className="f-td f-skel-td"><div style={{width:j===0?90:50}}/></td>
                      ))}
                    </tr>
                  ))}
                  {!loading&&records.length===0&&(
                    <tr><td colSpan={8} className="f-empty-td">No records yet. Post your first entry above.</td></tr>
                  )}
                  {!loading&&records.map((rec,i) => {
                    const ss       = statusStyle(rec.Status);
                    const selected = form.dtr_id === rec.dtr_id;
                    return (
                      <tr key={rec.dtr_id??i} className="f-tr"
                        style={{background:selected?'#eff6ff':undefined,outline:selected?'2px solid #bfdbfe':'none'}}
                        onClick={() => handleSelectRow(rec)}
                      >
                        <td className="f-td" style={{fontWeight:700,color:'#1e293b'}}>{rec.DateReport}</td>
                        <td className="f-td f-td-mono">{fmtTableTime(rec.TimeIn)}</td>
                        <td className="f-td f-td-mono">{fmtTableTime(rec.TimeOut)}</td>
                        <td className="f-td"><span className="f-st-badge" style={ss}>{rec.Status}</span></td>
                        <td className="f-td-trunc">{rec.Note || <span className="f-td-dim">—</span>}</td>
                        <td className="f-td f-td-mono">{fmtTableTime(rec.Todo_text)}</td>
                        <td className="f-td f-td-mono">{fmtTableTime(rec.Dsr_text)}</td>
                        <td className="f-td">
                          <button className="f-del-btn" onClick={e=>{e.stopPropagation();handleDelete(rec.dtr_id);}} disabled={deleting===rec.dtr_id}>
                            {deleting===rec.dtr_id?'…':'✕'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!loading&&totalPages>1&&(
              <div className="f-pagination">
                <button className={`f-page-btn ${currentPage===1?'f-page-btn-dis':''}`} onClick={()=>loadRecords(offset-LIMIT)} disabled={currentPage===1}>← Prev</button>
                <span className="f-page-info">Page {currentPage} of {totalPages}</span>
                <button className={`f-page-btn ${currentPage===totalPages?'f-page-btn-dis':''}`} onClick={()=>loadRecords(offset+LIMIT)} disabled={currentPage===totalPages}>Next →</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}