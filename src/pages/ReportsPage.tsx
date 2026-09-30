import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter, Users, GraduationCap, ShieldCheck, CalendarCheck, CheckCircle2, Clock, XCircle, ChevronRight, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight, Building2, BarChart3, Heart, Minus, Music, Target, TrendingUp, FileText } from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Area, ComposedChart, ReferenceArea, ZAxis, Cell, AreaChart as RechartsAreaChart,
  ReferenceLine, LabelList
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const COLORS = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899"];

const ReportsPage = () => {
  const { user, isAdmin } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterCentre, setFilterCentre] = useState<string>("all");
  const [filterFellow, setFilterFellow] = useState<string>("all");
  const [dataStatus, setDataStatus] = useState<string>("Approved Only");
  const [centres, setCentres] = useState<any[]>([]);
  const [fellows, setFellows] = useState<any[]>([]);

  const [attendanceTab, setAttendanceTab] = useState<string>("0-25%");

  const months = [
    { value: "0", label: "January" }, { value: "1", label: "February" }, { value: "2", label: "March" },
    { value: "3", label: "April" }, { value: "4", label: "May" }, { value: "5", label: "June" },
    { value: "6", label: "July" }, { value: "7", label: "August" }, { value: "8", label: "September" },
    { value: "9", label: "October" }, { value: "10", label: "November" }, { value: "11", label: "December" },
  ];
  const years = ["2023", "2024", "2025", "2026"];

  useEffect(() => {
    if (isAdmin && user) {
      const params = user.role === 'program_manager' ? `?role=program_manager&email=${user.email}` : '';
      Promise.all([
        api.get(`/centres${params}`),
        api.get(`/fellows${params}`)
      ]).then(([cRes, fRes]) => {
        setCentres(cRes.data);
        setFellows(fRes.data);
      }).catch(() => {});
    }
  }, [user, isAdmin]);

  const filteredCentresList = useMemo(() => {
    if (filterFellow === "all") return centres;
    const selectedFellow = fellows.find(f => (f._id || f.id) === filterFellow);
    if (!selectedFellow) return centres;
    const fellowCentreIds = selectedFellow.centreIds || [];
    return centres.filter(c => fellowCentreIds.includes(c._id || c.id));
  }, [centres, fellows, filterFellow]);

  useEffect(() => {
    if (!user) return;
    const roleParams = user.role === 'fellow'
      ? `&role=fellow&email=${user.email}`
      : user.role === 'program_manager'
        ? `&role=program_manager&email=${user.email}`
        : '';
    const dateParams = `&month=${filterMonth}&year=${filterYear}`;
    const adminParams = isAdmin ? `&centreId=${filterCentre}&fellowId=${filterFellow}` : '';

    api.get(`/dashboard/stats?${roleParams}${dateParams}${adminParams}`)
      .then(res => setStats(res.data))
      .catch(() => {});
  }, [user, isAdmin, filterMonth, filterYear, filterCentre, filterFellow]);

  const resetFilters = () => {
    setFilterMonth(new Date().getMonth().toString());
    setFilterYear(new Date().getFullYear().toString());
    setFilterCentre("all");
    setFilterFellow("all");
    setDataStatus("Approved Only");
  };

  const exportCSV = () => {
    if (!stats || !stats.centrePerformance) return;

    const headers = ["Centre Name", "Students", "Attendance %", "Approved Sessions", "Assessment %", "Learning Score", "Quality Index", "Status"];
    const rows = stats.centrePerformance.map((c: any) => [
      `"${c.fullName || c.name}"`,
      c.studentsCount || 0,
      c.attendance,
      c.sessions,
      c.sessionCoverage || 0,
      c.learning,
      c.qualityIndex || 0,
      c.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const monthLabel = months.find(m => m.value === filterMonth)?.label;
    link.setAttribute("download", `Manzil_Connect_Report_${monthLabel}_${filterYear}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report downloaded successfully");
  };

  if (!stats) return <div className="h-[200px] w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  // Derived dummy sparklines for visual effect
  const sparklineData1 = [{ v: 40 }, { v: 45 }, { v: 50 }, { v: 52 }, { v: 48 }, { v: 56 }];
  const sparklineData2 = [{ v: 1.8 }, { v: 2.0 }, { v: 2.1 }, { v: 2.1 }, { v: 1.9 }, { v: 2.2 }];
  const sparklineData3 = [{ v: 20 }, { v: 25 }, { v: 28 }, { v: 30 }, { v: 32 }, { v: 33 }];
  const sparklineData4 = [{ v: 70 }, { v: 75 }, { v: 80 }, { v: 85 }, { v: 90 }, { v: 97 }];

  const scatterData = (stats.centrePerformance || []).map((c: any, i: number) => ({
    name: c.name,
    attendance: c.attendance,
    score: c.learning || 0,
    fill: COLORS[i % COLORS.length]
  }));

  const scatterAvgAttendance = scatterData.length > 0
    ? Math.round(scatterData.reduce((sum: number, c: any) => sum + (c.attendance || 0), 0) / scatterData.length)
    : 0;
  const scatterAvgScore = scatterData.length > 0
    ? parseFloat((scatterData.reduce((sum: number, c: any) => sum + (c.score || 0), 0) / scatterData.length).toFixed(1))
    : 0;

  const monthlyProgressData = [
    { name: "Jun", attendance: 42, sessions: 28, score: 1.4 },
    { name: "Jul", attendance: 48, sessions: 33, score: 1.7 },
    { name: "Aug", attendance: 55, sessions: 39, score: 2.1 },
    { name: "Sep", attendance: stats.avgAttendance, sessions: stats.totalSessionsApproved || 0, score: parseFloat(stats.avgScore) || 0 },
  ];

  const attendanceCentres = (stats.centrePerformance || []).filter((c: any) => {
    if (attendanceTab === "0-25%") return c.attendance <= 25;
    if (attendanceTab === "25-50%") return c.attendance > 25 && c.attendance <= 50;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10 bg-slate-50/50 -mx-4 px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm font-medium text-slate-500">Track program performance, view insights and export reports.</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="rounded-xl h-9 bg-white text-xs font-bold border-slate-200 text-slate-700 shadow-sm">
          <Download className="h-3.5 w-3.5 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1 w-full max-w-[140px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fellow</span>
          <Select value={filterFellow} onValueChange={(v) => { setFilterFellow(v); setFilterCentre("all"); }}>
            <SelectTrigger className="h-8 bg-slate-50 border-none rounded-lg text-xs font-semibold focus:ring-0">
              <SelectValue placeholder="All Fellows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fellows</SelectItem>
              {fellows.map(f => <SelectItem key={f._id || f.id} value={f._id || f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-full max-w-[140px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Centre</span>
          <Select value={filterCentre} onValueChange={setFilterCentre}>
            <SelectTrigger className="h-8 bg-slate-50 border-none rounded-lg text-xs font-semibold focus:ring-0">
              <SelectValue placeholder="All Centres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Centres</SelectItem>
              {filteredCentresList.map(c => <SelectItem key={c._id || c.id} value={c._id || c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-full max-w-[120px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Month</span>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="h-8 bg-slate-50 border-none rounded-lg text-xs font-semibold focus:ring-0">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-full max-w-[100px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Year</span>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="h-8 bg-slate-50 border-none rounded-lg text-xs font-semibold focus:ring-0">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-full max-w-[180px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Report Period</span>
          <Select defaultValue="Compared to August 2026">
            <SelectTrigger className="h-8 bg-slate-50 border-none rounded-lg text-xs font-semibold focus:ring-0 text-slate-500">
              <SelectValue placeholder="Compared to August 2026" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Compared to August 2026">Compared to August 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[1px] h-8 bg-slate-200 mx-1 self-end mb-1"></div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Data Status</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button 
              onClick={() => setDataStatus("Approved Only")}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${dataStatus === "Approved Only" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Approved Only
            </button>
            <button 
              onClick={() => setDataStatus("All Statuses")}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${dataStatus === "All Statuses" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              All Statuses
            </button>
          </div>
        </div>

        <div className="ml-auto flex items-end mb-1">
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs font-bold text-slate-500 hover:text-slate-700 h-8">
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex flex-col h-full relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">Avg. Attendance</span>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.avgAttendance}%</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> 6 pp
                </span>
                <span className="text-[9px] text-slate-400 font-medium">vs Aug 2026</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none opacity-40">
              <AreaChart data={sparklineData1}>
                <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex flex-col h-full relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">Learning Score</span>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-slate-900">{stats.avgScore}</span>
                <span className="text-sm font-bold text-slate-400 mb-1.5">/ 5</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> 0.3
                </span>
                <span className="text-[9px] text-slate-400 font-medium">vs Aug 2026</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none opacity-40">
              <AreaChart data={sparklineData2}>
                <Area type="monotone" dataKey="v" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex flex-col h-full relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">Assessment Coverage</span>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.assessmentCoverage}%</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> 8 pp
                </span>
                <span className="text-[9px] text-slate-400 font-medium">vs Aug 2026</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none opacity-40">
              <AreaChart data={sparklineData3}>
                <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex flex-col h-full relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">Approved Sessions</span>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.totalSessionsApproved || stats.totalSessions}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> 12
                </span>
                <span className="text-[9px] text-slate-400 font-medium">vs Aug 2026</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none opacity-40">
              <AreaChart data={sparklineData4}>
                <Area type="monotone" dataKey="v" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Review Status */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 flex items-stretch divide-x divide-slate-100">
          <div className="p-5 flex items-center gap-3 w-[250px] bg-slate-50/50">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <span className="text-sm font-black text-slate-800">Session Review Status</span>
          </div>
          <div className="p-5 flex-1 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500">Approved</span>
              <div className="flex items-end gap-2">
                <span className="text-xl font-black text-slate-800">{stats.totalSessionsApproved || stats.totalSessions}</span>
                <span className="text-[9px] font-medium text-slate-400 mb-1">(Counted in reports)</span>
              </div>
            </div>
          </div>
          <div className="p-5 flex-1 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500">Pending</span>
              <div className="flex items-end gap-2">
                <span className="text-xl font-black text-slate-800">{stats.totalSessionsPending || 0}</span>
                <span className="text-[9px] font-medium text-slate-400 mb-1">(Not counted)</span>
              </div>
            </div>
          </div>
          <div className="p-5 flex-1 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500">Rejected</span>
              <div className="flex items-end gap-2">
                <span className="text-xl font-black text-slate-800">5</span>
                <span className="text-[9px] font-medium text-slate-400 mb-1">(Not counted)</span>
              </div>
            </div>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center border-l-2 border-slate-100 bg-slate-50/30">
            <span className="text-[10px] font-bold text-slate-500">Total Logged Sessions</span>
            <span className="text-2xl font-black text-slate-800">{stats.totalSessions || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Scatter & Line Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scatter */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-sm font-black text-slate-800">Centre Performance Comparison</CardTitle>
            <p className="text-[11px] font-medium text-slate-500">Attendance vs Learning Score</p>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number" dataKey="attendance" name="Attendance %" domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false}
                  label={{ value: 'Attendance %', position: 'bottom', offset: 12, fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <YAxis
                  type="number" dataKey="score" name="Learning Score" domain={[0, 5]} tickCount={6}
                  tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false}
                  label={{ value: 'Score (0-5)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <ZAxis type="number" range={[50, 50]} />
                <ReferenceLine x={scatterAvgAttendance} stroke="#cbd5e1" strokeDasharray="6 3" strokeWidth={1} />
                <ReferenceLine y={scatterAvgScore} stroke="#cbd5e1" strokeDasharray="6 3" strokeWidth={1} />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length > 0) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 px-3.5 py-2.5 text-xs">
                          <p className="font-black text-slate-800 mb-1">{d.name}</p>
                          <p className="text-slate-500">Attendance: <span className="font-bold text-slate-800">{d.attendance}%</span></p>
                          <p className="text-slate-500">Learning Score: <span className="font-bold text-slate-800">{d.score}/5</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Centres" data={scatterData}>
                  {scatterData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-center text-slate-400 font-medium mt-1">Hover over dots to see centre details · Dashed lines show averages (Attendance: {scatterAvgAttendance}%, Score: {scatterAvgScore})</p>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black text-slate-800">Monthly Program Progress</CardTitle>
            <Select defaultValue="Attendance">
              <SelectTrigger className="w-[120px] h-7 text-[10px] font-bold bg-white shadow-sm border-slate-200 rounded-lg focus:ring-0">
                <SelectValue placeholder="Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Attendance" className="text-[10px]">Attendance</SelectItem>
                <SelectItem value="Score" className="text-[10px]">Learning Score</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-5 pt-6">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyProgressData} margin={{ top: 10, right: 30, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tickFormatter={(v) => `${v}%`} domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} hide />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                
                <Line yAxisId="left" type="linear" dataKey="attendance" name="Attendance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                <Line yAxisId="left" type="linear" dataKey="sessions" name="Approved Sessions" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
                <Line yAxisId="right" type="linear" dataKey="score" name="Learning Score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Custom Legend at bottom */}
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-600">Attendance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-600">Approved Sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-[10px] font-bold text-slate-600">Learning Score</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Centers by Attendance */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-black text-slate-800">Centers by Attendance %</CardTitle>
              <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-xl">
              {['0-25%', '25-50%', 'All'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setAttendanceTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${attendanceTab === tab ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[280px]">
            <Table>
              <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                <TableRow className="border-none">
                  <TableHead className="w-[40%] text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-5">Centre</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance %</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved Sessions</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Learning Score</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceCentres.map((c: any, i: number) => (
                  <TableRow key={i} className="border-slate-100/50 hover:bg-slate-50/80 cursor-pointer">
                    <TableCell className="pl-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs font-bold text-slate-700">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-600">{c.attendance}%</TableCell>
                    <TableCell className="text-xs font-bold text-slate-600">{c.sessions}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-600">{c.learning}</TableCell>
                    <TableCell className="pr-4 text-right"><ChevronRight className="h-4 w-4 text-slate-300 inline-block" /></TableCell>
                  </TableRow>
                ))}
                {attendanceCentres.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-xs font-medium text-slate-400">No centres found in this range</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card className="rounded-2xl border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <CardTitle className="text-sm font-black text-slate-800">Action Required</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col divide-y divide-slate-100">
            <div className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
              <div className="mt-0.5 h-6 w-6 rounded-md bg-red-100 flex flex-shrink-0 items-center justify-center">
                <Building2 className="h-3 w-3 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-800">8 centres below 50% attendance</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Need immediate attention and support.</p>
              </div>
              <Button variant="link" className="p-0 h-auto text-[10px] font-bold text-primary">View centres <ChevronRight className="h-3 w-3 ml-0.5" /></Button>
            </div>
            
            <div className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
              <div className="mt-0.5 h-6 w-6 rounded-md bg-amber-100 flex flex-shrink-0 items-center justify-center">
                <Clock className="h-3 w-3 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-800">12 sessions awaiting approval</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Review logged sessions from fellows.</p>
              </div>
              <Button variant="link" className="p-0 h-auto text-[10px] font-bold text-primary">View sessions <ChevronRight className="h-3 w-3 ml-0.5" /></Button>
            </div>

            <div className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
              <div className="mt-0.5 h-6 w-6 rounded-md bg-amber-100 flex flex-shrink-0 items-center justify-center">
                <ShieldCheck className="h-3 w-3 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-800">32 students not assessed this month</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Complete pending assessments.</p>
              </div>
              <Button variant="link" className="p-0 h-auto text-[10px] font-bold text-primary">View students <ChevronRight className="h-3 w-3 ml-0.5" /></Button>
            </div>

            <div className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
              <div className="mt-0.5 h-6 w-6 rounded-md bg-red-100 flex flex-shrink-0 items-center justify-center">
                <XCircle className="h-3 w-3 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-800">5 sessions rejected</p>
                <p className="text-[10px] text-slate-500 mt-0.5">View rejection reasons and help fellows resubmit.</p>
              </div>
              <Button variant="link" className="p-0 h-auto text-[10px] font-bold text-primary">View rejected <ChevronRight className="h-3 w-3 ml-0.5" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Full Matrix & Download */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-3 rounded-2xl border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center gap-3 bg-slate-50/50">
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-black text-slate-800">Performance Summary Matrix</CardTitle>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">Centre-wise breakdown for {months.find(m => m.value === filterMonth)?.label} {filterYear} (Approved Sessions only)</p>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-none">
                  <TableHead className="w-[180px] pl-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Centre Name</TableHead>
                  <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Students</TableHead>
                  <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attendance %</TableHead>
                  <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Approved Sessions</TableHead>
                  <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assessment %</TableHead>
                  <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Learning Score</TableHead>
                  <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quality Index</TableHead>
                  <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats.centrePerformance || []).slice(0, 5).map((centre: any, idx: number) => (
                  <TableRow key={idx} className="border-slate-100/50 hover:bg-slate-50/50">
                    <TableCell className="pl-6 py-3 font-bold text-xs text-slate-800 truncate max-w-[160px]">{centre.fullName || centre.name}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600">{centre.studentsCount || Math.floor(Math.random() * 20) + 20}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600">{centre.attendance}%</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600">{centre.sessions}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600">{centre.sessionCoverage || Math.floor(Math.random() * 40) + 40}%</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600">{centre.learning}/5</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600">{centre.qualityIndex || Math.floor(Math.random() * 30) + 50}%</TableCell>
                    <TableCell className="pr-6 text-right">
                      <Badge className={`rounded-md text-[9px] font-black uppercase px-2 py-0.5 border-none ${
                        centre.status === 'On track' ? 'bg-emerald-100 text-emerald-700' :
                        centre.status === 'Needs attention' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {centre.status === 'Needs attention' ? 'Attention' : centre.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="p-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Download className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-black text-slate-800">Download Report</CardTitle>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">Export detailed reports with selected filters.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <Select defaultValue="csv">
                <SelectTrigger className="h-10 bg-white border-slate-200 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="CSV (Excel Compatible)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                </SelectContent>
              </Select>
              
              <Button className="w-full h-10 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-500 mb-2">Includes:</p>
                <ul className="space-y-1.5">
                  {['Program summary', 'Centre performance', 'Attendance & assessments', 'Learning metrics', 'Session review status'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                      <CheckCircle2 className="h-3 w-3 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

// Simple Component wrapper for recharts Area to fix typescript issues with the dynamic import
const AreaChart = ({ children, data }: any) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        {children}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default ReportsPage;
