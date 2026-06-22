import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, FileText, Users, PlayCircle, ClipboardCheck, LayoutGrid, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

type Quality = { 
  _id: string; 
  session: string; 
  centre: string; 
  centreId?: string;
  fellow: string; 
  date: string; 
  sessionNumbers: number;
  attendancePercentage: number;
  sessionPlan: {
    format: number;
    details: number;
    interconnection: number;
    sel: number;
    musical: number;
    curriculumAlignment: number;
  };
  assessmentPercentage: number;
  videoObservation: number;
  score: number;
};

type Session = { _id: string; id: string; date: string; centreId: string; fellowId: string; topic: string; duration: number; activities: string[]; studentsPresent: number };
type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };
type Fellow = { _id: string; id: string; name: string; email: string; phone: string; centreIds: string[]; sessionsCompleted: number; attendanceRate: number };

const QualityPage = () => {
  const { user } = useAuth();
  const [qualityList, setQualityList] = useState<Quality[]>([]);
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [centresList, setCentresList] = useState<Centre[]>([]);
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Quality | null>(null);
  
  // Form States
  const [formCentreId, setFormCentreId] = useState("");
  const [formMonth, setFormMonth] = useState(new Date().getMonth().toString());
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString());
  const [sessionNumbers, setSessionNumbers] = useState("3");
  const [attendancePercentage, setAttendancePercentage] = useState("3");
  const [assessmentPercentage, setAssessmentPercentage] = useState("3");
  const [videoObservation, setVideoObservation] = useState("3");
  const [planFormat, setPlanFormat] = useState("3");
  const [planDetails, setPlanDetails] = useState("3");
  const [planInterconnection, setPlanInterconnection] = useState("3");
  const [planSel, setPlanSel] = useState("3");
  const [planMusical, setPlanMusical] = useState("3");
  const [planCurriculum, setPlanCurriculum] = useState("3");

  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formCentreId && formMonth && formYear && !editItem) {
      autoCalculateMetrics();
    }
  }, [formCentreId, formMonth, formYear]);

  const fetchData = async () => {
    try {
      const params = user?.role === 'fellow' ? `?role=fellow&email=${user.email}` : user?.role === 'program_manager' ? `?role=program_manager&email=${user.email}` : '';
      const [qualityRes, sessionsRes, centresRes, fellowsRes, assessmentsRes, studentsRes] = await Promise.all([
        api.get(`/quality${params}`),
        api.get(`/sessions${params}`),
        api.get(`/centres${params}`),
        api.get(`/fellows${params}`),
        api.get(`/assessments${params}`),
        api.get(`/students${params}`)
      ]);
      setQualityList(qualityRes.data);
      setSessionsList(sessionsRes.data);
      setCentresList(centresRes.data);
      setFellowsList(fellowsRes.data);
      setAssessmentsList(assessmentsRes.data);
      setStudentsList(studentsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const autoCalculateMetrics = () => {
    if (!formCentreId) return;
    const centre = centresList.find(c => c._id === formCentreId);
    if (!centre) return;
    const month = parseInt(formMonth);
    const year = parseInt(formYear);

    // 1. Session Numbers (this month)
    const monthlySessions = sessionsList.filter(s => {
      const d = new Date(s.date);
      return (s.centreId === (centre._id || centre.id)) && d.getMonth() === month && d.getFullYear() === year;
    });
    const sCount = monthlySessions.length;
    let sScore = "1";
    if (sCount >= 12) sScore = "5";
    else if (sCount >= 10) sScore = "4";
    else if (sCount >= 8) sScore = "3";
    else if (sCount >= 6) sScore = "2";
    setSessionNumbers(sScore);

    // 2. Attendance % (average this month)
    const centreStudents = studentsList.filter(st => (st.centreId?._id || st.centreId) === (centre._id || centre.id));
    const centreStudentsCount = centreStudents.length || 25;
    const totalPossibleAttendance = sCount * centreStudentsCount;
    const actualAttendance = monthlySessions.reduce((acc, curr) => acc + (curr.studentsPresent || 0), 0);
    const attPct = totalPossibleAttendance > 0 ? (actualAttendance / totalPossibleAttendance) * 100 : 0;
    
    let aScore = "1";
    if (attPct >= 85) aScore = "5";
    else if (attPct >= 75) aScore = "4";
    else if (attPct >= 65) aScore = "3";
    else if (attPct >= 50) aScore = "2";
    setAttendancePercentage(aScore);

    // 3. Assessment % (this month)
    const studentsWithAssessments = centreStudents.filter(st => {
      return assessmentsList.some(as => 
        (as.studentId?._id || as.studentId) === (st._id || st.id) && 
        new Date(as.date).getMonth() === month && 
        new Date(as.date).getFullYear() === year
      );
    }).length;
    const assPct = centreStudents.length > 0 ? (studentsWithAssessments / centreStudents.length) * 100 : 0;

    let asScore = "1";
    if (assPct >= 90) asScore = "5";
    else if (assPct >= 75) asScore = "4";
    else if (assPct >= 60) asScore = "3";
    else if (assPct >= 40) asScore = "2";
    setAssessmentPercentage(asScore);
    
    toast.info(`Auto-calculated metrics for ${centre.name} (${months[month]})`);
  };

  const resetForm = () => {
    setFormCentreId("");
    setFormMonth(new Date().getMonth().toString());
    setFormYear(new Date().getFullYear().toString());
    setSessionNumbers("3");
    setAttendancePercentage("3");
    setAssessmentPercentage("3");
    setVideoObservation("3");
    setPlanFormat("3");
    setPlanDetails("3");
    setPlanInterconnection("3");
    setPlanSel("3");
    setPlanMusical("3");
    setPlanCurriculum("3");
    setEditItem(null);
  };

  const openEdit = (q: Quality) => {
    setEditItem(q);
    const d = new Date(q.date);
    setFormCentreId(q.centreId || "");
    setFormMonth(String(d.getMonth()));
    setFormYear(String(d.getFullYear()));
    setSessionNumbers(String(q.sessionNumbers));
    setAttendancePercentage(String(q.attendancePercentage));
    setAssessmentPercentage(String(q.assessmentPercentage));
    setVideoObservation(String(q.videoObservation));
    setPlanFormat(String(q.sessionPlan.format));
    setPlanDetails(String(q.sessionPlan.details));
    setPlanInterconnection(String(q.sessionPlan.interconnection));
    setPlanSel(String(q.sessionPlan.sel));
    setPlanMusical(String(q.sessionPlan.musical));
    setPlanCurriculum(String(q.sessionPlan.curriculumAlignment));
    setOpen(true);
  };

  const calculateOverallScore = () => {
    const vals = [
      parseInt(sessionNumbers),
      parseInt(attendancePercentage),
      parseInt(assessmentPercentage),
      parseInt(videoObservation),
      parseInt(planFormat),
      parseInt(planDetails),
      parseInt(planInterconnection),
      parseInt(planSel),
      parseInt(planMusical),
      parseInt(planCurriculum)
    ];
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 10) / 10;
  };

  const handleSubmit = async () => {
    if (!formCentreId) { toast.error("Please select a centre"); return; }
    
    const centre = centresList.find(c => c._id === formCentreId);
    const fellow = fellowsList.find(f => f.centreIds && f.centreIds.includes(formCentreId));
    
    const month = parseInt(formMonth);
    const year = parseInt(formYear);
    const auditDate = new Date(year, month, 15).toISOString(); // Middle of the month for reference

    const payload = {
      sessionNumbers: parseInt(sessionNumbers),
      attendancePercentage: parseInt(attendancePercentage),
      assessmentPercentage: parseInt(assessmentPercentage),
      videoObservation: parseInt(videoObservation),
      sessionPlan: {
        format: parseInt(planFormat),
        details: parseInt(planDetails),
        interconnection: parseInt(planInterconnection),
        sel: parseInt(planSel),
        musical: parseInt(planMusical),
        curriculumAlignment: parseInt(planCurriculum)
      },
      score: calculateOverallScore(),
      centreId: formCentreId,
      centre: centre?.name || "",
      fellow: fellow?.name || "Unassigned",
      date: auditDate
    };
    
    try {
      if (editItem) {
        await api.put(`/quality/${editItem._id}`, payload);
        toast.success("Quality record updated");
      } else {
        // Check if already logged for this month
        const alreadyLogged = qualityList.some(q => {
          const qDate = new Date(q.date);
          return q.centreId === formCentreId && qDate.getMonth() === month && qDate.getFullYear() === year;
        });

        if (alreadyLogged) {
          toast.error(`A quality review for ${centre?.name} has already been logged for ${months[month]}.`);
          return;
        }

        await api.post("/quality", payload);
        toast.success("Monthly quality review published");
      }
      fetchData();
      resetForm(); 
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save record");
    }
  };

  const scores = ["1", "2", "3", "4", "5"];

  const filteredQuality = qualityList.filter(q => {
    const d = new Date(q.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = [2024, 2025, 2026];

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-[950] tracking-tighter text-foreground">Centre Quality Index</h1>
          <p className="text-muted-foreground font-medium">Program Manager Review & Monitoring Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border shadow-sm">
             <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
               <SelectTrigger className="h-9 w-[120px] rounded-xl border-none font-bold text-xs"><SelectValue /></SelectTrigger>
               <SelectContent className="rounded-xl border-none shadow-2xl">
                 {months.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
               </SelectContent>
             </Select>
             <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
               <SelectTrigger className="h-9 w-[90px] rounded-xl border-none font-bold text-xs"><SelectValue /></SelectTrigger>
               <SelectContent className="rounded-xl border-none shadow-2xl">
                 {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
               </SelectContent>
             </Select>
          </div>
          {user?.role === 'admin' && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                  <Plus className="h-4 w-4 mr-2" />New Quality Review
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-primary p-8 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10"><CheckCircle2 className="h-24 w-24" /></div>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-[950] tracking-tight">{editItem ? "Update Quality Review" : "Program Manager Quality Review"}</DialogTitle>
                </DialogHeader>
              </div>
              
              <ScrollArea className="max-h-[70vh]">
                <div className="p-8 space-y-8">
                  {!editItem && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Centre</Label>
                        <Select value={formCentreId} onValueChange={setFormCentreId}>
                          <SelectTrigger className="rounded-2xl h-12 bg-muted border-none font-bold"><SelectValue placeholder="Choose centre..." /></SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            {centresList.map(c => <SelectItem key={c._id || c.id} value={c._id || c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reporting Period</Label>
                        <div className="flex gap-2">
                          <Select value={formMonth} onValueChange={setFormMonth}>
                            <SelectTrigger className="rounded-2xl h-12 bg-muted border-none font-bold flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              {months.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={formYear} onValueChange={setFormYear}>
                            <SelectTrigger className="rounded-2xl h-12 bg-muted border-none font-bold w-[100px]"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!editItem && formCentreId && (
                    <p className="text-[10px] font-bold text-primary/60 italic">
                      Operational metrics (Session count, Attendance, Assessments) will be automatically fetched for the selected month.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h5 className="font-black text-xs uppercase tracking-widest text-primary flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> Operations</h5>
                      <div className="space-y-4">
                        {[
                          { label: "Session Numbers", state: sessionNumbers, setter: setSessionNumbers },
                          { label: "Attendance %", state: attendancePercentage, setter: setAttendancePercentage },
                          { label: "Assessment %", state: assessmentPercentage, setter: setAssessmentPercentage },
                          { label: "Video Observation", state: videoObservation, setter: setVideoObservation }
                        ].map(item => (
                          <div key={item.label} className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</Label>
                            <div className="flex gap-1">
                              {scores.map(v => (
                                <button
                                  key={v}
                                  onClick={() => item.setter(v)}
                                  className={`flex-1 h-9 rounded-lg text-xs font-black transition-all ${item.state === v ? 'bg-primary text-white shadow-md' : 'bg-muted hover:bg-muted/80'}`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="font-black text-xs uppercase tracking-widest text-accent flex items-center gap-2"><FileText className="h-4 w-4" /> Session Plan Quality</h5>
                      <div className="space-y-4">
                        {[
                          { label: "Format & Structure", state: planFormat, setter: setPlanFormat },
                          { label: "Detailing", state: planDetails, setter: setPlanDetails },
                          { label: "Interconnection", state: planInterconnection, setter: setPlanInterconnection },
                          { label: "SEL Alignment", state: planSel, setter: setPlanSel },
                          { label: "Musical Accuracy", state: planMusical, setter: setPlanMusical },
                          { label: "Curriculum Allignment", state: planCurriculum, setter: setPlanCurriculum }
                        ].map(item => (
                          <div key={item.label} className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</Label>
                            <div className="flex gap-1">
                              {scores.map(v => (
                                <button
                                  key={v}
                                  onClick={() => item.setter(v)}
                                  className={`flex-1 h-7 rounded-md text-[10px] font-black transition-all ${item.state === v ? 'bg-accent text-white shadow-md' : 'bg-muted hover:bg-muted/80'}`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="p-8 bg-muted/30 border-t flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estimated Quality Score</span>
                  <span className="text-2xl font-[950] text-primary">{calculateOverallScore()}/5.0</span>
                </div>
                <div className="flex gap-3">
                  <DialogClose asChild><Button variant="ghost" className="rounded-2xl h-12 px-6 font-bold">Cancel</Button></DialogClose>
                  <Button onClick={handleSubmit} className="rounded-2xl h-12 px-10 font-black uppercase tracking-widest text-[10px] shadow-xl">
                    {editItem ? "Save Changes" : "Publish Review"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 gap-6">
        {filteredQuality.map(q => (
          <Card key={q._id} className="glass-card-premium border-none shadow-xl rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                <div className="p-6 lg:w-72 bg-primary/5 group-hover:bg-primary/10 transition-colors border-r border-primary/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <Badge className="rounded-full bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3">Review #{q._id.slice(-4)}</Badge>
                  </div>
                  <h3 className="font-[950] text-xl tracking-tight leading-tight mb-2">{q.session}</h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60"><Users className="h-3 w-3" /> {q.fellow}</p>
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60"><LayoutGrid className="h-3 w-3" /> {q.centre}</p>
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60"><ClipboardCheck className="h-3 w-3" /> {q.date}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-primary/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Overall Quality</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-[1000] text-primary">{q.score}</span>
                        <span className="text-xs font-bold text-muted-foreground">/ 5.0</span>
                     </div>
                  </div>
                </div>

                <div className="p-8 flex-1 bg-white">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 border-b pb-2">Operational Performance</h4>
                         <div className="space-y-4">
                            {[
                              { label: "Session Regularity", val: q.sessionNumbers, icon: LayoutGrid },
                              { label: "Student Attendance", val: q.attendancePercentage, icon: Users },
                              { label: "Assessment Completion", val: q.assessmentPercentage, icon: ClipboardCheck },
                              { label: "Video Observation", val: q.videoObservation, icon: PlayCircle }
                            ].map(item => (
                              <div key={item.label} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{item.label}</span>
                                  <span className="text-xs font-black text-primary">{item.val}/5</span>
                                </div>
                                <Progress value={item.val * 20} className="h-1.5 bg-muted" />
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 border-b pb-2">Session Plan Quality</h4>
                         <div className="grid grid-cols-2 gap-4">
                            {[
                              { label: "Format", val: q.sessionPlan.format },
                              { label: "Details", val: q.sessionPlan.details },
                              { label: "Linking", val: q.sessionPlan.interconnection },
                              { label: "SEL", val: q.sessionPlan.sel },
                              { label: "Music", val: q.sessionPlan.musical },
                              { label: "Align", val: q.sessionPlan.curriculumAlignment }
                            ].map(item => (
                              <div key={item.label} className="p-3 bg-muted/30 rounded-xl flex items-center justify-between">
                                 <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">{item.label}</span>
                                 <Badge className="bg-white text-primary border-none shadow-sm text-[10px] font-black h-6 w-6 p-0 flex items-center justify-center rounded-lg">{item.val}</Badge>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                   
                   {user?.role === 'admin' && (
                     <div className="mt-8 pt-6 border-t flex justify-end">
                       <Button variant="ghost" size="sm" onClick={() => openEdit(q)} className="text-muted-foreground hover:text-primary rounded-xl font-bold">
                         <Pencil className="h-4 w-4 mr-2" /> Edit Review
                       </Button>
                     </div>
                   )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {qualityList.length === 0 && !loading && (
          <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <LayoutGrid className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No quality assessments recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityPage;
