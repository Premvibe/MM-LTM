import { useState, useEffect, useMemo, useRef } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ClipboardCheck, MapPin, Search, Filter, Users, CalendarDays, CheckCircle2, AlertCircle, Info, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { compareStudentsByClassAndName } from "@/lib/utils";

type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };
type Fellow = { _id: string; id?: string; name: string; email?: string; phone?: string; centreIds?: string[]; sessionsCompleted?: number; attendanceRate?: number };
type Student = { 
  _id: string; 
  id: string; 
  name: string; 
  age?: number; 
  gender?: "Male" | "Female"; 
  centreId: any; 
  grade?: string;
  section?: string;
  attendancePercent: number; 
  lastAssessmentScore: number;
  status?: "Active" | "Inactive" | "Left";
  statusHistory?: Array<{ month: number; year: number; status: "Active" | "Inactive" | "Left" }>;
  createdAt?: string;
};
type Session = { 
  _id: string; 
  id: string; 
  date: string; 
  centreId: string; 
  fellowId: string; 
  topic: string; 
  duration?: number;
  presentStudentIds: string[]; 
  reviewNote?: string;
  approvalStatus?: string;
};

const getStudentDetails = (s: Student) => {
  const parts: string[] = [];
  if (s.age) parts.push(`Age ${s.age}`);
  if (s.gender) parts.push(s.gender);
  if (s.grade || s.section) {
    parts.push(`Class ${s.grade || ''}${s.section ? `-${s.section}` : ''}`.trim());
  }
  return parts.length > 0 ? parts.join(" · ") : "Learner";
};

