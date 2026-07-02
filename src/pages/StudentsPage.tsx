import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, ArrowLeft, Users, MapPin, Search, Filter, ClipboardCheck, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Student = { 
  _id: string; 
  id: string; 
  name: string; 
  age?: number; 
  gender?: "Male" | "Female"; 
  academicYear?: string;
  previousYearStudentId?: string;
  centreId: string; 
  phone?: string;
  schoolName?: string;
  fathersName?: string;
  fathersContact?: string;
  mothersName?: string;
  mothersContact?: string;
  address?: string;
  grade?: string;
  section?: string;
  status?: "Active" | "Inactive" | "Left";
  statusHistory?: Array<{ month: number; year: number; status: "Active" | "Inactive" | "Left" }>;
  attendancePercent: number; 
  lastAssessmentScore: number;
  createdAt?: string;
};
type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };
type Fellow = { _id: string; id: string; name: string; email: string; batch?: string };

const StudentsPage = () => {
  const { user, isAdmin, isSuperAdmin, isMEManager } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [centresList, setCentresList] = useState<Centre[]>([]);
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);
  const selectedCentreId = searchParams.get("centre");
  const setSelectedCentreId = (id: string | null) => {
    if (id) setSearchParams({ centre: id });
    else setSearchParams({});
  };
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Student | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [centreId, setCentreId] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [fathersName, setFathersName] = useState("");
  const [fathersContact, setFathersContact] = useState("");
  const [mothersName, setMothersName] = useState("");
  const [mothersContact, setMothersContact] = useState("");
  const [address, setAddress] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive" | "Left">("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGender, setFilterGender] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [centreSearchQuery, setCentreSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterFellow, setFilterFellow] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  type GridRow = { name: string; age: string; gender: string; classSection: string; phone: string };
  const emptyRow = (): GridRow => ({ name: '', age: '', gender: '', classSection: '', phone: '' });
  const [gridRows, setGridRows] = useState<GridRow[]>(Array.from({ length: 10 }, emptyRow));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isCarryForwardOpen, setIsCarryForwardOpen] = useState(false);
  const [carryForwardYear, setCarryForwardYear] = useState("");
  const [carryForwardSelectedIds, setCarryForwardSelectedIds] = useState<string[]>([]);

  const getCurrentAcademicYear = () => {
    const d = new Date();
    const m = d.getMonth();
    const y = d.getFullYear();
    return m < 6 ? `${y - 1}-${y}` : `${y}-${y + 1}`;
  };
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!carryForwardYear) setCarryForwardYear(getCurrentAcademicYear());
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const params = user?.role === 'fellow' 
        ? `?role=fellow&email=${user.email}` 
        : user?.role === 'program_manager' 
          ? `?role=program_manager&email=${user.email}` 
          : '';
      const [studentsRes, centresRes, fellowsRes, sessionsRes, assessmentsRes] = await Promise.all([
        api.get(`/students${params}`),
        api.get(`/centres${params}`),
        api.get(`/fellows${params}`),
        api.get(`/sessions${params}`),
        api.get(`/assessments${params}`)
      ]);
      setStudentsList(studentsRes.data);
      setCentresList(centresRes.data);
      setFellowsList(fellowsRes.data);
      setSessionsList(sessionsRes.data);
      setAssessmentsList(assessmentsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { 
    setName(""); setAge(""); setGender("Male"); setCentreId(""); 
    setPhone(""); setSchoolName(""); setFathersName(""); setFathersContact("");
    setMothersName(""); setMothersContact(""); setAddress("");
    setGrade(""); setSection(""); setStatus("Active");
    setEditItem(null); 
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this student?")) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success("Student deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete student");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedStudentIds.length} students?`)) return;
    try {
      await api.post(`/students/bulk-delete`, { studentIds: selectedStudentIds });
      toast.success("Students deleted successfully");
      setSelectedStudentIds([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete students");
    }
  };

  const openEdit = (s: Student) => {
    setEditItem(s); 
    setName(s.name); 
    setAge(String(s.age)); 
    setGender(s.gender); 
    setCentreId(s.centreId); 
    setPhone(s.phone || "");
    setSchoolName(s.schoolName || "");
    setFathersName(s.fathersName || "");
    setFathersContact(s.fathersContact || "");
    setMothersName(s.mothersName || "");
    setMothersContact(s.mothersContact || "");
    setAddress(s.address || "");
    setGrade((s.grade || '') + (s.section || ''));
    setSection('');
    setStatus(getStatusForMonth(s, selectedMonth, selectedYear));
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !centreId) { toast.error("Please fill in required fields (Name and Centre)"); return; }

    // Parse combined classSection (e.g. "8A") into grade + section
    const rawClass = grade.trim();
    const classMatch = rawClass.match(/^(\d+(?:st|nd|rd|th)?)\s*([A-Za-z])?$/i);
    const parsedGrade = classMatch?.[1] ?? rawClass;
    const parsedSection = classMatch?.[2]?.toUpperCase() ?? '';

    const studentData = { 
      name: name.trim(), 
      age: age ? parseInt(age) : undefined, 
      gender, 
      centreId,
      phone: phone.trim(),
      schoolName: schoolName.trim(),
      fathersName: fathersName.trim(),
      fathersContact: fathersContact.trim(),
      mothersName: mothersName.trim(),
      mothersContact: mothersContact.trim(),
      address: address.trim(),
      grade: selectedCentre?.type === "In-school" ? parsedGrade : undefined,
      section: selectedCentre?.type === "In-school" ? parsedSection : undefined,
      status,
      month: selectedMonth,
      year: selectedYear
    };

    try {
      if (editItem) {
        await api.put(`/students/${editItem._id}`, studentData);
        toast.success("Student updated successfully");
      } else {
        await api.post("/students", { ...studentData, attendancePercent: 0, lastAssessmentScore: 0 });
        toast.success("Student added successfully");
      }
      fetchData();
      resetForm(); 
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save student");
    }
  };

  const handleGridCellChange = (rowIdx: number, field: keyof GridRow, value: string) => {
    setGridRows(prev => {
      const updated = prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r);
      // Auto-add new row when typing in the last row
      if (rowIdx === updated.length - 1 && value.trim()) {
        updated.push(emptyRow());
      }
      return updated;
    });
  };

  const handleGridPaste = (e: React.ClipboardEvent, startRow: number, startField: keyof GridRow) => {
    const text = e.clipboardData.getData('text');
    const allLines = text.split('\n').filter(l => l.trim());
    if (allLines.length <= 1) return; // Let single-line paste happen naturally
    e.preventDefault();
    const fields: (keyof GridRow)[] = ['name', 'age', 'gender', 'classSection', 'phone'];
    const startColIdx = fields.indexOf(startField);
    setGridRows(prev => {
      const updated = [...prev];
      allLines.forEach((line, lineIdx) => {
        const rowIdx = startRow + lineIdx;
        const cells = line.split('\t');
        cells.forEach((cell, cellOffset) => {
          const colIdx = startColIdx + cellOffset;
          if (colIdx < fields.length) {
            const field = fields[colIdx];
            if (!updated[rowIdx]) updated[rowIdx] = emptyRow();
            updated[rowIdx] = { ...updated[rowIdx], [field]: cell.trim() };
          }
        });
      });
      // Ensure there's always an empty row at the bottom
      if (!updated[updated.length - 1] || updated[updated.length - 1].name.trim()) {
        updated.push(emptyRow());
      }
      return updated;
    });
  };

  const handleBulkSubmit = async () => {
    const filledRows = gridRows.filter(r => r.name.trim());
    if (filledRows.length === 0) { toast.error("Please enter at least one student name"); return; }
    
    setIsSubmitting(true);
    try {
      const students = filledRows.map(r => {
        const genderPart = r.gender.trim().toLowerCase();
        // Parse classSection like "8A", "6th B", "Class 7 C" → grade + section
        const rawClass = r.classSection.trim();
        const classMatch = rawClass.match(/^([\d]+(?:st|nd|rd|th)?)?\s*[-]?\s*([A-Za-z])?$/i);
        const parsedGrade = classMatch?.[1] ?? rawClass;
        const parsedSection = classMatch?.[2]?.toUpperCase() ?? '';
        return {
          name: r.name.trim(),
          ...(r.age.trim() ? { age: parseInt(r.age.trim()) } : {}),
          ...(genderPart ? { gender: (genderPart.startsWith('f') ? 'Female' : 'Male') } : {}),
          centreId: selectedCentreId,
          grade: parsedGrade,
          section: parsedSection,
          ...(r.phone.trim() ? { phone: r.phone.trim() } : {}),
          attendancePercent: 0,
          lastAssessmentScore: 0
        };
      });

      await api.post("/students/bulk", { students, month: selectedMonth, year: selectedYear });
      toast.success(`Successfully added ${students.length} students`);
      fetchData();
      setIsBulkOpen(false);
      setGridRows(Array.from({ length: 10 }, emptyRow));
    } catch (error) {
      toast.error("Failed to add students in bulk");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCarryForwardSubmit = async () => {
    if (carryForwardSelectedIds.length === 0) {
      toast.error("Please select at least one student to carry forward");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post("/students/carry-forward", { 
        studentIds: carryForwardSelectedIds, 
        newAcademicYear: carryForwardYear 
      });
      toast.success(`Successfully carried forward ${carryForwardSelectedIds.length} students`);
      fetchData();
      setIsCarryForwardOpen(false);
      setCarryForwardSelectedIds([]);
    } catch (error) {
      toast.error("Failed to carry forward students");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCentre = useMemo(() => centresList.find(c => (c._id || c.id) === selectedCentreId), [centresList, selectedCentreId]);
  const centreStudents = useMemo(() => selectedCentreId ? studentsList.filter(s => ((s.centreId as any)?._id || s.centreId) === selectedCentreId) : [], [studentsList, selectedCentreId]);

  const getStatusForMonth = (student: Student, month: number, year: number): "Active" | "Inactive" | "Left" => {
    if (!student.statusHistory || student.statusHistory.length === 0) {
      return student.status || "Active";
    }

    // Find all history records up to the selected month/year
    const relevantHistory = student.statusHistory.filter(h => 
      h.year < year || (h.year === year && h.month <= month)
    );

    if (relevantHistory.length === 0) {
      // Selected month is before any recorded status change — student was implicitly Active
      return "Active";
    }

    // Sort by date descending to get the most recent logged status
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Inactive":
        return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/10 border-none rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest">Inactive</Badge>;
      case "Left":
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 border-none rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest">Left</Badge>;
      default:
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-none rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest">Active</Badge>;
    }
  };

  const monthlyStats = useMemo(() => {
    const stats: Record<string, { attendance: number; score: string }> = {};
    
    const monthSessions = sessionsList.filter(sess => {
      const d = new Date(sess.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && sess.centreId === selectedCentreId;
    });
    
    const monthAssessments = assessmentsList.filter(ass => {
      const d = new Date(ass.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    centreStudents.forEach(student => {
      const sId = student._id || student.id;
      
      const totalSessions = monthSessions.length;
      const attendedSessions = monthSessions.filter(sess => 
        sess.presentStudentIds && sess.presentStudentIds.includes(sId)
      ).length;
      const attendance = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;
      
      const studentAss = monthAssessments.filter(ass => 
        (ass.studentId?._id || ass.studentId) === sId
      );
      const score = studentAss.length > 0
        ? (studentAss.reduce((sum, a) => sum + (a.averageScore || 0), 0) / studentAss.length).toFixed(1)
        : "-";
        
      stats[sId] = { attendance, score };
    });
    
    return stats;
  }, [centreStudents, sessionsList, assessmentsList, selectedMonth, selectedYear, selectedCentreId]);

  const filteredStudents = useMemo(() => {
    return centreStudents.filter(s => {
      if (!isEnrolledInMonth(s, selectedMonth, selectedYear)) return false;
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender = filterGender === "all" || s.gender === filterGender;
      const monthlyStatus = getStatusForMonth(s, selectedMonth, selectedYear);
      const matchesStatus = filterStatus === "all" || monthlyStatus === filterStatus;
      return matchesSearch && matchesGender && matchesStatus;
    });
  }, [centreStudents, selectedMonth, selectedYear, searchQuery, filterGender, filterStatus]);

  // Centre list view
  if (!selectedCentreId) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-4xl font-[1000] tracking-tighter text-foreground">Students</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] mt-1">Learner Database & Performance Analytics</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
            <Input 
              placeholder="Search centres or locations..." 
              className="pl-10 h-11 rounded-2xl border-none shadow-sm bg-white/60 font-bold text-xs" 
              value={centreSearchQuery} 
              onChange={(e) => setCentreSearchQuery(e.target.value)} 
            />
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Select value={filterBatch} onValueChange={setFilterBatch}>
                <SelectTrigger className="w-[140px] h-11 rounded-2xl border-none shadow-sm bg-white/60 font-bold text-xs"><SelectValue placeholder="Batch" /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="all">All Batches</SelectItem>
                  {Array.from(new Set(fellowsList.map(f => f.batch).filter(Boolean))).sort().map(b => (
                    <SelectItem key={b} value={b!}>Batch {b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-11 rounded-2xl border-none shadow-sm bg-white/60 font-bold text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="In-school">In-school</SelectItem>
                  <SelectItem value="After-school">After-school</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {centresList
            .filter(c => {
              const assignedFellows = c.fellowIds.map(fid => fellowsList.find(f => (f._id === fid || f.id === fid))?.name || "").join(" ").toLowerCase();
              const matchesSearch = c.name.toLowerCase().includes(centreSearchQuery.toLowerCase()) || 
                                   c.location.toLowerCase().includes(centreSearchQuery.toLowerCase()) ||
                                   assignedFellows.includes(centreSearchQuery.toLowerCase());
              const matchesType = filterType === "all" || c.type === filterType;
              const matchesBatch = filterBatch === "all" || c.fellowIds.some(fid => {
                const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
                return fellow?.batch === filterBatch;
              });
              const matchesFellow = filterFellow === "all" || c.fellowIds.includes(filterFellow);
              return matchesSearch && matchesType && matchesBatch && matchesFellow;
            })
            .map(centre => {
              const count = studentsList.filter(s => (s.centreId === (centre._id || centre.id) || (s.centreId as any)?._id === (centre._id || centre.id))).length;
              return (
                <Card 
                  key={centre._id || centre.id} 
                  className="glass-card-premium border-none hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => setSelectedCentreId(centre._id || centre.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black tracking-tight">{centre.name}</h3>
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <MapPin className="h-3 w-3" />{centre.location}
                          </div>
                        </div>
                      </div>
                      <Badge variant={centre.type === "In-school" ? "default" : "secondary"} className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest h-fit border-none">{centre.type}</Badge>
                    </div>
                    <div className="flex items-end justify-between border-t border-primary/5 pt-4">
                      <div>
                        <div className="text-2xl font-[1000] tracking-tighter text-primary">{count}</div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Enrolled Students</div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {centre.fellowIds.map(fid => {
                          const fellow = fellowsList.find(f => (f._id === fid || f.id === fid));
                          return fellow ? (
                            <Badge key={fid} variant="outline" className="text-[9px] font-black uppercase tracking-wider py-0.5 px-2 bg-primary/5 text-primary border-primary/10 h-fit rounded-full">
                              {fellow.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    );
  }

  // Student detail view for selected centre
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setSelectedCentreId(null)} 
            className="h-10 w-10 md:h-12 md:w-12 rounded-2xl border-primary/10 bg-white/50 backdrop-blur-md hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-4xl font-[1000] tracking-tighter text-foreground">{selectedCentre?.name}</h1>
              <Badge variant={selectedCentre?.type === "In-school" ? "default" : "secondary"} className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest h-fit border-none">{selectedCentre?.type}</Badge>
            </div>
            <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] mt-1">
              {centreStudents.filter(s => isEnrolledInMonth(s, selectedMonth, selectedYear) && getStatusForMonth(s, selectedMonth, selectedYear) === "Active").length} Active / {centreStudents.filter(s => isEnrolledInMonth(s, selectedMonth, selectedYear) && getStatusForMonth(s, selectedMonth, selectedYear) !== "Left").length} Total Students
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
            <Button onClick={() => { setCentreId(selectedCentreId!); setOpen(true); }} className="rounded-2xl h-11 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-4 w-4 mr-2" /> New Enrollment
            </Button>

            {new Date().getMonth() === 2 && (
              <Dialog open={isCarryForwardOpen} onOpenChange={setIsCarryForwardOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-2xl h-11 px-6 font-black uppercase tracking-widest text-[10px] text-primary hover:bg-primary/5">
                  Carry Forward
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-primary p-10 text-white relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <DialogTitle className="text-3xl font-black tracking-tighter">Carry Forward Students</DialogTitle>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Migrate students to a new academic year</p>
                  </div>
                </div>
                <div className="p-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <Label className="text-xs font-bold">Target Academic Year:</Label>
                    <Select value={carryForwardYear} onValueChange={setCarryForwardYear}>
                      <SelectTrigger className="w-[140px] h-10 rounded-xl bg-muted/40 font-bold text-xs border-none"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-none">
                        {['2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027'].map(ay => (
                          <SelectItem key={ay} value={ay} className="rounded-lg text-xs font-bold">{ay}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-muted/30 rounded-2xl p-4 max-h-[40vh] overflow-y-auto space-y-2">
                    {centreStudents.length === 0 ? (
                      <p className="text-sm font-bold text-muted-foreground text-center py-8">No students found in the current view to carry forward.</p>
                    ) : (
                      centreStudents.map(student => (
                        <div key={student._id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-primary/20 text-primary focus:ring-primary"
                              checked={carryForwardSelectedIds.includes(student._id)}
                              onChange={(e) => {
                                if (e.target.checked) setCarryForwardSelectedIds([...carryForwardSelectedIds, student._id]);
                                else setCarryForwardSelectedIds(carryForwardSelectedIds.filter(id => id !== student._id));
                              }}
                            />
                            <div>
                              <p className="text-sm font-bold">{student.name}</p>
                              {student.grade && <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{student.grade}-{student.section}</p>}
                            </div>
                          </div>
                          {student.academicYear && <Badge variant="secondary" className="text-[8px] uppercase">{student.academicYear}</Badge>}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCarryForwardSelectedIds(centreStudents.map(s => s._id))} className="text-[10px] rounded-lg">Select All</Button>
                    <Button variant="outline" size="sm" onClick={() => setCarryForwardSelectedIds([])} className="text-[10px] rounded-lg">Deselect All</Button>
                    <span className="text-xs font-bold text-muted-foreground ml-auto">{carryForwardSelectedIds.length} Selected</span>
                  </div>
                </div>
                <div className="p-10 bg-muted/20 border-t flex items-center justify-end gap-4">
                  <DialogClose asChild><Button variant="ghost" className="rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button></DialogClose>
                  <Button onClick={handleCarryForwardSubmit} disabled={isSubmitting} className="rounded-2xl h-12 px-10 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                    {isSubmitting ? "Processing..." : "Carry Forward"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}

            <Dialog open={isBulkOpen} onOpenChange={(open) => { setIsBulkOpen(open); if (!open) setGridRows(Array.from({ length: 10 }, emptyRow)); }}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-2xl h-11 px-6 font-black uppercase tracking-widest text-[10px] text-primary hover:bg-primary/5">
                  <ClipboardCheck className="h-4 w-4 mr-2" /> Bulk Log
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl w-[95vw] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-primary p-8 text-white relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl font-black tracking-tighter">Bulk Enrollment</DialogTitle>
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Type directly or paste from Google Sheets</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl px-4 py-2 text-center">
                      <p className="text-2xl font-black">{gridRows.filter(r => r.name.trim()).length}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/60">Students</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-auto max-h-[60vh]">
                  <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-primary/5">
                        <th className="w-8 border border-border/40 p-2 text-center text-[9px] font-black text-muted-foreground/60">#</th>
                        <th className="border border-border/40 p-2 text-left text-[9px] font-black text-primary uppercase tracking-wider min-w-[180px]">Name <span className="text-red-400">*</span></th>
                        <th className="border border-border/40 p-2 text-left text-[9px] font-black text-primary uppercase tracking-wider w-16">Age</th>
                        <th className="border border-border/40 p-2 text-left text-[9px] font-black text-primary uppercase tracking-wider w-24">Gender</th>
                        {selectedCentre?.type === 'In-school' && (
                          <th className="border border-border/40 p-2 text-left text-[9px] font-black text-primary uppercase tracking-wider w-24">Class</th>
                        )}
                        <th className="border border-border/40 p-2 text-left text-[9px] font-black text-primary uppercase tracking-wider w-36">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gridRows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={`group transition-colors ${
                            row.name.trim() ? 'bg-white hover:bg-primary/[0.02]' : 'bg-muted/10 hover:bg-muted/20'
                          }`}
                        >
                          <td className="border border-border/30 p-1 text-center text-[9px] text-muted-foreground/40 font-bold select-none w-8">
                            {row.name.trim() ? rowIdx + 1 : ''}
                          </td>
                          {(['name', 'age', 'gender', 'classSection', 'phone'] as (keyof GridRow)[]).filter(f => {
                            if (f === 'classSection' && selectedCentre?.type !== 'In-school') return false;
                            return true;
                          }).map((field) => (
                            <td key={field} className="border border-border/30 p-0">
                              {field === 'gender' ? (
                                <select
                                  value={row.gender}
                                  onChange={(e) => handleGridCellChange(rowIdx, 'gender', e.target.value)}
                                  className="w-full h-9 px-2 bg-transparent text-xs font-semibold text-foreground focus:outline-none focus:bg-primary/5 cursor-pointer"
                                >
                                  <option value="">-</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                </select>
                              ) : (
                                <input
                                  type={field === 'age' ? 'number' : 'text'}
                                  value={row[field]}
                                  onChange={(e) => handleGridCellChange(rowIdx, field, e.target.value)}
                                  onPaste={(e) => handleGridPaste(e, rowIdx, field)}
                                  placeholder={field === 'name' ? 'Student name...' : field === 'classSection' ? 'e.g. 8A' : ''}
                                  className="w-full h-9 px-2 bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:bg-primary/5 transition-colors"
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-muted/10 border-t flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGridRows(prev => [...prev, ...Array.from({ length: 10 }, emptyRow)])}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                    >
                      + Add 10 Rows
                    </button>
                    <span className="text-muted-foreground/40">·</span>
                    <button
                      onClick={() => setGridRows(Array.from({ length: 10 }, emptyRow))}
                      className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <DialogClose asChild>
                      <Button variant="ghost" className="rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleBulkSubmit}
                      disabled={isSubmitting}
                      className="rounded-2xl h-12 px-10 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                    >
                      {isSubmitting ? 'Processing...' : `Add ${gridRows.filter(r => r.name.trim()).length} Students`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
          <Input 
            placeholder="Find student by name..." 
            className="pl-10 h-11 rounded-2xl border-none shadow-sm bg-white/60 font-bold text-xs" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
            <SelectTrigger className="w-[130px] h-11 rounded-2xl border-none shadow-sm bg-white/60 font-bold text-xs">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                <SelectItem key={idx} value={String(idx)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>



          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[145px] h-11 rounded-2xl border-none shadow-sm bg-white/60 font-bold text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Left">Left</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="w-[130px] h-11 rounded-2xl border-none shadow-sm bg-white/60 font-bold text-xs"><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isMEManager && filteredStudents.length > 0 && (
          <div className="flex items-center justify-between bg-white/40 p-4 rounded-2xl shadow-sm border border-primary/5">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedStudentIds(filteredStudents.map(s => s._id));
                  } else {
                    setSelectedStudentIds([]);
                  }
                }}
              />
              <span className="text-sm font-semibold text-foreground">Select All ({filteredStudents.length})</span>
            </div>
            {selectedStudentIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="rounded-xl h-8 font-black uppercase tracking-widest text-[10px]">
                <Trash2 className="h-3 w-3 mr-2" /> Delete {selectedStudentIds.length} Selected
              </Button>
            )}
          </div>
        )}
        {filteredStudents.map(s => (
            <Card key={s._id} className="glass-card-premium border-none hover:shadow-2xl transition-all group overflow-hidden">
              <CardContent className="p-0 flex flex-col sm:flex-row items-stretch relative">
                {isMEManager && (
                  <div className="absolute top-4 left-4 z-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                      checked={selectedStudentIds.includes(s._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds([...selectedStudentIds, s._id]);
                        } else {
                          setSelectedStudentIds(selectedStudentIds.filter(id => id !== s._id));
                        }
                      }}
                    />
                  </div>
                )}
                <div className="p-8 flex-1 flex items-center gap-8 pl-12">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary font-black text-xl md:text-2xl group-hover:rotate-6 transition-transform shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base md:text-xl font-black tracking-tight group-hover:text-primary transition-colors">{s.name}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(getStatusForMonth(s, selectedMonth, selectedYear))}
                      {s.gender && <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">{s.gender}</Badge>}
                      {s.age && <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{s.age} Years Old</span>}
                      {selectedCentre?.type === "In-school" && (
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">{s.grade}-{s.section}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row items-stretch md:items-center gap-6 border-t md:border-t-0 md:border-x border-primary/5 min-w-0 md:min-w-[340px] bg-white/20">
                  <div className="flex-1 space-y-2 flex flex-col justify-center min-w-[140px]">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Monthly Attendance</span>
                      <span className="text-primary">{monthlyStats[s._id]?.attendance ?? 0}%</span>
                    </div>
                    <Progress value={monthlyStats[s._id]?.attendance ?? 0} className="h-2 rounded-full" />
                  </div>
                  <div className="text-center shrink-0 flex flex-col justify-center items-center border-t md:border-t-0 pt-3 md:pt-0 md:pl-4 border-dashed border-primary/10">
                    <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Monthly Avg Score</div>
                    <Badge variant="outline" className="rounded-xl font-black text-xs px-3 py-1 border-primary/10 bg-primary/5 text-primary">
                      {monthlyStats[s._id]?.score ?? "-"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 md:p-8 bg-muted/30 sm:w-64 flex flex-col justify-center gap-3">
                  <Button variant="outline" className="w-full rounded-xl h-10 font-black uppercase tracking-widest text-[10px] border-primary/10 hover:bg-primary hover:text-white transition-all" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                  {isMEManager && (
                    <Button variant="outline" className="w-full rounded-xl h-10 font-black uppercase tracking-widest text-[10px] border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all" onClick={(e) => handleDelete(e, s._id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        {filteredStudents.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-[3rem] border-2 border-dashed">
            <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-sm font-black text-muted-foreground mt-4 uppercase tracking-widest">No Learners Found</p>
          </div>
        )}
      </div>

      {/* Uncontrolled Dialog for Enrollment / Editing Profile */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-10 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <DialogTitle className="text-3xl font-black tracking-tighter">{editItem ? "Update Student" : "New Enrollment"}</DialogTitle>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Registration Module v2.0</p>
            </div>
          </div>
          <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Student Full Name</Label>
              <Input placeholder="Enter student's legal name" value={name} onChange={e => setName(e.target.value)} className="rounded-2xl border-none bg-muted/40 h-12 px-5 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Age</Label>
                <Input type="number" value={age} onChange={e => setAge(e.target.value)} className="rounded-2xl border-none bg-muted/40 h-12 px-5 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gender</Label>
                <Select value={gender} onValueChange={(v: "Male" | "Female") => setGender(v)}>
                  <SelectTrigger className="rounded-2xl border-none bg-muted/40 h-12 px-5 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="Male" className="rounded-xl">Male</SelectItem>
                    <SelectItem value="Female" className="rounded-xl">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-dashed">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                <Input placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-2xl border-none bg-muted/40 h-12 px-5 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">School Name</Label>
                <Input placeholder="e.g. Govt. School" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="rounded-2xl border-none bg-muted/40 h-12 px-5 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
            </div>

            {selectedCentre?.type === "In-school" && (
              <div className="border-t pt-4 border-dashed">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Class <span className="text-muted-foreground/50 normal-case font-semibold">(e.g. 8A, 6B)</span></Label>
                  <Input placeholder="e.g. 8A" value={grade} onChange={e => setGrade(e.target.value)} className="rounded-2xl border-none bg-muted/40 h-12 px-5 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>
            )}

            <div className="space-y-2 border-t pt-4 border-dashed">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</Label>
              <Select value={status} onValueChange={(v: "Active" | "Inactive" | "Left") => setStatus(v)}>
                <SelectTrigger className="rounded-2xl border-none bg-muted/40 h-12 px-5 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="Active" className="rounded-xl">Active</SelectItem>
                  <SelectItem value="Inactive" className="rounded-xl">Inactive</SelectItem>
                  <SelectItem value="Left" className="rounded-xl">Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-10 bg-muted/20 border-t flex items-center justify-end gap-4">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} className="rounded-2xl h-12 px-10 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
              {editItem ? "Save Changes" : "Confirm Enrollment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;
