import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Users, GraduationCap, CalendarDays, TrendingUp, ShieldCheck, Filter, X, RefreshCcw, ClipboardCheck, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import api from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const StatCard = ({ title, value, icon: Icon, subtitle, color }: { title: string; value: string | number; icon: React.ElementType; subtitle?: string; color: string }) => (
  <div className="stat-card group animate-fade-in">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{title}</p>
        <p className="text-[1.75rem] font-black mt-2 text-foreground tracking-tighter leading-none">{value}</p>
        {subtitle && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 bg-muted w-fit px-2 py-0.5 rounded-full">{subtitle}</p>}
      </div>
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${color}`}>
        <Icon className="h-6 w-6 stroke-[2.5px]" />
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterCentre, setFilterCentre] = useState<string>("all");
  const [filterFellow, setFilterFellow] = useState<string>("all");
  const [centres, setCentres] = useState<any[]>([]);
  const [fellows, setFellows] = useState<any[]>([]);

  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  const years = ["2023", "2024", "2025", "2026"];

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'program_manager') {
      const emailParams = user?.role === 'program_manager' ? `?role=program_manager&email=${user.email}` : '';
      Promise.all([
        api.get(`/centres${emailParams}`),
        api.get(`/fellows${emailParams}`)
      ]).then(([cRes, fRes]) => {
        setCentres(cRes.data);
        setFellows(fRes.data);
      }).catch(() => {});
    }
  }, [user]);

  const filteredCentres = useMemo(() => {
    if (filterFellow === "all") return centres;
    const selectedFellow = fellows.find(f => (f._id || f.id) === filterFellow);
    if (!selectedFellow) return centres;
    // A fellow has centreIds or assignedCentres
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
    const adminParams = (user.role === 'admin' || user.role === 'program_manager') 
      ? `&centreId=${filterCentre}&fellowId=${filterFellow}` 
      : '';
    
    api.get(`/dashboard/stats?${roleParams}${dateParams}${adminParams}`)
      .then(res => setStats(res.data))
      .catch(() => {});
  }, [user, filterMonth, filterYear, filterCentre, filterFellow]);

  if (!stats) return <div className="h-[200px] w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="animate-fade-in space-y-8">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="page-description font-medium text-muted-foreground">
            {user?.role === 'fellow' 
              ? "Overview of assigned centres and progress" 
              : "LTM program performance and impact metrics"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/5 text-primary">
            <Filter className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5">
            {(user?.role === 'admin' || user?.role === 'program_manager') && (
              <>
                <Select value={filterFellow} onValueChange={(v) => { setFilterFellow(v); setFilterCentre("all"); }}>
                  <SelectTrigger className="w-[120px] md:w-[150px] h-9 rounded-xl bg-white/60 border-none shadow-sm focus:ring-primary/20 text-xs font-bold hover:bg-white transition-all">
                    <SelectValue placeholder="All Fellows" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                    <SelectItem value="all" className="rounded-lg text-xs font-bold">All Fellows</SelectItem>
                    {fellows.map(f => (
                      <SelectItem key={f._id || f.id} value={f._id || f.id} className="rounded-lg text-xs font-medium">{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCentre} onValueChange={setFilterCentre}>
                  <SelectTrigger className="w-[120px] md:w-[150px] h-9 rounded-xl bg-white/60 border-none shadow-sm focus:ring-primary/20 text-xs font-bold hover:bg-white transition-all">
                    <SelectValue placeholder="All Centres" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                    <SelectItem value="all" className="rounded-lg text-xs font-bold">All Centres</SelectItem>
                    {filteredCentres.map(c => (
                      <SelectItem key={c._id || c.id} value={c._id || c.id} className="rounded-lg text-xs font-medium">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[120px] h-9 rounded-xl bg-white/60 border-none shadow-sm focus:ring-primary/20 text-xs font-bold hover:bg-white transition-all">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                <SelectItem value="all" className="rounded-lg text-xs font-bold">All Months</SelectItem>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value} className="rounded-lg text-xs font-medium">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[85px] h-9 rounded-xl bg-white/60 border-none shadow-sm focus:ring-primary/20 text-xs font-bold hover:bg-white transition-all">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {years.map(y => (
                  <SelectItem key={y} value={y} className="rounded-lg text-xs font-medium">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterMonth !== 'all' || filterCentre !== 'all' || filterFellow !== 'all') && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { setFilterMonth('all'); setFilterCentre('all'); setFilterFellow('all'); }}
                className="h-9 w-9 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        <StatCard title="Total Centres" value={stats.totalCentres} icon={Building2} subtitle="Program Wide" color="bg-primary/10 text-primary" />
        <StatCard title="Fellows" value={stats.totalFellows} icon={Users} subtitle="Active" color="bg-info/10 text-info" />
        <StatCard title="Students" value={stats.totalStudents} icon={GraduationCap} subtitle="Enrolled" color="bg-success/10 text-success" />
        <StatCard title="Sessions" value={stats.totalSessions} icon={CalendarDays} subtitle="Total Logged" color="bg-accent/10 text-accent" />
        <StatCard title="Attendance" value={`${stats.avgAttendance}%`} icon={TrendingUp} subtitle="Average" color="bg-warning/10 text-warning" />
        <StatCard title="Learning Score" value={stats.avgScore} icon={ShieldCheck} subtitle="Out of 5" color="bg-destructive/10 text-destructive" />
        <StatCard title="Assessed" value={`${stats.assessmentCoverage}%`} icon={ClipboardCheck} subtitle="Coverage" color="bg-primary/10 text-primary" />
        <StatCard title="Total Reviews" value={stats.assessmentTrend?.reduce((a: any, b: any) => a + b.count, 0) || 0} icon={FileCheck} subtitle="Evaluations" color="bg-indigo/10 text-indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card-premium group">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-white/20 pb-4">
            <CardTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="h-[220px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey={filterMonth === 'all' ? 'name' : 'week'} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600' }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Line type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-premium group">
          <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent border-b border-white/20 pb-4">
            <CardTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-accent" /> Assessment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="h-[220px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.assessmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar yAxisId="left" dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} barSize={30} />
                  <Line yAxisId="right" type="monotone" dataKey="score" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 3 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card-premium group">
          <CardHeader className="bg-gradient-to-r from-info/5 to-transparent border-b border-white/20 pb-4">
            <CardTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-info" /> Centre Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="h-[220px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.centreComparison}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '600' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-premium group">
          <CardHeader className="bg-gradient-to-r from-destructive/5 to-transparent border-b border-white/20 pb-4">
            <CardTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-destructive" /> Centre Quality Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="h-[280px] md:h-[350px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-6">Showing Top 10 Centres by Quality</p>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={stats.centreComparison?.slice(0, 10)}>
                  <PolarGrid stroke="#f0f0f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#888' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar name="Quality" dataKey="quality" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
                  <Radar name="Learning" dataKey="learning" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
