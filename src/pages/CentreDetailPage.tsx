import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Building2, MapPin, Users, ArrowLeft, User, Calendar, Clock, BookOpen, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, ClipboardCheck, Search } from "lucide-react";

type Centre = { _id: string; id?: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };
type Fellow = { _id: string; id: string; name: string; email: string; phone: string; centreIds: string[]; sessionsCompleted: number; attendanceRate: number };
type Student = { _id: string; id: string; name: string; age: number; gender: "Male" | "Female"; centreId: string; attendancePercent: number; lastAssessmentScore: number; grade?: string; section?: string };
type Session = { _id: string; id: string; date: string; centreId: string; fellowId: string; topic: string; duration: number; activities: string[]; studentsPresent: number; presentStudentIds?: string[] };

const CentreDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [centre, setCentre] = useState<Centre | null>(null);
  const [allFellows, setAllFellows] = useState<Fellow[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Add student dialog
  const [open, setOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [studentGender, setStudentGender] = useState<"Male" | "Female">("Male");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentSection, setStudentSection] = useState("");

  // Attendance state
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [checkedStudentIds, setCheckedStudentIds] = useState<string[]>([]);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      const [centreRes, fellowsRes, studentsRes, sessionsRes, assessmentsRes] = await Promise.all([
        api.get(`/centres/${id}`),
        api.get("/fellows"),
        api.get("/students"),
        api.get("/sessions"),
        api.get("/assessments"),
      ]);
      setCentre(centreRes.data);
      setAllFellows(fellowsRes.data);
      setAllStudents(studentsRes.data);
      setAllSessions(sessionsRes.data);
      setAssessmentsList(assessmentsRes.data);
    } catch (err) {
      setError(true);
      toast.error("Failed to load centre details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !centre) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Centre not found.</p>
        <Button variant="outline" onClick={() => navigate("/centres")}><ArrowLeft className="h-4 w-4 mr-2" />Back to Centres</Button>
      </div>
    );
  }

  // Match fellows, students, sessions to this centre using both _id and id fields
  const centreId = centre._id;
  const centreIdAlt = centre.id || centre._id;
  const centreFellows = allFellows.filter(f =>
    centre.fellowIds.includes(f.id) || centre.fellowIds.includes(f._id)
  );
  const centreStudents = allStudents.filter(s =>
    s.centreId === centreId || s.centreId === centreIdAlt
  );
  const monthlySessions = allSessions
    .filter(s => (s.centreId === centreId || s.centreId === centreIdAlt))
    .filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const monthlyAssessments = assessmentsList
    .filter(a => {
      const student = allStudents.find(st => (st._id === a.studentId?._id || st._id === a.studentId));
      if (!student) return false;
      return student.centreId === centreId || student.centreId === centreIdAlt;
    })
    .filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

  const avgAttendance = monthlySessions.length > 0
    ? Math.round(monthlySessions.reduce((sum, s) => sum + (s.studentsPresent || 0), 0) / (monthlySessions.length * (centreStudents.length || 1)) * 100)
    : 0;
  
  const avgScore = monthlyAssessments.length > 0
    ? (monthlyAssessments.reduce((sum, a) => sum + (a.averageScore || 0), 0) / monthlyAssessments.length).toFixed(1)
    : "0.0";

  const resetForm = () => { setStudentName(""); setStudentAge(""); setStudentGender("Male"); setStudentGrade(""); setStudentSection(""); };

  const handleAddStudent = async () => {
    if (!studentName.trim() || !studentAge.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    const age = parseInt(studentAge);
    if (isNaN(age) || age < 5 || age > 20) {
      toast.error("Age must be between 5 and 20");
      return;
    }
    try {
      await api.post("/students", {
        name: studentName.trim(),
        age,
        gender: studentGender,
        centreId: centreIdAlt,
        grade: centre.type === "In-school" ? studentGrade.trim() : undefined,
        section: centre.type === "In-school" ? studentSection.trim() : undefined,
        attendancePercent: 0,
        lastAssessmentScore: 0,
      });
      toast.success("Student added successfully");
      resetForm();
      setOpen(false);
      fetchData(); // refresh
    } catch {
      toast.error("Failed to add student");
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) { toast.error("Please select a session"); return; }
    setIsSubmittingAttendance(true);
    try {
      await api.post(`/sessions/${selectedSessionId}/attendance`, { presentStudentIds: checkedStudentIds });
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
    setSelectedSessionId(session._id);
    setCheckedStudentIds(session.presentStudentIds || []);
    setAttendanceOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/centres")} className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-[950] tracking-tight">{centre.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <MapPin className="h-3.5 w-3.5" />{centre.location}
                <Badge variant={centre.type === "In-school" ? "default" : "secondary"} className="ml-1 text-[10px] font-black uppercase tracking-widest h-5">{centre.type}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border shadow-sm self-end md:self-center">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="h-9 w-[120px] rounded-xl border-none font-bold text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                <SelectItem key={m} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="h-9 w-[90px] rounded-xl border-none font-bold text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center">
            <Users className="h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold">{centreStudents.length}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center">
            <ClipboardCheck className="h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold">{monthlySessions.length}</p>
            <p className="text-xs text-muted-foreground">Sessions Held</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center">
            <Calendar className="h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold">{avgAttendance}%</p>
            <p className="text-xs text-muted-foreground">Avg Attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center">
            <BookOpen className="h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold">{avgScore}</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Fellows */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assigned Fellows</CardTitle>
        </CardHeader>
        <CardContent>
          {centreFellows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fellows assigned.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {centreFellows.map(f => {
                const fellowSessions = monthlySessions.filter(s => s.fellowId === f._id || s.fellowId === f.id);
                const fellowAttendance = fellowSessions.length > 0 
                  ? Math.round(fellowSessions.reduce((acc, curr) => acc + (curr.studentsPresent || 0), 0) / (fellowSessions.length * (centreStudents.length || 1)) * 100)
                  : 0;
                
                return (
                  <div key={f._id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.email}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-medium">{fellowSessions.length} sessions</p>
                      <p className="text-xs text-muted-foreground">{fellowAttendance}% attendance</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="mb-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sessions in {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][selectedMonth]} ({monthlySessions.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/sessions")}>View All</Button>
        </CardHeader>
        <CardContent>
          {monthlySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions recorded for this month.</p>
          ) : (
            <div className="space-y-3">
              {monthlySessions.slice(0, 10).map(s => (
                <div key={s._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{s.topic}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                        <Clock className="h-3 w-3" /> {format(new Date(s.date), "dd MMM yyyy")} · {s.duration} mins
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">{s.studentsPresent} Present</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{allFellows.find(f => f._id === s.fellowId || f.id === s.fellowId)?.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openAttendance(s)} className="h-8 w-8 text-primary">
                      <ClipboardCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students */}
      <Card className="mb-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Students ({centreStudents.length})</CardTitle>
          <div className="flex items-center gap-2">
            {monthlySessions.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => openAttendance(monthlySessions[0])} className="border-primary/20 text-primary hover:bg-primary/5">
                <ClipboardCheck className="h-4 w-4 mr-1" /> Quick Attendance
              </Button>
            )}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Student</Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Student to {centre.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="sname">Student Name</Label>
                  <Input id="sname" placeholder="e.g. Ravi Kumar" value={studentName} onChange={e => setStudentName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sage">Age</Label>
                  <Input id="sage" type="number" placeholder="e.g. 12" value={studentAge} onChange={e => setStudentAge(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={studentGender} onValueChange={(v: "Male" | "Female") => setStudentGender(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {centre.type === "In-school" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sgrade">Class</Label>
                      <Input id="sgrade" placeholder="e.g. 6th" value={studentGrade} onChange={e => setStudentGrade(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ssection">Section</Label>
                      <Input id="ssection" placeholder="e.g. A" value={studentSection} onChange={e => setStudentSection(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleAddStudent}>Add Student</Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {centreStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  {centre.type === "In-school" && (
                    <>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                    </>
                  )}
                  <TableHead>Attendance</TableHead>
                  <TableHead>Last Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centreStudents.map(s => {
                  const studentSessions = monthlySessions.filter(sess => sess.presentStudentIds && sess.presentStudentIds.includes(s._id || s.id));
                  const attendance = monthlySessions.length > 0 ? Math.round((studentSessions.length / monthlySessions.length) * 100) : 0;
                  const assessment = monthlyAssessments.find(a => (a.studentId?._id || a.studentId) === (s._id || s.id));
                  
                  return (
                    <TableRow key={s._id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-bold text-xs">{s.name}</TableCell>
                      <TableCell className="text-xs">{s.age}</TableCell>
                      <TableCell className="text-xs">{s.gender}</TableCell>
                      {centre.type === "In-school" && (
                        <>
                          <TableCell className="text-xs">{s.grade || "-"}</TableCell>
                          <TableCell className="text-xs">{s.section || "-"}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <Badge variant={attendance >= 85 ? "default" : "destructive"} className="text-[10px] font-black">{attendance}%</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-primary">{assessment?.averageScore || "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Attendance Dialog */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <ClipboardCheck className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight">Quick Attendance</DialogTitle>
              </div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">
                {allSessions.find(s => s._id === selectedSessionId)?.topic} · {allSessions.find(s => s._id === selectedSessionId)?.date}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setCheckedStudentIds(centreStudents.map(s => s._id))}
                className="text-white hover:bg-white/10 text-xs font-bold"
              >
                All Present
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setCheckedStudentIds([])}
                className="text-white hover:bg-white/10 text-xs font-bold"
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                value={attendanceSearch}
                onChange={e => setAttendanceSearch(e.target.value)}
                className="pl-11 rounded-2xl border-muted bg-muted/20 h-12"
              />
            </div>
            
            <ScrollArea className="h-[40vh] pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {centreStudents
                  .filter(s => s.name.toLowerCase().includes(attendanceSearch.toLowerCase()))
                  .map(student => (
                  <div 
                    key={student._id}
                    onClick={() => {
                      const isChecked = checkedStudentIds.includes(student._id);
                      if (isChecked) setCheckedStudentIds(prev => prev.filter(id => id !== student._id));
                      else setCheckedStudentIds(prev => [...prev, student._id]);
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      checkedStudentIds.includes(student._id) 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "bg-background hover:bg-muted/50 border-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        checkedStudentIds.includes(student._id) ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{student.grade}{student.section}</p>
                      </div>
                    </div>
                    <Checkbox 
                      checked={checkedStudentIds.includes(student._id)}
                      onCheckedChange={() => {}} // Handled by div click
                      className="h-5 w-5 rounded-md"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div className="p-8 bg-muted/30 border-t flex items-center justify-between">
            <div className="text-sm font-bold text-muted-foreground">
              <span className="text-primary">{checkedStudentIds.length}</span> / {centreStudents.length} present
            </div>
            <div className="flex items-center gap-3">
              <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Cancel</Button></DialogClose>
              <Button 
                onClick={handleSaveAttendance} 
                disabled={isSubmittingAttendance}
                className="rounded-xl px-8 font-black shadow-lg shadow-primary/20 min-w-[140px]"
              >
                {isSubmittingAttendance ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CentreDetailPage;
