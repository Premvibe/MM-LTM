import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Users, GraduationCap, CalendarDays, TrendingUp, TrendingDown, Filter, X, ClipboardCheck, BookOpen, AlertCircle, CheckCircle2, UserPlus, ChevronRight, BarChart3, Clock, MapPin, Activity, Calendar, User, RotateCcw, HandHeart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Legend } from "recharts";
import api from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filterStartMonth, setFilterStartMonth] = useState<string>("all");
  const [filterEndMonth, setFilterEndMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterCentre, setFilterCentre] = useState<string>("all");
  const [filterFellow, setFilterFellow] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");
  const [centreAttendanceFilter, setCentreAttendanceFilter] = useState<string>("all");
  const [centres, setCentres] = useState<any[]>([]);
  const [fellows, setFellows] = useState<any[]>([]);
  const [filterDonor, setFilterDonor] = useState<string>("all");
  const [donors, setDonors] = useState<{ _id: string; name: string; type: string }[]>([]);
  const [sponsorships, setSponsorships] = useState<{ _id: string; donorId: string; fellowId: string; program?: string; status: string }[]>([]);

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
      // Donor data is on protected routes; if it fails the dashboard simply has no donor filter
      Promise.all([api.get("/donors"), api.get("/sponsorships")])
        .then(([dRes, sRes]) => { setDonors(dRes.data); setSponsorships(sRes.data); })
        .catch(() => {});
    }
  }, [user]);

  // Fellows the selected donor funds now, and those it funded before (left / replaced)
  const donorFellows = useMemo(() => {
    if (filterDonor === "all") return null;
    const rows = sponsorships.filter(s => s.donorId === filterDonor);
    const byId = (id: string) => fellows.find(f => f._id === id);
    const pick = (status: (s: string) => boolean) => rows
      .filter(s => status(s.status))
      .map(s => ({ link: s, fellow: byId(s.fellowId) }))
      .filter(r => r.fellow)
      .sort((a, b) => (a.link.program || "").localeCompare(b.link.program || "") || a.fellow.name.localeCompare(b.fellow.name));
    return { current: pick(st => st === "Active"), past: pick(st => st !== "Active") };
  }, [filterDonor, sponsorships, fellows]);
  const donorFellowIds = useMemo(
    () => (donorFellows ? new Set(donorFellows.current.map(r => r.fellow._id as string)) : null),
    [donorFellows]
  );

  const filteredCentres = useMemo(() => {
    if (filterFellow === "all") {
      if (!donorFellowIds) return centres;
      const donorList = fellows.filter(f => donorFellowIds.has(f._id));
      return centres.filter(c =>
        donorList.some(f => (c.fellowIds || []).includes(f._id) || (f.id && (c.fellowIds || []).includes(f.id)) || (f.centreIds || []).includes(c._id))
      );
    }
    return centres.filter(c => 
      (c.fellowIds || []).includes(filterFellow) || 
      (fellows.find(f => (f._id || f.id) === filterFellow)?.centreIds || []).includes(c._id || c.id)
    );
  }, [centres, fellows, filterFellow, donorFellowIds]);

  useEffect(() => {
    if (!user) return;
    const roleParams = user.role === 'fellow' ? `role=fellow&email=${user.email}` : user.role === 'program_manager' ? `role=program_manager&email=${user.email}` : '';
    const dateParams = filterStartMonth !== 'all' && filterEndMonth !== 'all' 
      ? `startMonth=${filterStartMonth}&endMonth=${filterEndMonth}&year=${filterYear}`
      : `month=${filterStartMonth}&year=${filterYear}`;
    const adminParams = isAdmin ? `centreId=${filterCentre}&fellowId=${filterFellow}&donorId=${filterDonor}` : '';
    const modelParams = `type=${filterModel}`;
    const queryString = [roleParams, dateParams, adminParams, modelParams].filter(Boolean).join('&');
    // Ignore responses from requests that a newer filter change has replaced,
    // so a slow older request can never overwrite the latest numbers
    let current = true;
    setStatsLoading(true);
    setStatsError(false);
    api.get(`/dashboard/stats?${queryString}`)
      .then(res => { if (current) setStats(res.data); })
      .catch(() => { if (current) setStatsError(true); })
      .finally(() => { if (current) setStatsLoading(false); });
    return () => { current = false; };
  }, [user, filterStartMonth, filterEndMonth, filterYear, filterCentre, filterFellow, filterModel, filterDonor, reloadKey]);

  const hasActiveFilters = filterStartMonth !== 'all' || filterEndMonth !== 'all' || filterCentre !== 'all' || filterFellow !== 'all' || filterModel !== 'all' || filterDonor !== 'all';
  const selectedDonor = donors.find(d => d._id === filterDonor);

  if (!stats) {
    return (
      <div className="h-[260px] w-full flex flex-col items-center justify-center gap-3 text-center">
        {statsError ? (
          <>
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-semibold">Couldn't load the dashboard</p>
            <Button variant="outline" size="sm" onClick={() => setReloadKey(k => k + 1)}>Try again</Button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground font-medium">Loading dashboard…</p>
          </>
        )}
      </div>
    );
  }

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
              {donors.length > 0 && (
                <Select value={filterDonor} onValueChange={(v) => { setFilterDonor(v); setFilterFellow("all"); setFilterCentre("all"); }}>
                  <SelectTrigger className="h-12 bg-white border border-gray-100 shadow-sm rounded-xl px-3.5 flex items-center justify-start text-left gap-3 w-44 hover:bg-gray-50/50 transition-colors focus:ring-0 [&>span]:w-full">
                    <HandHeart className="h-4 w-4 text-slate-500 shrink-0" />
                    <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                      <span className="text-[10px] font-medium text-slate-500">Donor</span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        <SelectValue placeholder="All Donors" />
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-xs font-semibold">All Donors</SelectItem>
                    {donors.map(d => (
                      <SelectItem key={d._id} value={d._id} className="text-xs">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

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
                  {(() => {
                    const activeFellows = fellows.filter(f => f.status === 'Active' && (!donorFellowIds || donorFellowIds.has(f._id)));
                    const batches = [...new Set(activeFellows.map(f => f.batch || 'Unknown'))].sort();
                    return batches.map(batch => (
                      <SelectGroup key={batch}>
                        <SelectLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-2 pb-1">Batch {batch}</SelectLabel>
                        {activeFellows.filter(f => (f.batch || 'Unknown') === batch).map(f => (
                          <SelectItem key={f._id || f.id} value={f._id || f.id} className="text-xs">{f.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    ));
                  })()}
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
            onClick={() => { setFilterStartMonth('all'); setFilterEndMonth('all'); setFilterCentre('all'); setFilterFellow('all'); setFilterModel('all'); setFilterDonor('all'); }}
          >
            <RotateCcw className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">Reset</span>
          </Button>
        </div>
      </div>

      {statsLoading && (
        <div role="status" aria-live="polite" className="sticky top-2 z-20 mx-auto w-fit flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-lg">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground"></div>
          Updating dashboard…
        </div>
      )}
      {!statsLoading && statsError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />Couldn't update the dashboard. The figures below are from the previous filters.</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setReloadKey(k => k + 1)}>Try again</Button>
        </div>
      )}

      <div aria-busy={statsLoading} className={`space-y-6 transition-opacity duration-200 ${statsLoading ? "opacity-40 pointer-events-none select-none" : ""}`}>
      {/* ===== DONOR FELLOWS (when a donor is selected) ===== */}
      {selectedDonor && donorFellows && (
        <Card className="rounded-2xl border border-amber-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <HandHeart className="h-4 w-4 text-amber-600" />
                {selectedDonor.name}
                <Badge variant="outline" className="text-[10px] font-semibold">{selectedDonor.type}</Badge>
              </CardTitle>
              <span className="text-xs text-muted-foreground font-semibold">
                {donorFellows.current.length} fellow{donorFellows.current.length !== 1 ? "s" : ""} funded now
                {filterFellow !== "all" && (
                  <button type="button" className="ml-2 text-primary hover:underline" onClick={() => { setFilterFellow("all"); setFilterCentre("all"); }}>Show all</button>
                )}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">The figures below cover these fellows' centres. Click a fellow to see only their numbers.</p>
          </CardHeader>
          <CardContent>
            {donorFellows.current.length === 0 ? (
              <p className="text-sm text-muted-foreground">This donor has no fellows linked right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {donorFellows.current.map(({ link, fellow }) => {
                  const replaced = fellow.replacesFellowId ? fellows.find(f => f._id === fellow.replacesFellowId) : null;
                  const selected = filterFellow === fellow._id;
                  return (
                    <button
                      key={link._id}
                      type="button"
                      onClick={() => { setFilterFellow(selected ? "all" : fellow._id); setFilterCentre("all"); }}
                      className={`text-left rounded-xl border p-3 transition-colors ${selected ? "border-primary bg-primary/5" : "border-gray-100 hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate">{fellow.name}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Batch {fellow.batch || "N/A"}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {link.program && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0 font-normal">{link.program}</Badge>}
                        {replaced && <span className="text-[10px] text-muted-foreground">Replacement for {replaced.name}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span><strong className="text-foreground">{fellow.sessionsCompleted ?? 0}</strong> sessions</span>
                        <span><strong className="text-foreground">{fellow.attendanceRate ?? 0}%</strong> attendance</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {donorFellows.past.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-3">
                <span className="font-bold uppercase tracking-widest text-[9px] mr-1">Previously funded:</span>
                {donorFellows.past.map(({ link, fellow }) => {
                  const by = fellow.replacedByFellowId ? fellows.find(f => f._id === fellow.replacedByFellowId) : null;
                  return `${fellow.name}${by ? ` (replaced by ${by.name})` : link.status === "Ended" ? " (ended)" : ""}`;
                }).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Students</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-3xl font-black tracking-tight">{stats.totalStudents}</p>
                <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-bold uppercase tracking-widest">Enrolled</Badge>
              </div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-blue-500" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className={`grid ${(stats.totalUnspecified ?? (stats.totalStudents - ((stats.totalMales || 0) + (stats.totalFemales || 0)))) > 0 ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
              <div>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Males</p>
                <p className="text-base sm:text-lg font-black text-slate-800">{stats.totalMales !== undefined ? stats.totalMales : '-'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-pink-600 uppercase tracking-widest">Females</p>
                <p className="text-base sm:text-lg font-black text-slate-800">{stats.totalFemales !== undefined ? stats.totalFemales : '-'}</p>
              </div>
              {(stats.totalUnspecified ?? (stats.totalStudents - ((stats.totalMales || 0) + (stats.totalFemales || 0)))) > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest" title="Gender not yet recorded in student profile">Not Set</p>
                  <p className="text-base sm:text-lg font-black text-slate-700">
                    {stats.totalUnspecified !== undefined ? stats.totalUnspecified : (stats.totalStudents - ((stats.totalMales || 0) + (stats.totalFemales || 0)))}
                  </p>
                </div>
              )}
            </div>
            {studentChange && (
              <div className={`flex items-center gap-1 mt-3 text-[10px] font-bold ${studentChange.color}`}>
                <studentChange.icon className="h-3 w-3" /> {studentChange.pct}% <span className="text-muted-foreground font-normal">vs last month</span>
              </div>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sessions Logged</p>
              <p className="text-3xl font-black mt-2 tracking-tight">{stats.totalSessions}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-emerald-500" /></div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] font-bold text-success uppercase tracking-widest">Approved</p>
                <p className="text-lg font-black">{stats.totalSessionsApproved !== undefined ? stats.totalSessionsApproved : '-'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-warning uppercase tracking-widest">Pending</p>
                <p className="text-lg font-black">{stats.totalSessionsPending !== undefined ? stats.totalSessionsPending : '-'}</p>
              </div>
            </div>
            {sessionChange && (
              <div className={`flex items-center gap-1 mt-3 text-[10px] font-bold ${sessionChange.color}`}>
                <sessionChange.icon className="h-3 w-3" /> {sessionChange.pct}% <span className="text-muted-foreground font-normal">vs last month</span>
              </div>
            )}
          </div>
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
                    <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider text-[9px]">SEL</th>
                    <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Music</th>
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
                      <td className="py-2.5 px-2 text-center font-bold">{c.selScore} / 5</td>
                      <td className="py-2.5 px-2 text-center font-bold">{c.musicScore} / 5</td>
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
    </div>
  );
};

export default DashboardPage;
