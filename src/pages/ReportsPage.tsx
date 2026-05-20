import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Filter, X, Building2, TrendingUp, ShieldCheck, GraduationCap, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ReportsPage = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterCentre, setFilterCentre] = useState<string>("all");
  const [filterFellow, setFilterFellow] = useState<string>("all");
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

  const exportCSV = () => {
    if (!stats || !stats.centreComparison) return;
    
    const headers = ["Centre Name", "Attendance %", "Learning Score", "Quality Index"];
    const rows = stats.centreComparison.map((c: any) => [
      c.name,
      c.attendance,
      c.learning,
      c.quality
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
    toast.success("CSV report exported successfully");
  };

  if (!stats) return <div className="h-[200px] w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-description font-medium">Monthly performance tracking and data exports</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/5 text-primary">
            <Filter className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5">
            {isAdmin && (
              <>
                <Select value={filterFellow} onValueChange={(v) => { setFilterFellow(v); setFilterCentre("all"); }}>
                  <SelectTrigger className="w-[140px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold">
                    <SelectValue placeholder="All Fellows" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                    <SelectItem value="all" className="rounded-lg text-xs font-bold">All Fellows</SelectItem>
                    {fellows.map(f => <SelectItem key={f._id || f.id} value={f._id || f.id} className="rounded-lg text-xs font-medium">{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filterCentre} onValueChange={setFilterCentre}>
                  <SelectTrigger className="w-[140px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold">
                    <SelectValue placeholder="All Centres" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                    <SelectItem value="all" className="rounded-lg text-xs font-bold">All Centres</SelectItem>
                    {filteredCentresList.map(c => <SelectItem key={c._id || c.id} value={c._id || c.id} className="rounded-lg text-xs font-medium">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[110px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {months.map(m => <SelectItem key={m.value} value={m.value} className="rounded-lg text-xs font-medium">{m.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[80px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {years.map(y => <SelectItem key={y} value={y} className="rounded-lg text-xs font-medium">{y}</SelectItem>)}
              </SelectContent>
            </Select>

            {(filterCentre !== 'all' || filterFellow !== 'all') && (
              <Button variant="ghost" size="icon" onClick={() => { setFilterCentre('all'); setFilterFellow('all'); }} className="h-9 w-9 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all"><X className="h-4 w-4" /></Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Avg Attendance", value: `${stats.avgAttendance}%`, icon: Users, color: "text-blue-600 bg-blue-50" },
          { title: "Learning Score", value: stats.avgScore, icon: GraduationCap, color: "text-purple-600 bg-purple-50" },
          { title: "Assessed Students", value: `${stats.assessmentCoverage}%`, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
          { title: "Total Sessions", value: stats.totalSessions, icon: TrendingUp, color: "text-orange-600 bg-orange-50" },
        ].map((card, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{card.title}</p>
                <p className="text-2xl font-black mt-1">{card.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-md rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-base font-black flex items-center justify-between">
              <span>Attendance vs Learning Comparison</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.centreComparison || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={10} tick={{ fontWeight: 'bold' }} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="attendance" name="Attendance %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="learning" name="Learning Score" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-base font-black">Monthly Progress Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.assessmentTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={10} tick={{ fontWeight: 'bold' }} />
                <YAxis domain={[0, 5]} fontSize={10} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="score" name="Avg Score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 flex flex-row items-center justify-between border-b bg-muted/20">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Performance Summary Matrix</CardTitle>
            <p className="text-xs font-medium text-muted-foreground mt-1">Detailed centre-wise breakdown for {months.find(m => m.value === filterMonth)?.label} {filterYear}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" className="rounded-xl h-10 px-4 font-bold border-muted-foreground/20">
              <Download className="h-4 w-4 mr-2" />CSV Report
            </Button>
            <Button className="rounded-xl h-10 px-4 font-bold" onClick={() => window.print()}>
              <FileText className="h-4 w-4 mr-2" />Print View
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-none">
                <TableHead className="w-[300px] pl-8 font-black uppercase tracking-widest text-[10px]">Centre Name</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Attendance %</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Learning Score</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Quality Index</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(stats.centreComparison || []).map((centre: any, idx: number) => (
                <TableRow key={idx} className="hover:bg-muted/5 transition-colors border-muted/20">
                  <TableCell className="pl-8 py-4">
                    <p className="font-bold text-sm">{centre.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">LTM Operations</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${centre.attendance}%` }} />
                      </div>
                      <span className="text-xs font-bold">{centre.attendance}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-accent" />
                      <span className="text-xs font-bold">{centre.learning} / 5</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={centre.quality > 4 ? "default" : "secondary"} className="rounded-lg text-[10px] font-black uppercase px-2 py-0.5">
                      {centre.quality > 4 ? "Excellent" : centre.quality > 3 ? "Good" : "Average"} ({centre.quality})
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-success">
                      <div className="h-1.5 w-1.5 rounded-full bg-success" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Reported</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
