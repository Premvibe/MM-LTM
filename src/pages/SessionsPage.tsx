import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, CalendarDays, Clock, Users, Pencil, ArrowLeft, MapPin, Search, Filter, Trash2, X, ClipboardCheck, CheckCircle2, Building2, Truck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload, DriveFile } from "@/components/ui/file-upload";
import { FileGallery } from "@/components/ui/file-gallery";

type Session = { _id: string; id: string; date: string; centreId: string; fellowId: string; topic: string; duration: number; activities: string[]; studentsPresent: number; sessionPlanLink?: string; documentationLink?: string; files?: DriveFile[]; presentStudentIds?: string[]; isMusicBus?: boolean; observations?: string; issues?: string; createdAt?: string; };
type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };
type Fellow = { _id: string; id: string; name: string; email: string; phone: string; centreIds: string[]; sessionsCompleted: number; attendanceRate: number };

const formatDateDMY = (dateStr?: string) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y.slice(-2)}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const SessionsPage = () => {
  const { user, isAdmin, isSuperAdmin, isMEManager } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [centresList, setCentresList] = useState<Centre[]>([]);
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  const months = [
    { value: "0", label: "January" }, { value: "1", label: "February" }, { value: "2", label: "March" },
    { value: "3", label: "April" }, { value: "4", label: "May" }, { value: "5", label: "June" },
    { value: "6", label: "July" }, { value: "7", label: "August" }, { value: "8", label: "September" },
    { value: "9", label: "October" }, { value: "10", label: "November" }, { value: "11", label: "December" },
  ];

  const years = ["2023", "2024", "2025", "2026"];

  const selectedCentreId = searchParams.get("centre");
  const setSelectedCentreId = (id: string | null) => {
    if (id) setSearchParams({ centre: id });
    else setSearchParams({});
  };

  const [open, setOpen] = useState(false);
  const [documentationLink, setDocumentationLink] = useState("");
  const [editItem, setEditItem] = useState<Session | null>(null);
  const [topic, setTopic] = useState("");
  const [centreId, setCentreId] = useState("");
  const [fellowId, setFellowId] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionPlanLink, setSessionPlanLink] = useState("");
  const [isMusicBus, setIsMusicBus] = useState(false);
  const [observations, setObservations] = useState("");
  const [issues, setIssues] = useState("");
  const [sessionFiles, setSessionFiles] = useState<DriveFile[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [checkedStudentIds, setCheckedStudentIds] = useState<string[]>([]);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewPlanText, setViewPlanText] = useState<string | null>(null);
  const [centreSearchQuery, setCentreSearchQuery] = useState("");
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCentreFellow, setFilterCentreFellow] = useState("all");

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear]);

  useEffect(() => {
    if (!editItem) {
      const today = new Date();
      const isCurrentPeriod = today.getMonth().toString() === filterMonth && today.getFullYear().toString() === filterYear;
      if (isCurrentPeriod) {
        setDate(today.toISOString().split("T")[0]);
      } else {
        const monthNum = parseInt(filterMonth);
        const yearNum = parseInt(filterYear);
        const formattedMonth = String(monthNum + 1).padStart(2, "0");
        setDate(`${yearNum}-${formattedMonth}-01`);
      }
    }
  }, [filterMonth, filterYear, editItem]);

  const fetchData = async () => {
    try {
      const params = user?.role === 'fellow' 
        ? `&role=fellow&email=${user.email}` 
        : user?.role === 'program_manager' 
          ? `&role=program_manager&email=${user.email}` 
          : '';
      const paramsQuery = user?.role === 'fellow' 
        ? `?role=fellow&email=${user.email}` 
        : user?.role === 'program_manager' 
          ? `?role=program_manager&email=${user.email}` 
          : '';
      const dateParams = `?month=${filterMonth}&year=${filterYear}`;
      const [sessionsRes, centresRes, fellowsRes, studentsRes] = await Promise.all([
        api.get(`/sessions${dateParams}${params}`),
        api.get(`/centres${paramsQuery}`),
        api.get(`/fellows${paramsQuery}`),
        api.get(`/students${paramsQuery}`)
      ]);
      setSessionsList(sessionsRes.data);
      setCentresList(centresRes.data);
      setFellowsList(fellowsRes.data);
      setStudentsList(studentsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { 
    setTopic(""); 
    setCentreId(""); 
    setFellowId(user?.role === 'fellow' ? user.id : ""); 
    setDuration(""); 
    
    const today = new Date();
    const isCurrentPeriod = today.getMonth().toString() === filterMonth && today.getFullYear().toString() === filterYear;
    if (isCurrentPeriod) {
      setDate(today.toISOString().split("T")[0]);
    } else {
      const monthNum = parseInt(filterMonth);
      const yearNum = parseInt(filterYear);
      const formattedMonth = String(monthNum + 1).padStart(2, "0");
      setDate(`${yearNum}-${formattedMonth}-01`);
    }

    setSessionPlanLink(""); 
    setDocumentationLink(""); 
    setIsMusicBus(false);
    setObservations("");
    setIssues("");
    setSessionFiles([]);
    setEditItem(null); 
  };

  const openEdit = (session: Session) => {
    setEditItem(session); 
    setTopic(session.topic); 
    setCentreId(session.centreId); 
    setFellowId(session.fellowId); 
    setDuration(String(session.duration)); 
    setDate(session.date); 
    setSessionPlanLink(session.sessionPlanLink || ""); 
    setDocumentationLink(session.documentationLink || "");    
    setIsMusicBus(session.isMusicBus || false);
    setObservations(session.observations || "");
    setIssues(session.issues || "");
    setSessionFiles(session.files || []);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await api.delete(`/sessions/${id}`);
      toast.success("Session deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  const handleSubmit = async () => {
    const finalFellowId = user?.role === 'fellow' ? user.id : fellowId;
    if (!date || !topic.trim() || !finalFellowId || !duration) { toast.error("Please fill in all fields including date"); return; }
    
    const sessionDate = new Date(date);
    if (sessionDate) {
      const day = sessionDate.getDay();
      if (day !== 1 && day !== 3 && day !== 5 && day !== 6) {
        toast.error("Sessions can only be scheduled on Monday, Wednesday, Friday, or Saturday");
        return;
      }
    }

    const targetCentreId = selectedCentreId || centreId;
    if (!targetCentreId) { toast.error("Please select a centre"); return; }

    const sessionData = { date, centreId: targetCentreId, fellowId: finalFellowId, topic: topic.trim(), duration: parseInt(duration), sessionPlanLink: sessionPlanLink.trim(), documentationLink: documentationLink.trim(), files: sessionFiles, isMusicBus, observations: isMusicBus ? observations.trim() : "", issues: isMusicBus ? issues.trim() : "" };

    try {
      if (editItem) {
        await api.put(`/sessions/${editItem._id}`, sessionData);
        toast.success("Session updated successfully");
      } else {
        await api.post("/sessions", { ...sessionData, activities: [], studentsPresent: 0 });
        toast.success("Session logged successfully");
      }
      fetchData();
      resetForm(); 
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save session");
    }
  };

  const handleSaveAttendance = async () => {
    if (!activeSession) return;
    setIsSubmittingAttendance(true);
    try {
      await api.post(`/sessions/${activeSession._id}/attendance`, {
        presentStudentIds: checkedStudentIds
      });
      toast.success("Attendance updated successfully");
      setAttendanceOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to update attendance");
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const openAttendance = (session: Session) => {
    setActiveSession(session);
    setCheckedStudentIds(session.presentStudentIds || []);
    setAttendanceSearchQuery("");
    setAttendanceOpen(true);
  };

  const selectedCentre = useMemo(() => centresList.find(c => (c._id || c.id) === selectedCentreId), [centresList, selectedCentreId]);
  const centreSessionsList = useMemo(() => selectedCentreId ? sessionsList.filter(s => {
    const matchesCentre = s.centreId === selectedCentreId || (s.centreId as any)?._id === selectedCentreId;
    if (!matchesCentre) return false;
    const d = new Date(s.date);
    return d.getMonth() === parseInt(filterMonth) && d.getFullYear() === parseInt(filterYear);
  }) : [], [sessionsList, selectedCentreId, filterMonth, filterYear]);

  if (!selectedCentreId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Sessions Log</h1>
            <p className="page-description uppercase tracking-[0.2em] text-[10px]">LTM Program Quality & Student Attendance Tracker</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/5 text-primary">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Period</span>
            </div>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[120px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {months.map(m => <SelectItem key={m.value} value={m.value} className="rounded-lg text-xs font-medium">{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[85px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {years.map(y => <SelectItem key={y} value={y} className="rounded-lg text-xs font-medium">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
            <Input 
              placeholder="Find centre by name or fellow..." 
              className="pl-10 h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs" 
              value={centreSearchQuery} 
              onChange={(e) => setCentreSearchQuery(e.target.value)} 
            />
          </div>
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 min-w-0 w-full sm:w-auto sm:min-w-[150px]">
              <Select value={filterCentreFellow} onValueChange={setFilterCentreFellow}>
                <SelectTrigger className="h-11 rounded-2xl border-none shadow-sm bg-white"><SelectValue placeholder="Fellow" /></SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all">All Fellows</SelectItem>
                  {fellowsList.map(f => <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {centresList
            .filter(c => {
              const assignedFellows = c.fellowIds.map(fid => fellowsList.find(f => f._id === fid || f.id === fid)?.name || "").join(" ").toLowerCase();
              const matchesSearch = c.name.toLowerCase().includes(centreSearchQuery.toLowerCase()) || 
                                   c.location.toLowerCase().includes(centreSearchQuery.toLowerCase()) ||
                                   assignedFellows.includes(centreSearchQuery.toLowerCase());
              const matchesType = filterType === "all" || c.type === filterType;
              const matchesFellow = filterCentreFellow === "all" || c.fellowIds.includes(filterCentreFellow);
              return matchesSearch && matchesType && matchesFellow;
            })
            .map(centre => {
              const sessionsCount = sessionsList.filter(s => {
                const matchesCentre = ((s.centreId as any)?._id || s.centreId) === (centre._id || centre.id);
                if (!matchesCentre) return false;
                const d = new Date(s.date);
                return d.getMonth() === parseInt(filterMonth) && d.getFullYear() === parseInt(filterYear);
              }).length;
              const studentCount = studentsList.filter(s => ((s.centreId as any)?._id || s.centreId) === (centre._id || centre.id)).length;
              const cId = centre._id || centre.id;
              
              return (
                <Card 
                  key={cId} 
                  className="glass-card-premium border-none hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => setSelectedCentreId(cId)}
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
                          <span>{studentCount} Students</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-primary">
                          <CalendarDays className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{sessionsCount} Sessions this month</span>
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

  const dialogForm = (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />Log Session
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-primary p-6 md:p-8 text-white shrink-0">
          <DialogTitle className="text-2xl font-black tracking-tight">{editItem ? "Edit Session" : "Log New Session"}</DialogTitle>
          <p className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">Operation LTM · {selectedCentre?.name}</p>
        </div>
        <ScrollArea className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-full">
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Duration (Min)</Label>
                <Input type="number" placeholder="60" value={duration} onChange={e => setDuration(e.target.value)} className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11" />
              </div>
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fellow</Label>
                <Select value={fellowId} onValueChange={setFellowId}>
                  <SelectTrigger className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11">
                    <SelectValue placeholder="Select Fellow..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {fellowsList.map(f => (
                      <SelectItem key={f._id} value={f._id || f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Topic / Lesson Theme</Label>
              <Input placeholder="e.g. Intro to Rhythm Patterns" value={topic} onChange={e => setTopic(e.target.value)} className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Session Plan</Label>
              <Textarea placeholder="Write or paste your session plan here..." value={sessionPlanLink} onChange={e => setSessionPlanLink(e.target.value)} className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all min-h-[100px] resize-y" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Documentation (Photos/Videos)</Label>
              <Input placeholder="https://drive.google.com/..." value={documentationLink} onChange={e => setDocumentationLink(e.target.value)} className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11" />
            </div>

            <div className="pt-2 border-t border-muted/50 flex items-center justify-between pr-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/30 transition-colors">
                <input type="checkbox" checked={isMusicBus} onChange={e => setIsMusicBus(e.target.checked)} className="h-5 w-5 rounded border-primary/20 text-primary focus:ring-primary/20 cursor-pointer" />
                <span className="text-sm font-black tracking-tight flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Conducted in Music Bus</span>
              </label>
              {isMusicBus && date && (
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black tracking-widest uppercase">
                  {(() => {
                    const month = new Date(date).getMonth();
                    if (month >= 3 && month <= 5) return "Q1";
                    if (month >= 6 && month <= 8) return "Q2";
                    if (month >= 9 && month <= 11) return "Q3";
                    return "Q4";
                  })()} Visit
                </Badge>
              )}
            </div>

            {isMusicBus && (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observations</Label>
                  <textarea placeholder="Key findings and highlights..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full rounded-2xl bg-muted/30 border-none min-h-[80px] resize-none focus-visible:ring-primary/20 p-3 text-sm font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Critical Issues (if any)</Label>
                  <textarea placeholder="Any blockers or red flags..." value={issues} onChange={e => setIssues(e.target.value)} className="w-full rounded-2xl bg-muted/30 border-none min-h-[60px] resize-none focus-visible:ring-primary/20 p-3 text-sm font-medium" />
                </div>
              </div>
            )}

            <FileUpload
              files={sessionFiles}
              onFilesChange={setSessionFiles}
              centreId={selectedCentreId || centreId || undefined}
              centreName={selectedCentre?.name}
              context="Sessions"
              monthYear={`${months.find(m => m.value === filterMonth)?.label} ${filterYear}`}
              label="Attach Session Plans / Photos / Videos"
              maxFiles={5}
            />
          </div>
        </ScrollArea>
        <div className="p-6 md:p-8 bg-muted/30 border-t flex justify-end gap-3 shrink-0">
          <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit} className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px]">{editItem ? "Save Changes" : "Confirm Log"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCentreId(null)} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm border border-transparent hover:border-primary/20 hover:text-primary transition-all shrink-0">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-3xl font-[950] tracking-tighter text-foreground">{selectedCentre?.name}</h1>
            <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] flex items-center gap-2 mt-1">
               {months.find(m => m.value === filterMonth)?.label} {filterYear} 
               <span className="opacity-20">|</span> 
               {centreSessionsList.length} Sessions Logged
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dialogForm}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
          <Input 
            placeholder="Filter sessions by topic or theme..." 
            className="pl-12 h-12 rounded-xl border-none shadow-lg bg-white font-bold tracking-tight focus:ring-primary/20" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="h-12 rounded-xl border-none shadow-lg bg-white font-bold text-xs w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="h-12 rounded-xl border-none shadow-lg bg-white font-bold text-xs w-[90px]"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {centreSessionsList
          .filter(s => {
            const matchesSearch = s.topic.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
          })
          .map(s => (
          <Card key={s._id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
            <CardContent className="p-0 flex flex-col sm:flex-row">
              <div className="p-8 flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">{formatDateDMY(s.date)}</Badge>
                    {s.createdAt && (
                      <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-muted-foreground/10 rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                        Logged: {formatDateDMY(s.createdAt)}
                      </Badge>
                    )}
                    {s.isMusicBus && <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20 rounded-lg px-2 py-1 font-black text-[10px] uppercase tracking-widest flex items-center gap-1"><Truck className="h-3 w-3" /> Music Bus</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">{s.duration} mins</span>
                  </div>
                </div>
                <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{s.topic}</h3>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Attendance</span>
                    <span className="text-sm font-black flex items-center gap-1.5 mt-0.5"><Users className="h-4 w-4 text-info" />{s.studentsPresent} students</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Session Plan</span>
                    {s.sessionPlanLink ? (
                      <button onClick={() => setViewPlanText(s.sessionPlanLink!)} className="text-xs font-bold text-success mt-0.5 flex items-center gap-1 hover:underline cursor-pointer"><CheckCircle2 className="h-3 w-3" /> View Plan</button>
                    ) : (
                      <span className="text-xs font-bold text-destructive mt-0.5">Missing Plan</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Documentation</span>
                    {s.documentationLink ? (
                      <a href={s.documentationLink.startsWith('http') ? s.documentationLink : `https://${s.documentationLink}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-success hover:underline mt-0.5 flex items-center gap-1">View Media <CheckCircle2 className="h-3 w-3" /></a>
                    ) : (
                      <span className="text-xs font-bold text-destructive mt-0.5">Missing Media</span>
                    )}
                  </div>
                </div>

                {s.files && s.files.length > 0 && (
                  <FileGallery files={s.files} title="Drive Media & Attachments" />
                )}
              </div>
              <div className="bg-muted/30 sm:w-64 p-8 flex flex-col justify-center gap-3 border-l">
                <Button className="w-full rounded-xl h-10 font-black uppercase tracking-widest text-[10px]" onClick={() => openAttendance(s)}>
                  <ClipboardCheck className="h-4 w-4 mr-2" /> Mark Attendance
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-muted-foreground/20" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  {isMEManager && (
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(s._id)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {centreSessionsList.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-[3rem] border-2 border-dashed">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-sm font-bold text-muted-foreground mt-4">No sessions logged for {months.find(m => m.value === filterMonth)?.label} {filterYear}</p>
          </div>
        )}
      </div>

      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-8 text-white">
            <DialogTitle className="text-2xl font-black tracking-tight">Quick Attendance</DialogTitle>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">
              {activeSession?.topic} · {activeSession?.date}
            </p>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              <Input 
                placeholder="Search students..." 
                className="pl-9 h-10 rounded-xl border-none bg-white text-primary placeholder:text-primary/40 text-sm font-bold" 
                value={attendanceSearchQuery} 
                onChange={(e) => setAttendanceSearchQuery(e.target.value)} 
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" size="sm" className="rounded-lg text-[10px] font-black uppercase h-8 px-4" onClick={() => setCheckedStudentIds(studentsList.filter(s => s.centreId === selectedCentreId).map(s => s._id))}>Select All</Button>
              <Button variant="outline" size="sm" className="rounded-lg text-[10px] font-black uppercase h-8 px-4 bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary" onClick={() => setCheckedStudentIds([])}>Clear All</Button>
            </div>
          </div>
          <ScrollArea className="h-[400px] p-8">
            <div className="space-y-3">
              {studentsList
                .filter(s => s.centreId === selectedCentreId && s.name.toLowerCase().includes(attendanceSearchQuery.toLowerCase()))
                .map(s => (
                  <div key={s._id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${checkedStudentIds.includes(s._id) ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/20'}`} onClick={() => setCheckedStudentIds(prev => prev.includes(s._id) ? prev.filter(id => id !== s._id) : [...prev, s._id])}>
                    <div className="flex items-center gap-4">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${checkedStudentIds.includes(s._id) ? 'bg-primary text-white' : 'bg-muted text-transparent'}`}><CheckCircle2 className="h-4 w-4" /></div>
                      <span className="text-sm font-black tracking-tight">{s.name}</span>
                    </div>
                    <Badge variant="outline" className="rounded-lg text-[10px] font-bold opacity-50 uppercase">{s.grade}-{s.section}</Badge>
                  </div>
                ))}
            </div>
          </ScrollArea>
          <div className="p-8 bg-muted/30 border-t flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{checkedStudentIds.length} Selected</span>
            <div className="flex gap-3">
              <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Cancel</Button></DialogClose>
              <Button className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px]" onClick={handleSaveAttendance} disabled={isSubmittingAttendance}>{isSubmittingAttendance ? "Saving..." : "Save Attendance"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* View Session Plan Dialog */}
      <Dialog open={viewPlanText !== null} onOpenChange={(o) => { if (!o) setViewPlanText(null); }}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl max-w-lg">
          <DialogHeader className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 -m-6 mb-0 rounded-t-[2rem]">
            <DialogTitle className="text-lg font-black tracking-tight">Session Plan</DialogTitle>
            <DialogDescription className="text-white/70 text-xs font-bold uppercase tracking-widest">Plan Details</DialogDescription>
          </DialogHeader>
          <div className="p-2 pt-6">
            <div className="bg-muted/30 rounded-xl p-4 max-h-[400px] overflow-y-auto">
              {viewPlanText && (viewPlanText.startsWith('http://') || viewPlanText.startsWith('https://')) ? (
                <a href={viewPlanText} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary hover:underline break-all">{viewPlanText}</a>
              ) : (
                <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{viewPlanText}</p>
              )}
            </div>
          </div>
          <DialogFooter className="px-2 pb-2">
            <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionsPage;
