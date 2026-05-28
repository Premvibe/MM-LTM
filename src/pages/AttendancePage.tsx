import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ClipboardCheck, MapPin, Search, Filter, Users, CalendarDays, CheckCircle2, AlertCircle, Info, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };
type Student = { 
  _id: string; 
  id: string; 
  name: string; 
  age: number; 
  gender: "Male" | "Female"; 
  centreId: any; 
  attendancePercent: number; 
  lastAssessmentScore: number;
  status?: "Active" | "Inactive" | "Left";
  statusHistory?: Array<{ month: number; year: number; status: "Active" | "Inactive" | "Left" }>;
  createdAt?: string;
};
type Fellow = { _id: string; id: string; name: string; email: string };
type Session = { _id: string; id: string; date: string; centreId: string; fellowId: string; topic: string; presentStudentIds: string[] };

const AttendancePage = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCentreId = searchParams.get("centre");
  const setSelectedCentreId = (id: string | null) => {
    if (id) setSearchParams({ centre: id });
    else setSearchParams({});
  };
  const [selected, setSelected] = useState<string[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [centresList, setCentresList] = useState<Centre[]>([]);
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [centreSearchQuery, setCentreSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterFellow, setFilterFellow] = useState("all");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const params = user?.role === 'fellow' 
        ? `?role=fellow&email=${user.email}` 
        : user?.role === 'program_manager' 
          ? `?role=program_manager&email=${user.email}` 
          : '';
      const [studentsRes, centresRes, sessionsRes, fellowsRes] = await Promise.all([
        api.get(`/students${params}`),
        api.get(`/centres${params}`),
        api.get(`/sessions${params}`),
        api.get(`/fellows${params}`)
      ]);
      setStudentsList(studentsRes.data);
      setCentresList(centresRes.data);
      setSessionsList(sessionsRes.data);
      setFellowsList(fellowsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getStatusForMonth = (student: Student, month: number, year: number): "Active" | "Inactive" | "Left" => {
    if (!student.statusHistory || student.statusHistory.length === 0) {
      return student.status || "Active";
    }
    const relevantHistory = student.statusHistory.filter(h => 
      h.year < year || (h.year === year && h.month <= month)
    );
    if (relevantHistory.length === 0) {
      return "Active";
    }
    relevantHistory.sort((a, b) => 
      (b.year - a.year) || (b.month - a.month)
    );
    return relevantHistory[0].status;
  };

  const isEnrolledInMonth = (student: Student, month: number, year: number): boolean => {
    let enrolledMonth = -1;
    let enrolledYear = 9999;

    if (student.createdAt) {
      const d = new Date(student.createdAt);
      enrolledMonth = d.getMonth();
      enrolledYear = d.getFullYear();
    }

    if (student.statusHistory && student.statusHistory.length > 0) {
      const sortedHistory = [...student.statusHistory].sort((a, b) => 
        (a.year - b.year) || (a.month - b.month)
      );
      const earliest = sortedHistory[0];
      if (enrolledYear === 9999 || earliest.year < enrolledYear || (earliest.year === enrolledYear && earliest.month < enrolledMonth)) {
        enrolledYear = earliest.year;
        enrolledMonth = earliest.month;
      }
    }

    if (enrolledYear === 9999) {
      return true;
    }

    return year > enrolledYear || (year === enrolledYear && month >= enrolledMonth);
  };

  const selectedCentre = useMemo(() => centresList.find(c => (c._id || c.id) === selectedCentreId), [centresList, selectedCentreId]);
  
  const centreStudents = useMemo(() => {
    if (!selectedCentreId) return [];
    const date = new Date(attendanceDate);
    const m = date.getMonth();
    const y = date.getFullYear();
    return studentsList.filter(s => 
      ((s.centreId?._id || s.centreId) === selectedCentreId) &&
      isEnrolledInMonth(s, m, y) &&
      getStatusForMonth(s, m, y) === "Active"
    );
  }, [studentsList, selectedCentreId, attendanceDate]);
  const sessionForDate = useMemo(() => sessionsList.find(s => s.date === attendanceDate && (s.centreId === selectedCentreId || s.centreId === selectedCentre?.id)), [sessionsList, attendanceDate, selectedCentreId, selectedCentre]);

  useEffect(() => {
    if (sessionForDate) {
      setSelected(sessionForDate.presentStudentIds || []);
    } else {
      setSelected([]);
    }
  }, [sessionForDate]);

  const handleSaveAttendance = async () => {
    const d = new Date(attendanceDate).getDay();
    if (d !== 1 && d !== 3 && d !== 5) {
      toast.error("Attendance can only be marked for Monday, Wednesday, or Friday");
      return;
    }
    
    try {
      setLoading(true);
      await api.put(`/sessions/${sessionForDate?._id}`, {
        presentStudentIds: selected,
        studentsPresent: selected.length
      });
      toast.success(`Attendance saved for ${selected.length} students`); 
      fetchData();
    } catch (error) {
      toast.error("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  if (loading && centresList.length === 0) {
    return <div className="h-[200px] w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!selectedCentreId) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Attendance Registry</h1>
            <p className="page-description uppercase tracking-[0.2em] text-[10px]">Daily student log & monthly stability matrix</p>
          </div>
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
             <CalendarDays className="h-4 w-4 text-primary/40 ml-3" />
             <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-[150px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
            <Input 
              placeholder="Find centre by name or location..." 
              className="pl-10 h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs" 
              value={centreSearchQuery} 
              onChange={(e) => setCentreSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterFellow} onValueChange={setFilterFellow}>
              <SelectTrigger className="h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs w-[130px] md:w-[180px]"><SelectValue placeholder="All Fellows" /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">All Fellows</SelectItem>
                {fellowsList.map(f => <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs w-[110px] md:w-[150px]"><SelectValue placeholder="Centre Type" /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="In-school">In-school</SelectItem>
                <SelectItem value="After-school">After-school</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {centresList
            .filter(c => {
              const assignedFellows = c.fellowIds.map(fid => fellowsList.find(f => f._id === fid || f.id === fid)?.name || "").join(" ").toLowerCase();
              const matchesSearch = c.name.toLowerCase().includes(centreSearchQuery.toLowerCase()) || 
                                   c.location.toLowerCase().includes(centreSearchQuery.toLowerCase()) ||
                                   assignedFellows.includes(centreSearchQuery.toLowerCase());
              const matchesType = filterType === "all" || c.type === filterType;
              const matchesFellow = filterFellow === "all" || c.fellowIds.includes(filterFellow);
              return matchesSearch && matchesType && matchesFellow;
            })
            .map(centre => {
              const count = studentsList.filter(s => (s.centreId?._id || s.centreId) === (centre._id || centre.id)).length;
              const avgAttendance = count > 0 ? Math.round(studentsList.filter(s => (s.centreId?._id || s.centreId) === (centre._id || centre.id)).reduce((sum, s) => sum + s.attendancePercent, 0) / count) : 0;
              const cId = centre._id || centre.id;
              
              return (
                <Card 
                  key={cId} 
                  className="glass-card-premium border-none hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => { setSelectedCentreId(cId); setSelected([]); }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-black tracking-tight">{centre.name}</CardTitle>
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <MapPin className="h-3 w-3" />{centre.location}
                          </div>
                        </div>
                      </div>
                      <Badge variant={centre.type === "In-school" ? "default" : "secondary"} className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest h-fit">{centre.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between border-t border-primary/5 pt-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <Users className="h-3 w-3" />
                          <span>{count} Students Registry</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-primary">
                          <ClipboardCheck className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{avgAttendance}% AVG Stability</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                        {centre.fellowIds?.map(fid => {
                          const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
                          return fellow ? (
                            <Badge key={fid} variant="outline" className="text-[8px] font-black uppercase py-0 h-4 border-primary/10 bg-primary/5 text-primary/60">{fellow.name}</Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCentreId(null)} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm hover:bg-primary hover:text-white transition-all shrink-0">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-3xl font-[950] tracking-tighter text-foreground">{selectedCentre?.name}</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1 uppercase tracking-widest text-[10px]">
              <CalendarDays className="h-3 w-3" />
              Roster: {new Date(attendanceDate).toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
          </div>
        </div>
        <Button
          className="w-full sm:w-auto rounded-2xl h-12 md:h-14 px-8 md:px-10 font-[950] uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          disabled={selected.length === 0 || !sessionForDate || loading}
          onClick={handleSaveAttendance}
        >
          {loading ? "Syncing..." : `Sync Attendance (${selected.length})`}
        </Button>
      </div>

      <Tabs defaultValue="mark" className="w-full">
        <TabsList className="mb-8 p-1.5 bg-white/50 backdrop-blur-xl rounded-[1.5rem] border border-white/20 shadow-xl h-14">
          <TabsTrigger value="mark" className="rounded-xl h-10 px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Mark Attendance</TabsTrigger>
          <TabsTrigger value="sheet" className="rounded-xl h-10 px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Day-wise Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Student Roster</CardTitle>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Found {centreStudents.length} students</p>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search name..." 
                    className="pl-9 h-9 rounded-xl bg-white border-none text-[10px] font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {!sessionForDate ? (
                  <div className="py-20 text-center space-y-6">
                    <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto animate-pulse">
                      <AlertCircle className="h-10 w-10 text-warning" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-black tracking-tight">Session Required</p>
                      <p className="text-sm text-muted-foreground max-w-[300px] mx-auto font-medium">Please log a program session for this date before marking student attendance.</p>
                    </div>
                    <Button variant="outline" className="rounded-xl font-black uppercase tracking-widest text-[10px] px-8 h-10 border-primary/20 text-primary" onClick={() => window.location.href = '/sessions'}>Go to Sessions Hub</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 p-2 max-h-[60vh] overflow-y-auto pr-4">
                    {centreStudents
                      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(s => (
                      <div 
                        key={s._id} 
                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer group ${selected.includes(s._id) ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : 'border-muted bg-white hover:border-primary/30'}`} 
                        onClick={() => toggle(s._id)}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox checked={selected.includes(s._id)} onCheckedChange={() => toggle(s._id)} className="h-5 w-5 rounded-md" />
                          <div>
                            <p className={`font-black text-sm tracking-tight ${selected.includes(s._id) ? 'text-primary' : 'text-foreground'}`}>{s.name}</p>
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-0.5">Age {s.age} · {s.gender}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase px-2 py-0.5 bg-muted/50 border-none group-hover:bg-primary/10 group-hover:text-primary transition-colors">{s.attendancePercent}% Stability</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-primary text-white overflow-hidden p-8 relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><CalendarDays className="h-32 w-32" /></div>
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Selected Date</label>
                    <Input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="bg-white/10 border-none h-14 rounded-2xl text-xl font-black text-white focus-visible:ring-white/20 transition-all cursor-pointer"
                    />
                  </div>
                  {sessionForDate && (
                    <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Active Session</p>
                       <p className="font-black text-sm tracking-tight">{sessionForDate.topic}</p>
                    </div>
                  )}
                  <div className="pt-4 space-y-3">
                    <Button 
                      variant="secondary" 
                      className="w-full rounded-xl h-12 font-black uppercase tracking-widest text-[10px] bg-white text-primary hover:bg-white/90"
                      onClick={() => setSelected(centreStudents.map(s => s._id))}
                    >
                      Mark All Present
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full rounded-xl h-12 font-black uppercase tracking-widest text-[10px] text-white/70 hover:text-white hover:bg-white/10"
                      onClick={() => setSelected([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-[2.5rem] p-8 flex flex-col items-center text-center justify-center space-y-4">
                 <div className="h-20 w-20 rounded-full border-4 border-primary/10 flex items-center justify-center">
                    <p className="text-3xl font-[950] tracking-tighter text-primary">{selected.length}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Students Present</p>
                    <p className="text-sm font-bold text-muted-foreground/40">Out of {centreStudents.length} enrolled</p>
                 </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sheet" className="mt-0">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Monthly Stability Matrix</CardTitle>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Detailed day-wise audit</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="rounded-xl px-4 py-2 bg-white font-black text-[10px] uppercase tracking-widest h-10 border-primary/10 text-primary">
                  {new Date(attendanceDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky left-0 bg-muted/95 backdrop-blur-md z-20 border-r border-white/50 w-[240px]">Student Identity</th>
                      {Array.from({ length: new Date(new Date(attendanceDate).getFullYear(), new Date(attendanceDate).getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(d => (
                        <th key={d} className="px-3 py-6 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground min-w-[45px]">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {centreStudents.map(s => (
                      <tr key={s._id} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-8 py-5 sticky left-0 bg-white group-hover:bg-primary/5 transition-colors border-r border-white/50 z-10">
                           <p className="font-black text-sm tracking-tight group-hover:text-primary transition-colors">{s.name}</p>
                           <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">{s.gender}</p>
                        </td>
                        {Array.from({ length: new Date(new Date(attendanceDate).getFullYear(), new Date(attendanceDate).getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(d => {
                          const dateStr = `${new Date(attendanceDate).getFullYear()}-${String(new Date(attendanceDate).getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const daySession = sessionsList.find(sess => sess.date === dateStr && (sess.centreId === selectedCentreId || sess.centreId === selectedCentre?._id || sess.centreId === selectedCentre?.id));
                          
                          let icon = null;
                          let bgColor = "bg-muted/10";
                          
                          if (daySession) {
                            const isPresent = daySession.presentStudentIds?.includes(s._id);
                            icon = isPresent ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
                            bgColor = isPresent ? "bg-success/5" : "bg-destructive/5";
                          }
                          
                          return (
                            <td key={d} className={`px-2 py-4 text-center transition-all ${bgColor}`}>
                               <div className="flex items-center justify-center h-8 w-8 mx-auto rounded-lg">
                                  {icon || <span className="text-[10px] font-black text-muted-foreground/20">-</span>}
                               </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendancePage;;
