import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Users, GraduationCap, CalendarDays, TrendingUp, TrendingDown, Filter, X, ClipboardCheck, BookOpen, AlertCircle, CheckCircle2, UserPlus, ChevronRight, BarChart3, Clock, MapPin, Activity, Calendar, User, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Legend } from "recharts";
import api from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const getChangeIcon = (current: number, previous: number) => {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { icon: TrendingUp, pct, color: "text-emerald-600", bg: "bg-emerald-50" };
  if (pct < 0) return { icon: TrendingDown, pct: Math.abs(pct), color: "text-red-500", bg: "bg-red-50" };
  return null;
};

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [filterStartMonth, setFilterStartMonth] = useState<string>("all");
  const [filterEndMonth, setFilterEndMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterCentre, setFilterCentre] = useState<string>("all");
  const [filterFellow, setFilterFellow] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");
  const [centreAttendanceFilter, setCentreAttendanceFilter] = useState<string>("all");
  const [centres, setCentres] = useState<any[]>([]);
  const [fellows, setFellows] = useState<any[]>([]);

  const months = [
    { value: "0", label: "January" }, { value: "1", label: "February" }, { value: "2", label: "March" },
    { value: "3", label: "April" }, { value: "4", label: "May" }, { value: "5", label: "June" },
    { value: "6", label: "July" }, { value: "7", label: "August" }, { value: "8", label: "September" },
    { value: "9", label: "October" }, { value: "10", label: "November" }, { value: "11", label: "December" },
  ];
  const years = ["2023", "2024", "2025", "2026"];

  useEffect(() => {
    if (isAdmin) {
      const emailParams = user?.role === 'program_manager' ? `?role=program_manager&email=${user.email}` : '';
      Promise.all([
        api.get(`/centres${emailParams}`),
        api.get(`/fellows${emailParams}`)
      ]).then(([cRes, fRes]) => { setCentres(cRes.data); setFellows(fRes.data); }).catch(() => {});
    }
  }, [user]);

  const filteredCentres = useMemo(() => {
    if (filterFellow === "all") return centres;
    return centres.filter(c => 
      (c.fellowIds || []).includes(filterFellow) || 
      (fellows.find(f => (f._id || f.id) === filterFellow)?.centreIds || []).includes(c._id || c.id)
    );
  }, [centres, fellows, filterFellow]);

  useEffect(() => {
    if (!user) return;
    const roleParams = user.role === 'fellow' ? `role=fellow&email=${user.email}` : user.role === 'program_manager' ? `role=program_manager&email=${user.email}` : '';
    const dateParams = filterStartMonth !== 'all' && filterEndMonth !== 'all' 
      ? `startMonth=${filterStartMonth}&endMonth=${filterEndMonth}&year=${filterYear}`
      : `month=${filterStartMonth}&year=${filterYear}`;
    const adminParams = isAdmin ? `centreId=${filterCentre}&fellowId=${filterFellow}` : '';
    const modelParams = `type=${filterModel}`;
    const queryString = [roleParams, dateParams, adminParams, modelParams].filter(Boolean).join('&');
    api.get(`/dashboard/stats?${queryString}`).then(res => setStats(res.data)).catch(() => {});
  }, [user, filterStartMonth, filterEndMonth, filterYear, filterCentre, filterFellow, filterModel]);

  const hasActiveFilters = filterStartMonth !== 'all' || filterEndMonth !== 'all' || filterCentre !== 'all' || filterFellow !== 'all' || filterModel !== 'all';

  if (!stats) return <div className="h-[200px] w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const donutData = [
    { name: "Completed", value: stats.totalAssessedStudents || 0 },
    { name: "Pending", value: stats.pendingAssessments || 0 },
  ];
  const DONUT_COLORS = ["hsl(var(--primary))", "#e5e7eb"];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case 'session': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'assessment': return <ClipboardCheck className="h-4 w-4 text-blue-500" />;
      case 'student': return <UserPlus className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const actionBadgeColor = (type: string) => {
    switch (type) {
      case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Review': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Follow up': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'On track': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">On track</Badge>;
      case 'Needs attention': return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">Needs attention</Badge>;
      case 'At risk': return <Badge className="bg-red-50 text-red-700 border-red-200 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">At risk</Badge>;
      default: return null;
    }
  };

  const studentChange = getChangeIcon(stats.totalStudents, stats.prevMonthData?.students || 0);
  const sessionChange = getChangeIcon(stats.totalSessions, stats.prevMonthData?.sessions || 0);
  const assessmentChange = getChangeIcon(stats.totalAssessedStudents || 0, stats.prevMonthData?.assessments || 0);
  const scoreChange = getChangeIcon(parseFloat(stats.avgScore || 0), stats.prevMonthData?.avgScore || 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ===== HEADER + FILTERS ===== */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Program performance at a glance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 bg-white border border-gray-100 shadow-sm rounded-xl px-3.5 flex items-center justify-start text-left gap-3 w-48 hover:bg-gray-50/50 transition-colors focus:ring-0 [&>span]:w-full font-normal">
                <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                  <span className="text-[10px] font-medium text-slate-500">Date Range</span>
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {filterStartMonth !== 'all' && filterEndMonth !== 'all' 
                      ? `${months.find(m=>m.value===filterStartMonth)?.label.substring(0,3)} - ${months.find(m=>m.value===filterEndMonth)?.label.substring(0,3)}`
                      : filterStartMonth !== 'all'
                      ? months.find(m=>m.value===filterStartMonth)?.label
                      : 'All Months'}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-xl p-4 shadow-xl">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Select Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">From</label>
                    <Select value={filterStartMonth} onValueChange={setFilterStartMonth}>
                      <SelectTrigger className="h-9 rounded-lg text-xs">
                        <SelectValue placeholder="Start Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">To</label>
                    <Select value={filterEndMonth} onValueChange={setFilterEndMonth}>
                      <SelectTrigger className="h-9 rounded-lg text-xs">
                        <SelectValue placeholder="End Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {isAdmin && (
            <>
              <Select value={filterCentre} onValueChange={setFilterCentre}>
                <SelectTrigger className="h-12 bg-white border border-gray-100 shadow-sm rounded-xl px-3.5 flex items-center justify-start text-left gap-3 w-40 hover:bg-gray-50/50 transition-colors focus:ring-0 [&>span]:w-full">
                  <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                  <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                    <span className="text-[10px] font-medium text-slate-500">Centre</span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      <SelectValue placeholder="All Centres" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs font-semibold">All Centres</SelectItem>
                  {filteredCentres.map(c => (
                    <SelectItem key={c._id || c.id} value={c._id || c.id} className="text-xs">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterFellow} onValueChange={(v) => { setFilterFellow(v); setFilterCentre("all"); }}>
                <SelectTrigger className="h-12 bg-white border border-gray-100 shadow-sm rounded-xl px-3.5 flex items-center justify-start text-left gap-3 w-40 hover:bg-gray-50/50 transition-colors focus:ring-0 [&>span]:w-full">
                  <User className="h-4 w-4 text-slate-500 shrink-0" />
                  <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                    <span className="text-[10px] font-medium text-slate-500">Fellow</span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      <SelectValue placeholder="All Fellows" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs font-semibold">All Fellows</SelectItem>
                  {fellows.map(f => (
                    <SelectItem key={f._id || f.id} value={f._id || f.id} className="text-xs">{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          <Select value={filterModel} onValueChange={setFilterModel}>
            <SelectTrigger className="h-12 bg-white border border-gray-100 shadow-sm rounded-xl px-3.5 flex items-center justify-start text-left gap-3 w-40 hover:bg-gray-50/50 transition-colors focus:ring-0 [&>span]:w-full">
              <Users className="h-4 w-4 text-slate-500 shrink-0" />
              <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                <span className="text-[10px] font-medium text-slate-500">Program Model</span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  <SelectValue placeholder="All Models" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs font-semibold">All Models</SelectItem>
              <SelectItem value="In-school" className="text-xs font-semibold">In-school</SelectItem>
              <SelectItem value="After-school" className="text-xs font-semibold">After-school</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            className="h-12 bg-white border border-gray-100 shadow-sm rounded-xl px-4 flex items-center gap-2 hover:bg-gray-50 transition-colors"
            onClick={() => { setFilterStartMonth('all'); setFilterEndMonth('all'); setFilterCentre('all'); setFilterFellow('all'); setFilterModel('all'); }}
          >
            <RotateCcw className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">Reset</span>
          </Button>
        </div>
      </div>

      {/* Date context */}
      {stats.dateContext && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> All Centres</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> {stats.dateContext.currentMonth} {stats.dateContext.currentYear} ({stats.dateContext.startDate} – {stats.dateContext.endDate})</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Compared to {stats.dateContext.prevMonth} {stats.dateContext.prevYear}</span>
        </div>
      )}

      {/* ===== ROW 2: STAT CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Students</p>
              <p className="text-3xl font-black mt-2 tracking-tight">{stats.totalStudents}</p>
              {studentChange && (
                <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${studentChange.color}`}>
                  <studentChange.icon className="h-3 w-3" /> {studentChange.pct}% <span className="text-muted-foreground font-normal">vs last month</span>
                </div>
              )}
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-blue-500" /></div>
          </div>
          <Badge className="mt-3 bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-bold uppercase tracking-widest">Enrolled</Badge>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sessions</p>
              <p className="text-3xl font-black mt-2 tracking-tight">{stats.totalSessions}</p>
              {sessionChange && (
                <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${sessionChange.color}`}>
                  <sessionChange.icon className="h-3 w-3" /> {sessionChange.pct}% <span className="text-muted-foreground font-normal">vs last month</span>
                </div>
              )}
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-emerald-500" /></div>
          </div>
          <Badge className="mt-3 bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-bold uppercase tracking-widest">Logged</Badge>
        </div>

        {/* Assessments */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assessments</p>
              <p className="text-3xl font-black mt-2 tracking-tight">{stats.totalAssessedStudents || 0}</p>
              {assessmentChange && (
                <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${assessmentChange.color}`}>
                  <assessmentChange.icon className="h-3 w-3" /> {assessmentChange.pct}% <span className="text-muted-foreground font-normal">vs last month</span>
                </div>
              )}
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 flex items-center justify-center"><ClipboardCheck className="h-5 w-5 text-purple-500" /></div>
          </div>
          <Badge className="mt-3 bg-purple-50 text-purple-600 border-purple-100 text-[9px] font-bold uppercase tracking-widest">Completed</Badge>
        </div>

        {/* Learning Impact */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Learning Impact</p>
              <p className="text-3xl font-black mt-2 tracking-tight">{stats.avgScore} <span className="text-base font-bold text-muted-foreground">/ 5</span></p>
              {scoreChange && (
                <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${scoreChange.color}`}>
                  <scoreChange.icon className="h-3 w-3" /> {scoreChange.pct}% <span className="text-muted-foreground font-normal">vs last month</span>
                </div>
              )}
            </div>
            <div className="h-11 w-11 rounded-xl bg-orange-50 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-orange-500" /></div>
          </div>
          <Badge className="mt-3 bg-orange-50 text-orange-600 border-orange-100 text-[9px] font-bold uppercase tracking-widest">Average Score</Badge>
        </div>
      </div>

      {/* ===== ROW 3: ATTENDANCE TREND + ASSESSMENT PROGRESS + ACTION REQUIRED ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Attendance Trend */}
        <Card className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Attendance Trend
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Monthly attendance rate and active students</p>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600' }} dy={8} />
                  <YAxis yAxisId="left" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                  <Bar yAxisId="left" dataKey="attendance" name="Attendance %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} fillOpacity={0.85} />
                  <Line yAxisId="right" type="monotone" dataKey="activeStudents" name="Active Students" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Progress */}
        <Card className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-purple-500" /> Assessment Progress
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Completion rate and average score</p>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex items-center gap-6">
              <div className="relative h-[150px] w-[150px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                      {donutData.map((_, index) => <Cell key={index} fill={DONUT_COLORS[index]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-primary">{stats.assessmentCoverage}%</span>
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase">Completed</span>
                </div>
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-[10px] text-muted-foreground font-medium">Completed</span>
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.totalAssessedStudents || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Completed reviews</p>
                  {assessmentChange && <p className={`text-[10px] font-bold ${assessmentChange.color} mt-0.5`}>↑ {assessmentChange.pct}% vs last month</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                  <span className="text-[10px] text-muted-foreground font-medium">Pending</span>
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.pendingAssessments || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Pending reviews</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" /> Action Required
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Immediate attention needed</p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {(stats.actionItems || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors group cursor-pointer">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-xs font-bold truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge className={`${actionBadgeColor(item.type)} text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border`}>{item.type}</Badge>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ===== ROW 4: CENTRE PERFORMANCE + LEARNING PROGRESS + RECENT ACTIVITY ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Centre Performance */}
        <Card className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 px-5 pt-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" /> Centre Performance
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Compare centres at a glance</p>
            </div>
            <Select value={centreAttendanceFilter} onValueChange={setCentreAttendanceFilter}>
              <SelectTrigger className="h-7 w-[100px] text-[10px] rounded-lg">
                <SelectValue placeholder="Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px]">All</SelectItem>
                <SelectItem value="0-25" className="text-[10px]">0-25%</SelectItem>
                <SelectItem value="25-50" className="text-[10px]">25-50%</SelectItem>
                <SelectItem value="50-100" className="text-[10px]">&gt; 50%</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="max-h-[300px] overflow-auto pr-1">
              <table className="w-full text-xs relative">
                <thead className="sticky top-0 bg-white shadow-[0_1px_0_0_#f3f4f6] z-10">
                  <tr>
                    <th className="text-left py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Centre</th>
                    <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Attendance</th>
                    <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Learning<br/>(Avg. Score)</th>
                    <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Sessions</th>
                    <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.centrePerformance || [])
                    .filter((c: any) => {
                      if (centreAttendanceFilter === "0-25") return c.attendance >= 0 && c.attendance <= 25;
                      if (centreAttendanceFilter === "25-50") return c.attendance > 25 && c.attendance <= 50;
                      if (centreAttendanceFilter === "50-100") return c.attendance > 50;
                      return true;
                    })
                    .map((c: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${c.status === 'On track' ? 'bg-emerald-400' : c.status === 'At risk' ? 'bg-red-400' : 'bg-amber-400'}`} />
                          <span className="font-semibold truncate max-w-[100px]" title={c.fullName}>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold">{c.attendance}%</td>
                      <td className="py-2.5 px-2 text-center font-bold">{c.learning} / 5</td>
                      <td className="py-2.5 px-2 text-center font-medium">{c.sessions} / {c.sessionsTarget}</td>
                      <td className="py-2.5 px-2 text-center">{statusBadge(c.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Learning Progress */}
        <Card className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-500" /> Learning Progress
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Average assessment score by centre</p>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(stats.centreComparison || []).slice(0, 5)} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '600' }} dy={8} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                  <Bar dataKey="learning" name={`${stats.dateContext?.currentMonth || 'Current'}`} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="prevScore" name={`${stats.dateContext?.prevMonth || 'Previous'}`} fill="#c7d2fe" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 px-5 pt-5 bg-amber-50/50 rounded-t-2xl">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800">
              <Clock className="h-4 w-4" /> Recent Activity
            </CardTitle>
            <p className="text-[10px] text-amber-600/70">Latest updates from your program</p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1 max-h-[280px] overflow-y-auto">
            {(stats.recentActivities || []).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No recent activity</p>
            )}
            {(stats.recentActivities || []).map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="mt-0.5 h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center shrink-0">{activityIcon(a.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{a.description}</p>
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5">{a.time ? timeAgo(a.time) : ''}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ===== ROW 5: PRE vs POST ASSESSMENT OVERVIEW ===== */}
      {stats.prePostOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Pre vs Post Summary */}
          <Card className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-indigo-500" /> Pre vs Post Overview
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Assessment phase comparison</p>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {/* Pre Assessment Card */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Pre-Assessment</span>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-full">Baseline</Badge>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-black text-blue-700">{stats.prePostOverview.preAvgScore}<span className="text-base font-bold text-blue-400"> / 5</span></p>
                  <p className="text-xs text-blue-500 font-medium mb-1">{stats.prePostOverview.preCount} assessments</p>
                </div>
                <p className="text-[10px] text-blue-500 mt-1">{stats.preAssessmentCount} students assessed</p>
              </div>
              {/* Post Assessment Card */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Post-Assessment</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full">Outcome</Badge>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-black text-emerald-700">{stats.prePostOverview.postAvgScore}<span className="text-base font-bold text-emerald-400"> / 5</span></p>
                  <p className="text-xs text-emerald-500 font-medium mb-1">{stats.prePostOverview.postCount} assessments</p>
                </div>
                <p className="text-[10px] text-emerald-500 mt-1">{stats.postAssessmentCount} students assessed</p>
              </div>
              {/* Improvement */}
              {stats.prePostOverview.preAvgScore > 0 && stats.prePostOverview.postAvgScore > 0 && (
                <div className={`p-3 rounded-xl text-center ${stats.prePostOverview.postAvgScore >= stats.prePostOverview.preAvgScore ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                  <p className={`text-lg font-black ${stats.prePostOverview.postAvgScore >= stats.prePostOverview.preAvgScore ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stats.prePostOverview.postAvgScore >= stats.prePostOverview.preAvgScore ? '↑' : '↓'} {Math.abs(parseFloat((((stats.prePostOverview.postAvgScore - stats.prePostOverview.preAvgScore) / stats.prePostOverview.preAvgScore) * 100).toFixed(1)))}% 
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {stats.prePostOverview.postAvgScore >= stats.prePostOverview.preAvgScore ? 'Improvement' : 'Decline'} in Learning
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pre vs Post by Category Chart */}
          <Card className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" /> Pre vs Post by Category
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Score comparison across assessment categories</p>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.prePostOverview.byCategory || []} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '600' }} dy={8} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px' }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                    <Bar dataKey="preScore" name="Pre-Assessment" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="postScore" name="Post-Assessment" fill="#34d399" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== ROW 6: PROGRAM ACTIVITY OVERVIEW ===== */}
      {stats.programOverview && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold mb-1 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Program Activity Overview</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Key metrics and progress across the program</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-lg font-black">{stats.programOverview.totalSessionsLogged}</p>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Total Sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center"><ClipboardCheck className="h-5 w-5 text-orange-500" /></div>
              <div>
                <p className="text-lg font-black">{stats.programOverview.assessmentsPending}</p>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Assessments Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-purple-500" /></div>
              <div>
                <p className="text-lg font-black">{stats.programOverview.totalCentres}</p>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Total Centres</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Users className="h-5 w-5 text-emerald-500" /></div>
              <div>
                <p className="text-lg font-black">{stats.programOverview.totalFellows}</p>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Total Fellows</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