const AttendancePage = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCentreId = searchParams.get("centre");
  const setSelectedCentreId = (id: string | null) => {
    if (id) setSearchParams({ centre: id });
    else setSearchParams({});
  };
  const [selected, setSelected] = useState<string[]>([]);
  const [reviewNote, setReviewNote] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [centresList, setCentresList] = useState<Centre[]>([]);
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
  const [loading, setLoading] = useState(true);
  const isSavingAttendanceRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [centreSearchQuery, setCentreSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterFellow, setFilterFellow] = useState("all");

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

  const handleMonthChange = (m: string, y: string) => {
    setFilterMonth(m);
    const monthNum = parseInt(m);
    const yearNum = parseInt(y);
    const today = new Date();
    if (today.getMonth() === monthNum && today.getFullYear() === yearNum) {
      setAttendanceDate(today.toISOString().split("T")[0]);
    } else {
      setAttendanceDate(`${y}-${String(monthNum + 1).padStart(2, '0')}-01`);
    }
  };

  const handleYearChange = (m: string, y: string) => {
    setFilterYear(y);
    const monthNum = parseInt(m);
    const yearNum = parseInt(y);
    const today = new Date();
    if (today.getMonth() === monthNum && today.getFullYear() === yearNum) {
      setAttendanceDate(today.toISOString().split("T")[0]);
    } else {
      setAttendanceDate(`${y}-${String(monthNum + 1).padStart(2, '0')}-01`);
    }
  };

  const handleAttendanceDateChange = (newDateStr: string) => {
    setAttendanceDate(newDateStr);
    if (newDateStr) {
      const d = new Date(newDateStr);
      if (!isNaN(d.getTime())) {
        setFilterMonth(d.getMonth().toString());
        setFilterYear(d.getFullYear().toString());
      }
    }
  };

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
      setSessionsList((sessionsRes.data || []).filter((s: Session) => s.approvalStatus !== 'rejected'));
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
    ).sort(compareStudentsByClassAndName);
  }, [studentsList, selectedCentreId, attendanceDate]);
  const sessionForDate = useMemo(() => sessionsList.find(s => 
    s.date === attendanceDate && 
    (s.centreId === selectedCentreId || s.centreId === selectedCentre?.id) &&
    s.approvalStatus !== 'rejected'
  ), [sessionsList, attendanceDate, selectedCentreId, selectedCentre]);

  const pendingAttendanceSessions = useMemo(() => {
    if (!selectedCentreId) return [];
    return sessionsList
      .filter(s => 
        (s.centreId === selectedCentreId || s.centreId === selectedCentre?.id) &&
        s.approvalStatus !== 'rejected' &&
        (!s.presentStudentIds || s.presentStudentIds.length === 0)
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [sessionsList, selectedCentreId, selectedCentre]);

  useEffect(() => {
    if (sessionForDate) {
      setSelected(sessionForDate.presentStudentIds || []);
      setReviewNote(sessionForDate.reviewNote || "");
    } else {
      setSelected([]);
      setReviewNote("");
    }
  }, [sessionForDate]);

  const handleSaveAttendance = async () => {
    if (isSavingAttendanceRef.current || loading) return;
    const dateObj = new Date(attendanceDate);
    const day = dateObj.getDay();
    if (day !== 1 && day !== 3 && day !== 5 && day !== 6) {
      toast.error("Attendance can only be marked for Monday, Wednesday, Friday, or Saturday");
      return;
    }
    
    isSavingAttendanceRef.current = true;
    try {
      setLoading(true);
      await api.post(`/sessions/${sessionForDate?._id}/attendance`, {
        presentStudentIds: selected,
        studentsPresent: selected.length,
        reviewNote: reviewNote.trim()
      });
      toast.success(`Attendance saved for ${selected.length} students`); 
      fetchData();
    } catch (error) {
      toast.error("Failed to save attendance");
    } finally {
      isSavingAttendanceRef.current = false;
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
          <div className="flex flex-wrap items-center gap-2 bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/5 text-primary">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Period</span>
            </div>
            <Select value={filterMonth} onValueChange={(m) => handleMonthChange(m, filterYear)}>
              <SelectTrigger className="w-[125px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value} className="rounded-lg text-xs font-medium">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={(y) => handleYearChange(filterMonth, y)}>
              <SelectTrigger className="w-[85px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {years.map(y => (
                  <SelectItem key={y} value={y} className="rounded-lg text-xs font-medium">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              const cId = centre._id || centre.id;
              const activeStudentsInMonth = studentsList.filter(s => 
                (s.centreId?._id || s.centreId) === cId &&
                isEnrolledInMonth(s, parseInt(filterMonth), parseInt(filterYear)) &&
                getStatusForMonth(s, parseInt(filterMonth), parseInt(filterYear)) === "Active"
              );
              const count = activeStudentsInMonth.length;

              const centreMonthSessions = sessionsList.filter(s => {
                const isCentre = (s.centreId === centre._id || s.centreId === centre.id);
                if (!isCentre || !s.date) return false;
                const d = new Date(s.date);
                return d.getMonth() === parseInt(filterMonth) && d.getFullYear() === parseInt(filterYear);
              });

              let avgAttendance = 0;
              if (centreMonthSessions.length > 0 && activeStudentsInMonth.length > 0) {
                let totalPresent = 0;
                centreMonthSessions.forEach(sess => {
                  const presentIds = sess.presentStudentIds || [];
                  totalPresent += activeStudentsInMonth.filter(s => presentIds.includes(s._id)).length;
                });
                avgAttendance = Math.round((totalPresent / (centreMonthSessions.length * activeStudentsInMonth.length)) * 100);
              } else if (activeStudentsInMonth.length > 0) {
                avgAttendance = Math.round(activeStudentsInMonth.reduce((sum, s) => sum + (s.attendancePercent || 0), 0) / activeStudentsInMonth.length);
              }
              
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
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSelectedCentreId(null)} 
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-white shadow-sm hover:bg-primary hover:text-white transition-all shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-[950] tracking-tight text-foreground">{selectedCentre?.name}</h1>
              <Badge variant={selectedCentre?.type === "In-school" ? "default" : "secondary"} className="rounded-full text-[9px] uppercase tracking-widest font-black">
                {selectedCentre?.type}
              </Badge>
            </div>
            <p className="text-muted-foreground font-semibold flex items-center gap-2 mt-0.5 text-xs">
              <MapPin className="h-3 w-3 text-primary/60" />
              {selectedCentre?.location || "Learning Centre"} · {centreStudents.length} Active Students
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <Button
            className="w-full sm:w-auto rounded-xl h-11 px-6 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            disabled={selected.length === 0 || !sessionForDate || loading}
            onClick={handleSaveAttendance}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : `Save Attendance (${selected.length})`}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mark" className="w-full">
        <TabsList className="mb-6 p-1.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-sm h-12">
          <TabsTrigger value="mark" className="rounded-xl h-9 px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Mark Attendance</TabsTrigger>
          <TabsTrigger value="sheet" className="rounded-xl h-9 px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Day-wise Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* LEFT 2 COLUMNS: Student Roster Card */}
            <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg font-black uppercase tracking-tight">Student Roster</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary bg-primary/5">
                      {selected.length} / {centreStudents.length} Present
                    </Badge>
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground mt-0.5">Click any student to toggle attendance</p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Search student..." 
                      className="pl-9 h-9 rounded-xl bg-white border border-gray-200 text-xs font-semibold focus-visible:ring-primary/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {sessionForDate && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button 
                        size="sm"
                        variant="outline" 
                        className="rounded-xl h-9 text-[10px] font-black uppercase tracking-wider px-3 border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => setSelected(centreStudents.map(s => s._id))}
                      >
                        All Present
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost" 
                        className="rounded-xl h-9 text-[10px] font-black uppercase tracking-wider px-3 text-muted-foreground hover:bg-gray-100"
                        onClick={() => setSelected([])}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6">
                {!sessionForDate ? (
                  <div className="py-16 text-center space-y-5">
                    <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto">
                      <AlertCircle className="h-8 w-8 text-amber-600" />
                    </div>
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <p className="text-base font-black tracking-tight text-foreground">No Session on this Date</p>
                      <p className="text-xs text-muted-foreground font-medium">Please select a pending session from the sidebar or pick another date with a logged session.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-xl font-black uppercase tracking-widest text-[10px] px-6 h-10 border-primary/20 text-primary hover:bg-primary/5" 
                      onClick={() => window.location.href = '/sessions'}
                    >
                      Go to Sessions Hub
                    </Button>
                  </div>
                ) : centreStudents.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <p className="text-sm font-bold text-muted-foreground">No active students enrolled in this centre for this month.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {centreStudents
                      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(s => {
                        const isPresent = selected.includes(s._id);
                        return (
                          <div 
                            key={s._id} 
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none group ${
                              isPresent 
                                ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/5 ring-1 ring-primary/20' 
                                : 'border-gray-200/80 bg-white hover:border-primary/30 hover:bg-gray-50/50'
                            }`} 
                            onClick={() => toggle(s._id)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Checkbox 
                                checked={isPresent} 
                                onCheckedChange={() => toggle(s._id)} 
                                className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                              />
                              <div className="min-w-0">
                                <p className={`font-black text-xs sm:text-sm tracking-tight truncate ${isPresent ? 'text-primary' : 'text-foreground'}`}>
                                  {s.name}
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider truncate mt-0.5">
                                  {getStudentDetails(s)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <Badge 
                                variant="secondary" 
                                className={`rounded-lg text-[9px] font-black uppercase px-2 py-0.5 border-none transition-colors ${
                                  isPresent 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {isPresent ? "Present" : "Absent"}
                              </Badge>
                              <span className="text-[10px] font-bold text-muted-foreground/60 hidden sm:inline">
                                {s.attendancePercent}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RIGHT COLUMN: Session Details & Pending Sessions */}
            <div className="space-y-5 sticky top-24">
              {/* Date & Active Session Card */}
              <Card className="border border-gray-100 shadow-sm rounded-3xl overflow-hidden bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> Session Date
                  </span>
                  {sessionForDate ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold uppercase tracking-wider">
                      Session Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 text-[9px] font-bold uppercase tracking-wider">
                      No Session
                    </Badge>
                  )}
                </div>

                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => handleAttendanceDateChange(e.target.value)}
                  className="h-11 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-foreground focus-visible:ring-primary/20 cursor-pointer"
                />

                {sessionForDate ? (
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/70">Topic</span>
                    <p className="font-black text-sm tracking-tight text-foreground">{sessionForDate.topic}</p>
                    {sessionForDate.duration && (
                      <p className="text-[10px] font-bold text-muted-foreground">{sessionForDate.duration} mins session</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/50 text-[11px] font-bold text-amber-800">
                    No session logged on this date. Select a pending session below or change the date.
                  </div>
                )}

                {/* Attendance live counter bar */}
                <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <span className="font-black text-primary">
                      {centreStudents.length > 0 ? Math.round((selected.length / centreStudents.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${centreStudents.length > 0 ? Math.round((selected.length / centreStudents.length) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground text-center">
                    {selected.length} of {centreStudents.length} students marked present
                  </p>
                </div>

                {sessionForDate && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Review Note (Optional)
                    </Label>
                    <Textarea
                      placeholder="Add session reflections, observations, or remarks..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      className="rounded-xl border border-gray-200 text-xs placeholder:text-muted-foreground/50 focus-visible:ring-primary/20 min-h-[70px] resize-none"
                    />
                  </div>
                )}
              </Card>

              {/* Pending Attendance Sessions Card */}
              {pendingAttendanceSessions.length > 0 && (
                <Card className="border border-gray-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="p-4 pb-2 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        Pending Attendance ({pendingAttendanceSessions.length})
                      </CardTitle>
                      <span className="text-[10px] font-bold text-muted-foreground/60">Click to switch</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-1.5 max-h-[300px] overflow-y-auto">
                    {pendingAttendanceSessions.map(s => {
                      const sessionDate = new Date(s.date);
                      const dayName = sessionDate.toLocaleDateString("en-IN", { weekday: "short" });
                      const dateStr = sessionDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                      const isSelected = s.date === attendanceDate;
                      return (
                        <div
                          key={s._id}
                          onClick={() => handleAttendanceDateChange(s.date)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-xs font-bold' 
                              : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/60 hover:border-gray-200'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-black tracking-tight truncate text-foreground">{s.topic}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{dayName} · {dateStr}</p>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-wider border-amber-300 text-amber-700 bg-amber-50 shrink-0">
                            No Attendance
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sheet" className="mt-0">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Monthly Stability Matrix</CardTitle>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Detailed day-wise audit</p>
              </div>
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-primary/10 shadow-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/5 text-primary">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Period</span>
                </div>
                <Select value={filterMonth} onValueChange={(m) => handleMonthChange(m, filterYear)}>
                  <SelectTrigger className="w-[125px] h-9 rounded-xl bg-white border-none shadow-sm text-xs font-bold">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                    {months.map(m => (
                      <SelectItem key={m.value} value={m.value} className="rounded-lg text-xs font-medium">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={(y) => handleYearChange(filterMonth, y)}>
                  <SelectTrigger className="w-[85px] h-9 rounded-xl bg-white border-none shadow-sm text-xs font-bold">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                    {years.map(y => (
                      <SelectItem key={y} value={y} className="rounded-lg text-xs font-medium">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky left-0 bg-muted/95 backdrop-blur-md z-20 border-r border-white/50 w-[240px]">Student Identity</th>
                      {Array.from({ length: new Date(parseInt(filterYear), parseInt(filterMonth) + 1, 0).getDate() }, (_, i) => i + 1).map(d => (
                        <th key={d} className="px-3 py-6 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground min-w-[45px]">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {centreStudents.map(s => (
                      <tr key={s._id} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-8 py-5 sticky left-0 bg-white group-hover:bg-primary/5 transition-colors border-r border-white/50 z-10">
                           <p className="font-black text-sm tracking-tight group-hover:text-primary transition-colors">{s.name}</p>
                           <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">{getStudentDetails(s)}</p>
                        </td>
                        {Array.from({ length: new Date(parseInt(filterYear), parseInt(filterMonth) + 1, 0).getDate() }, (_, i) => i + 1).map(d => {
                          const dateStr = `${filterYear}-${String(parseInt(filterMonth) + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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

export default AttendancePage;
