import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:8080/api';

// Helper to get local date strings
const getLocalIso = (d) => {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const TODAY = getLocalIso(new Date());

const DEMO_TEACHERS = [
  { std: 'Standard 1', name: 'Rajesh Kumar', email: 'std1@rnsit.ac.in', days: 200 },
  { std: 'Standard 2', name: 'Anita Sharma', email: 'std2@rnsit.ac.in', days: 200 },
  { std: 'Standard 3', name: 'Vikram Gowda', email: 'std3@rnsit.ac.in', days: 200 },
  { std: 'Standard 4', name: 'Kavitha Hegde', email: 'std4@rnsit.ac.in', days: 200 },
  { std: 'Standard 5', name: 'Suresh Patil', email: 'std5@rnsit.ac.in', days: 200 },
  { std: 'Standard 6', name: 'Meena Kulkarni', email: 'std6@rnsit.ac.in', days: 220 },
  { std: 'Standard 7', name: 'Prakash Reddy', email: 'std7@rnsit.ac.in', days: 220 },
  { std: 'Standard 8', name: 'Divya Nair', email: 'std8@rnsit.ac.in', days: 220 },
  { std: 'Standard 9', name: 'Ramesh Bhat', email: 'std9@rnsit.ac.in', days: 220 },
  { std: 'Standard 10', name: 'Sunitha Rao', email: 'std10@rnsit.ac.in', days: 220 },
];

export default function App() {
  const [teacher, setTeacher] = useState(() => {
    const saved = localStorage.getItem('loggedTeacher');
    return saved ? JSON.parse(saved) : null;
  });

  // Login Form State
  const [email, setEmail] = useState('std1@rnsit.ac.in');
  const [password, setPassword] = useState('teacher123');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [attendanceDate, setAttendanceDate] = useState(TODAY);
  const [weekOffset, setWeekOffset] = useState(0); // Tracks weekly slider
  const [toast, setToast] = useState('');

  // Follow-up Modal State
  const [activeStudent, setActiveStudent] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [contactMode, setContactMode] = useState('PHONE_CALL');
  const [absenceReason, setAbsenceReason] = useState('Attendance Deficit');
  const [remarks, setRemarks] = useState('');
  const [savingFollowup, setSavingFollowup] = useState(false);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const params = new URLSearchParams({ email, password });
      const res = await fetch(`${API_BASE}/teachers/login?${params.toString()}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setTeacher(data);
        localStorage.setItem('loggedTeacher', JSON.stringify(data));
      } else {
        setLoginError('Invalid email or password. Try std1@rnsit.ac.in / teacher123');
      }
    } catch {
      setLoginError('Cannot connect to Spring Boot server on port 8080.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedTeacher');
    setTeacher(null);
    setStudents([]);
    setSearchQuery('');
    setRiskFilter('ALL');
  };

  const fetchClassStudents = async (assignedClass) => {
    if (!assignedClass) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/students?classSection=${encodeURIComponent(assignedClass)}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch {
      triggerToast('Failed to load students from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacher?.assignedClass) {
      fetchClassStudents(teacher.assignedClass);
      setPage(1);
    }
  }, [teacher]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, riskFilter]);

  // Generate 7 days for slider based on weekOffset
  const recentDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i) - (weekOffset * 7));
      return d;
    });
  }, [weekOffset]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        `${s.fullName} ${s.rollNumber}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = riskFilter === 'ALL' || s.riskStatus === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [students, searchQuery, riskFilter]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = filteredStudents.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    return {
      total: students.length,
      safe: students.filter((s) => s.riskStatus === 'SAFE').length,
      warning: students.filter((s) => s.riskStatus === 'WARNING').length,
      highRisk: students.filter((s) => s.riskStatus === 'HIGH_RISK').length,
    };
  }, [students]);

  const stdNumber = teacher?.assignedClass
    ? Number(teacher.assignedClass.replace(/\D/g, ''))
    : 1;
  const isPrimary = stdNumber <= 5;
  const workingDaysQuota = isPrimary ? 200 : 220;
  const schoolStageLabel = isPrimary
    ? 'Primary School (Grades 1–5): Minimum 200 Working Days / Year'
    : 'Upper Primary & High School (Grades 6–10): Minimum 220 Working Days / Year';

  const handleMarkAttendance = async (student, isPresent) => {
    try {
      const res = await fetch(
        `${API_BASE}/attendance/mark?studentId=${student.studentId}&date=${attendanceDate}&isPresent=${isPresent}`,
        { method: 'POST' }
      );
      if (res.ok) {
        const updated = await res.json();
        setStudents((prev) =>
          prev.map((item) => (item.studentId === student.studentId ? updated : item))
        );
        triggerToast(
          `${student.fullName} marked ${isPresent ? 'Present' : 'Absent'} for ${attendanceDate}`
        );
      }
    } catch {
      triggerToast('Error updating attendance.');
    }
  };

  const handleResetClassAttendance = async () => {
    if (
      !window.confirm(
        `Reset all attendance records to 0 days present and 0 days absent for ${teacher.assignedClass}?`
      )
    )
      return;
    try {
      const res = await fetch(
        `${API_BASE}/attendance/reset?classSection=${encodeURIComponent(teacher.assignedClass)}`,
        { method: 'POST' }
      );
      if (res.ok) {
        await fetchClassStudents(teacher.assignedClass);
        triggerToast(`All 40 students in ${teacher.assignedClass} reset to 0 days!`);
      }
    } catch {
      triggerToast('Error resetting attendance.');
    }
  };

  const openFollowUpModal = async (student) => {
    setActiveStudent(student);
    setRemarks('');
    try {
      const res = await fetch(`${API_BASE}/followup/student/${student.studentId}`);
      setFollowups(res.ok ? await res.json() : []);
    } catch {
      setFollowups([]);
    }
  };

  const handleSaveFollowUp = async () => {
    if (!activeStudent || !remarks.trim()) return;
    setSavingFollowup(true);
    try {
      const params = new URLSearchParams({
        studentId: activeStudent.studentId,
        teacherId: teacher.teacherId || 1,
        mode: contactMode,
        reason: absenceReason,
        remarks: remarks,
      });
      const res = await fetch(`${API_BASE}/followup/log?${params.toString()}`, {
        method: 'POST',
      });
      if (res.ok) {
        const histRes = await fetch(`${API_BASE}/followup/student/${activeStudent.studentId}`);
        if (histRes.ok) setFollowups(await histRes.json());
        setRemarks('');
        triggerToast('Parent follow-up saved under ' + teacher.fullName);
      }
    } catch {
      triggerToast('Failed to save follow-up.');
    } finally {
      setSavingFollowup(false);
    }
  };

  const handleDeleteFollowUp = async (followupId) => {
    if (!window.confirm('Are you sure you want to delete this follow-up record?')) return;
    try {
      await fetch(`${API_BASE}/followup/${followupId}`, { method: 'DELETE' });
      setFollowups((prev) => prev.filter((f) => f.followupId !== followupId));
      triggerToast('Follow-up deleted successfully');
    } catch {
      triggerToast('Failed to delete follow-up.');
    }
  };

  const handleUpdateRiskFactor = async (newFactor) => {
    if (!activeStudent) return;
    try {
      const res = await fetch(`${API_BASE}/students/risk?studentId=${activeStudent.studentId}&riskFactor=${encodeURIComponent(newFactor)}`, { method: 'POST' });
      if (res.ok) {
        const updatedStudent = await res.json();
        setActiveStudent(updatedStudent);
        setStudents((prev) => prev.map((s) => (s.studentId === updatedStudent.studentId ? updatedStudent : s)));
        triggerToast('Warning flag updated successfully!');
      }
    } catch {
      triggerToast('Failed to update warning flag.');
    }
  };

  // ==================== 1. TEACHER LOGIN SCREEN ====================
  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-6 text-slate-800">
        <div className="max-w-4xl w-full grid md:grid-cols-5 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="md:col-span-3 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -bottom-16 -left-16 opacity-[0.03] pointer-events-none">
              <img src="/RNS.png" alt="RNSIT Watermark" className="w-96 h-96 object-contain grayscale" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <img src="/RNS.png" alt="RNSIT Logo" className="h-14 object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    School Dropout System
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    RNSIT Community Project (25BCBPR308) • SDG 4
                  </p>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Class Teacher Sign In</h2>
              <p className="text-sm text-slate-500 mb-6">
                Log in to manage attendance and parent follow-ups for your assigned classroom.
              </p>
              {loginError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                  {loginError}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Teacher Official Email
                  </label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="std1@rnsit.ac.in" className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Password
                  </label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600" />
                </div>
                <button type="submit" disabled={loggingIn} className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 text-sm transition shadow-sm disabled:opacity-50 mt-2">
                  {loggingIn ? 'Signing in...' : 'Sign In to Class Portal'}
                </button>
              </form>
            </div>
            <div className="relative z-10 mt-8">
              <p className="text-[11px] text-slate-400 font-medium">
                © 2026 RNS Institute of Technology, Bengaluru. All rights reserved.
              </p>
            </div>
          </div>
          <div className="md:col-span-2 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                Quick Demo Access
              </p>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Select a Class Teacher</h3>
              <p className="text-xs text-slate-500 mb-4">Click any class below to auto-fill credentials:</p>
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                {DEMO_TEACHERS.map((t) => (
                  <button key={t.std} type="button" onClick={() => { setEmail(t.email); setPassword('teacher123'); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition flex justify-between items-center ${email === t.email ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                    <div>
                      <span className="font-bold">{t.std}</span> — {t.name}
                      <span className="block text-[10px] text-slate-400">{t.email}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                      Auto-Fill
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 2. CLASS-LOCKED TEACHER DASHBOARD ====================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/RNS.png" alt="RNSIT Logo" className="h-10 object-contain" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-slate-900">
                  {teacher.assignedClass} — School Dropout System
                </h1>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  {workingDaysQuota} Working Days Rule
                </span>
              </div>
              <p className="text-xs text-slate-500">{schoolStageLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{teacher.fullName}</span>
              <span className="text-[11px] text-emerald-700 font-semibold">Class Teacher</span>
            </div>
            <button onClick={handleLogout} className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-7 space-y-6">
        {/* Welcome & Reset Bar */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Assigned Classroom Overview
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Welcome, {teacher.fullName}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Showing all {stats.total} students enrolled in {teacher.assignedClass}.
            </p>
          </div>
          <button onClick={handleResetClassAttendance} className="self-start sm:self-auto rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 text-xs font-bold text-red-700 transition">
            Reset {teacher.assignedClass} Attendance (0 Days)
          </button>
        </section>

        {/* Summary KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Class Strength</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
            <p className="text-[11px] text-slate-400 mt-1">Enrolled in {teacher.assignedClass}</p>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-emerald-700">Safe Status</p>
            <p className="text-3xl font-bold text-emerald-700 mt-1">{stats.safe}</p>
            <p className="text-[11px] text-slate-400 mt-1">Attendance 85% and above</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-amber-700">Warning Status</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{stats.warning}</p>
            <p className="text-[11px] text-slate-400 mt-1">Attendance 75% – 84%</p>
          </div>
          <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-red-700">High Dropout Risk</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats.highRisk}</p>
            <p className="text-[11px] text-slate-400 mt-1">Below 75% or 3+ absences</p>
          </div>
        </section>

        {/* MODERN SLIDING DATE STRIP */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Select Attendance Date</h3>
            <p className="text-xs text-slate-500 mt-0.5">Use the arrows to slide back to previous weeks.</p>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0">
            <button 
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="flex items-center justify-center min-w-[2.5rem] h-[4rem] rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-emerald-700 transition-all cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>

            {recentDates.map((dateObj) => {
              const isoString = getLocalIso(dateObj);
              const isSelected = attendanceDate === isoString;
              const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
              const dayNum = dateObj.getDate();
              const isToday = isoString === TODAY;

              return (
                <button
                  key={isoString}
                  onClick={() => setAttendanceDate(isoString)}
                  className={`flex flex-col items-center justify-center min-w-[4rem] h-[4rem] rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-700 border-emerald-700 text-white shadow-md transform scale-105'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {isToday ? 'Today' : dayName}
                  </span>
                  <span className="text-lg font-black leading-tight mt-0.5">{dayNum}</span>
                </button>
              );
            })}
            
            <button 
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
              className="flex items-center justify-center min-w-[2.5rem] h-[4rem] rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-emerald-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </section>

        {/* Student Register Table */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {teacher.assignedClass} Attendance & Early Warning Register
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Currently marking attendance for: <strong className="text-emerald-700">{new Date(attendanceDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or roll number..."
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-600"
              />
              <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                {[
                  ['ALL', 'All'],
                  ['HIGH_RISK', 'High Risk'],
                  ['WARNING', 'Warning'],
                  ['SAFE', 'Safe'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setRiskFilter(key)}
                    className={`px-3 py-1.5 rounded-md transition ${
                      riskFilter === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student & Warning Flag</th>
                  <th className="py-3 px-4">Standard</th>
                  <th className="py-3 px-4">Guardian & Phone</th>
                  <th className="py-3 px-4">Working Days ({workingDaysQuota}d)</th>
                  <th className="py-3 px-4">Attendance %</th>
                  <th className="py-3 px-4">Absence Streak</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Loading {teacher.assignedClass} students...
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((s) => {
                    const badgeStyle =
                      s.riskStatus === 'HIGH_RISK'
                        ? 'bg-red-100 text-red-700'
                        : s.riskStatus === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-700';

                    const present = s.daysPresent || 0;
                    const absent = s.daysAbsent || 0;
                    const quota = s.totalWorkingDays || workingDaysQuota;

                    return (
                      <tr key={s.studentId} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-600 text-xs">
                          {s.rollNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{s.fullName}</p>
                          {s.riskFactor && s.riskFactor !== 'NONE' && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              ⚠ {s.riskFactor.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                          {s.classSection}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <p className="font-semibold text-slate-800">{s.guardianName}</p>
                          <p className="text-slate-500">{s.guardianPhone}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="w-36">
                            <div className="flex justify-between font-semibold mb-1">
                              <span className="text-emerald-700">{present} Present</span>
                              <span className="text-red-600">{absent} Absent</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600"
                                style={{
                                  width: `${Math.min(100, ((present + absent) / quota) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Target: {quota} days/year
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          {Number(s.attendancePercentage).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold ${
                              s.consecutiveAbsences >= 3 ? 'text-red-600' : 'text-slate-700'
                            }`}
                          >
                            {s.consecutiveAbsences} days
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
                            {s.riskStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleMarkAttendance(s, true)}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 text-xs font-bold text-emerald-800"
                          >
                            <svg className="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6"/></svg> Present
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(s, false)}
                            className="rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 text-xs font-bold text-red-700"
                          >
                            <svg className="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 6 12 12M18 6 6 18"/></svg> Absent
                          </button>
                          <button
                            onClick={() => openFollowUpModal(s)}
                            className="rounded-lg bg-sky-600 hover:bg-sky-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                          >
                            Log / View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredStudents.length ? (page - 1) * pageSize + 1 : 0} –{' '}
              {Math.min(page * pageSize, filteredStudents.length)} of {filteredStudents.length}{' '}
              students in {teacher.assignedClass}
            </span>
            <div className="flex gap-1.5">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40">Previous</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40">Next</button>
            </div>
          </div>
        </section>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900 text-white px-5 py-2.5 text-xs font-bold shadow-lg">
          {toast}
        </div>
      )}

      {/* Parent Follow-Up Modal */}
      {activeStudent && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-700">
                  Parent Follow-Up • Logged by {teacher.fullName}
                </p>
                <h3 className="text-lg font-bold text-slate-900">{activeStudent.fullName}</h3>
                <p className="text-xs text-slate-500">
                  {activeStudent.rollNumber} • Guardian: {activeStudent.guardianName} (
                  {activeStudent.guardianPhone})
                </p>
              </div>
              <button onClick={() => setActiveStudent(null)} className="text-slate-400 hover:text-slate-700 font-bold text-2xl">&times;</button>
            </div>

            <div className="mt-2 mb-4">
              <label className="text-[10px] font-bold uppercase text-slate-500 mr-2">Student Warning Flag:</label>
              <select 
                value={activeStudent.riskFactor || 'NONE'} 
                onChange={(e) => handleUpdateRiskFactor(e.target.value)}
                className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-1 outline-none cursor-pointer"
              >
                <option value="NONE">None (Safe)</option>
                <option value="FEE_DELAY">Fee Payment Delay</option>
                <option value="GRADE_DROP">Academic Grade Drop</option>
                <option value="MIGRATION_RISK">Family Migration Risk</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Contact Mode</label>
                <select value={contactMode} onChange={(e) => setContactMode(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="PHONE_CALL">Phone Call</option>
                  <option value="HOME_VISIT">Home Visit</option>
                  <option value="IN_PERSON">In-Person Meeting</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Absence Reason</label>
                <select value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="Attendance Deficit">Attendance Deficit</option>
                  <option value="Fee Delay">Fee Payment Delay</option>
                  <option value="Academic Drop">Academic Grade Drop</option>
                  <option value="Seasonal Migration">Seasonal Migration</option>
                  <option value="Health/Family">Health or Family Issue</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Counseling Remarks</label>
              <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter parent conversation details and action plan..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>

            <div className="flex gap-2">
              <button onClick={handleSaveFollowUp} disabled={!remarks.trim() || savingFollowup} className="flex-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 text-xs disabled:opacity-40">
                {savingFollowup ? 'Saving...' : 'Save Follow-Up'}
              </button>
              <button onClick={() => setActiveStudent(null)} className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700">
                Close
              </button>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                Previous Follow-Ups ({followups.length})
              </h4>
              {followups.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No follow-ups recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {followups.map((f, idx) => (
                    <div key={f.followupId || idx} className="p-2.5 rounded-lg bg-slate-50 border text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{f.contactMode.replace('_', ' ')} — <span className="text-red-600">{f.absenceReason}</span></span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{f.followupDate}</span>
                          <button 
                            onClick={() => handleDeleteFollowUp(f.followupId)}
                            className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 bg-red-50 border border-red-100 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-600 mt-1">{f.remarks}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}