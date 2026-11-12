import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, CalendarDays, Clock, Users, Pencil, ArrowLeft, MapPin, Search, Filter, Trash2, X, ClipboardCheck, CheckCircle2, Building2, Truck, AlertCircle, XCircle, Calendar, Layers, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload, DriveFile } from "@/components/ui/file-upload";
import { FileGallery } from "@/components/ui/file-gallery";
import { compareStudentsByClassAndName } from "@/lib/utils";

type Session = {
  _id: string;
  id: string;
  date: string;
  centreId: string;
  fellowId: string;
  topic: string;
  duration: number;
  activities: string[];
  studentsPresent: number;
  sessionPlanLink?: string;
  documentationLink?: string;
  files?: DriveFile[];
  presentStudentIds?: string[];
  isMusicBus?: boolean;
  observations?: string;
  issues?: string;
  createdAt?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'revision_requested' | 'revision_needed';
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerName?: string;
  reviewerRole?: string;
  reviewerEmail?: string;
};
type Centre = {
  _id: string;
  id: string;
  name: string;
  location: string;
  type: "In-school" | "After-school";
  fellowIds: string[];
  studentCount: number;
  programManagers?: string[];
  programManagerNames?: string[];
  programManagerIds?: string[];
};
type Fellow = { _id: string; id: string; name: string; email: string; phone: string; centreIds: string[]; sessionsCompleted: number; attendanceRate: number; batch?: string };
type AdminUser = { _id: string; id?: string; name: string; email: string; role: string; assignedFellowIds?: string[]; assignedCentreIds?: string[] };

const getPMs = (c: Centre): string[] => {
  if (c.programManagers && c.programManagers.length > 0) return c.programManagers;
  if ((c as any).programManagerNames && (c as any).programManagerNames.length > 0) return (c as any).programManagerNames;
  return [];
};

const formatRole = (role?: string) => {
  if (!role) return "Program Manager";
  const map: Record<string, string> = {
    program_manager: "Program Manager",
    program_lead: "Program Lead",
    program_director: "Program Director",
    m_e_manager: "M&E Manager",
    admin: "Admin"
  };
  return map[role] || role;
};

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
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState<string>(searchParams.get("month") || new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState<string>(searchParams.get("year") || new Date().getFullYear().toString());
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // "all" | "approved" | "pending" | "rejected"
  const [viewMode, setViewMode] = useState<"centres" | "sessions">("centres");

  const months = [
    { value: "all", label: "All Months" },
    { value: "0", label: "January" }, { value: "1", label: "February" }, { value: "2", label: "March" },
    { value: "3", label: "April" }, { value: "4", label: "May" }, { value: "5", label: "June" },
    { value: "6", label: "July" }, { value: "7", label: "August" }, { value: "8", label: "September" },
    { value: "9", label: "October" }, { value: "10", label: "November" }, { value: "11", label: "December" },
  ];

  const years = ["all", "2023", "2024", "2025", "2026"];

  const selectedCentreId = searchParams.get("centre");
  const setSelectedCentreId = (id: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (id) {
      nextParams.set("centre", id);
    } else {
      nextParams.delete("centre");
      nextParams.delete("session");
    }
    setSearchParams(nextParams);
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
  const [attendanceReviewNote, setAttendanceReviewNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewPlanText, setViewPlanText] = useState<string | null>(null);
  const [centreSearchQuery, setCentreSearchQuery] = useState("");
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCentreFellow, setFilterCentreFellow] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const isSubmittingAttendanceRef = useRef(false);
  
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSession, setReviewSession] = useState<Session | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'revision_requested'>('approved');
  const [reviewNote, setReviewNote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear]);

  useEffect(() => {
    if (!editItem) {
      const today = new Date();
      const isCurrentPeriod = today.getMonth().toString() === filterMonth && today.getFullYear().toString() === filterYear;
      if (isCurrentPeriod) {
        setDate(today.toISOString().split("T")[0]);
      } else if (filterMonth !== "all" && filterYear !== "all") {
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
      const [sessionsRes, centresRes, fellowsRes, studentsRes, adminsRes] = await Promise.all([
        api.get(`/sessions${dateParams}${params}`),
        api.get(`/centres${paramsQuery}`),
        api.get(`/fellows${paramsQuery}`),
        api.get(`/students${paramsQuery}`),
        api.get('/admins').catch(() => ({ data: [] }))
      ]);
      setSessionsList(sessionsRes.data);
      setCentresList(centresRes.data);
      setFellowsList(fellowsRes.data);
      setStudentsList(studentsRes.data);
      if (adminsRes?.data) setAdminsList(adminsRes.data);
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
    } else if (filterMonth !== "all" && filterYear !== "all") {
      const monthNum = parseInt(filterMonth);
      const yearNum = parseInt(filterYear);
      const formattedMonth = String(monthNum + 1).padStart(2, "0");
      setDate(`${yearNum}-${formattedMonth}-01`);
    } else {
      setDate(today.toISOString().split("T")[0]);
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

  useEffect(() => {
    const targetSessionId = searchParams.get("session");
    if (targetSessionId && sessionsList.length > 0) {
      const targetSession = sessionsList.find(s => s._id === targetSessionId);
      if (targetSession && !open) {
        openEdit(targetSession);
        // We don't remove the param from URL here because it might cause a flicker or reload in some setups,
        // but it's safe to keep it, or we can just leave it as is since !open prevents looping.
      }
    }
  }, [sessionsList, searchParams, open]);


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
    if (isSubmittingRef.current) return;
    const finalFellowId = user?.role === 'fellow' ? user.id : fellowId;
    if (!date || !topic.trim() || !finalFellowId || !duration) { toast.error("Please fill in all fields including date"); return; }
    

    const targetCentreId = selectedCentreId || centreId;
    if (!targetCentreId) { toast.error("Please select a centre"); return; }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save session");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!activeSession || isSubmittingAttendanceRef.current) return;
    isSubmittingAttendanceRef.current = true;
    setIsSubmittingAttendance(true);
    try {
      await api.post(`/sessions/${activeSession._id}/attendance`, {
        presentStudentIds: checkedStudentIds,
        reviewNote: attendanceReviewNote.trim()
      });
      toast.success("Attendance updated successfully");
      setAttendanceOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update attendance");
    } finally {
      isSubmittingAttendanceRef.current = false;
      setIsSubmittingAttendance(false);
    }
  };

  const openAttendance = (session: Session) => {
    setActiveSession(session);
    setCheckedStudentIds(session.presentStudentIds || []);
    setAttendanceReviewNote(session.reviewNote || "");
    setAttendanceSearchQuery("");
    setAttendanceOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewSession) return;
    if (reviewStatus === 'rejected' && !reviewNote.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    if (reviewStatus === 'revision_requested' && !reviewNote.trim()) {
      toast.error("Please provide instructions on what needs revision");
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      await api.put(`/sessions/${reviewSession._id}/review`, {
        approvalStatus: reviewStatus,
        reviewNote: reviewNote.trim(),
        reviewedBy: user?.id || (user as any)?._id || ''
      });
      const statusLabel = reviewStatus === 'approved' ? 'approved' : reviewStatus === 'rejected' ? 'rejected' : 'sent for revision';
      toast.success(`Session ${statusLabel}`);
      setReviewOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openReview = (session: Session) => {
    setReviewSession(session);
    setReviewStatus(
      session.approvalStatus === 'rejected'
        ? 'rejected'
        : session.approvalStatus === 'revision_requested' || session.approvalStatus === 'revision_needed'
          ? 'revision_requested'
          : 'approved'
    );
    setReviewNote(session.reviewNote || "");
    setReviewOpen(true);
  };

  const availableBatches = useMemo(() => {
    const batches = new Set<string>();
    fellowsList.forEach(f => {
      if (f.batch) batches.add(f.batch);
    });
    return Array.from(batches).sort();
  }, [fellowsList]);

  const isDateMatch = (dateStr?: string) => {
    if (!dateStr) return false;
    if (filterDate) {
      return dateStr.slice(0, 10) === filterDate;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const matchMonth = filterMonth === "all" || d.getMonth() === parseInt(filterMonth);
    const matchYear = filterYear === "all" || d.getFullYear() === parseInt(filterYear);
    return matchMonth && matchYear;
  };

  const isStatusMatch = (s: Session, status: string) => {
    if (status === "all") return true;
    if (status === "approved") return s.approvalStatus === "approved";
    if (status === "pending") return !s.approvalStatus || s.approvalStatus === "pending";
    if (status === "rejected") return s.approvalStatus === "rejected";
    if (status === "revision_requested") return s.approvalStatus === "revision_requested" || s.approvalStatus === "revision_needed";
    return true;
  };

  const isFellowBatchMatch = (fellowIdVal?: string) => {
    if (filterBatch === "all") return true;
    if (!fellowIdVal) return false;
    const f = fellowsList.find(fellow => (fellow._id || fellow.id) === fellowIdVal);
    return f?.batch === filterBatch;
  };

  const isCentreTypeMatch = (centreIdVal?: string) => {
    if (filterType === "all") return true;
    if (!centreIdVal) return false;
    const c = centresList.find(centre => (centre._id || centre.id) === centreIdVal || (centreIdVal as any)?._id === (centre._id || centre.id));
    return c?.type === filterType;
  };

  const getReviewerInfo = (s: Session) => {
    if (s.reviewerName) {
      return {
        name: s.reviewerName,
        role: formatRole(s.reviewerRole)
      };
    }

    if (s.reviewedBy) {
      const admin = adminsList.find(a => 
        (a._id || a.id) === s.reviewedBy || 
        a._id?.toString() === s.reviewedBy?.toString() ||
        a.email === s.reviewedBy || 
        a.name === s.reviewedBy
      );
      if (admin) {
        return {
          name: admin.name,
          role: formatRole(admin.role)
        };
      }
    }

    // Fallback: Check if the centre has assigned Program Managers
    const centre = centresList.find(c => (c._id || c.id) === s.centreId || (s.centreId as any)?._id === (c._id || c.id));
    if (centre) {
      const pms = getPMs(centre);
      if (pms && pms.length > 0) {
        return {
          name: pms.join(", "),
          role: "Program Manager"
        };
      }
    }

    return null;
  };

  const baseFilteredSessions = useMemo(() => {
    return sessionsList.filter(s => {
      if (!isDateMatch(s.date)) return false;
      if (!isFellowBatchMatch(s.fellowId)) return false;
      if (filterCentreFellow !== "all" && s.fellowId !== filterCentreFellow) return false;
      if (!isCentreTypeMatch(s.centreId)) return false;
      return true;
    });
  }, [sessionsList, filterDate, filterMonth, filterYear, filterBatch, filterCentreFellow, filterType, fellowsList, centresList]);

  // Overall counts for summary cards
  const overallTotal = baseFilteredSessions.length;
  const overallApproved = baseFilteredSessions.filter(s => s.approvalStatus === 'approved').length;
  const overallPending = baseFilteredSessions.filter(s => !s.approvalStatus || s.approvalStatus === 'pending').length;
  const overallRevision = baseFilteredSessions.filter(s => s.approvalStatus === 'revision_requested' || s.approvalStatus === 'revision_needed').length;
  const overallRejected = baseFilteredSessions.filter(s => s.approvalStatus === 'rejected').length;

  const getCentreSessionStats = (centre: Centre) => {
    const cId = centre._id || centre.id;
    const centreSessions = baseFilteredSessions.filter(s => {
      const matchesCentre = ((s.centreId as any)?._id || s.centreId) === cId;
      return matchesCentre;
    });
    const approved = centreSessions.filter(s => s.approvalStatus === 'approved').length;
    const pending = centreSessions.filter(s => !s.approvalStatus || s.approvalStatus === 'pending').length;
    const revision = centreSessions.filter(s => s.approvalStatus === 'revision_requested' || s.approvalStatus === 'revision_needed').length;
    const rejected = centreSessions.filter(s => s.approvalStatus === 'rejected').length;
    return {
      total: centreSessions.length,
      approved,
      pending,
      revision,
      rejected,
      sessions: centreSessions
    };
  };

  const selectedCentre = useMemo(() => centresList.find(c => (c._id || c.id) === selectedCentreId), [centresList, selectedCentreId]);

  const centreBaseSessions = useMemo(() => {
    if (!selectedCentreId) return [];
    return sessionsList.filter(s => {
      const matchesCentre = s.centreId === selectedCentreId || (s.centreId as any)?._id === selectedCentreId;
      if (!matchesCentre) return false;
      if (!isDateMatch(s.date)) return false;
      if (!isFellowBatchMatch(s.fellowId)) return false;
      if (filterCentreFellow !== "all" && s.fellowId !== filterCentreFellow) return false;
      return true;
    });
  }, [sessionsList, selectedCentreId, filterDate, filterMonth, filterYear, filterBatch, filterCentreFellow, fellowsList]);

  const centreApprovedCount = centreBaseSessions.filter(s => s.approvalStatus === 'approved').length;
  const centrePendingCount = centreBaseSessions.filter(s => !s.approvalStatus || s.approvalStatus === 'pending').length;
  const centreRevisionCount = centreBaseSessions.filter(s => s.approvalStatus === 'revision_requested' || s.approvalStatus === 'revision_needed').length;
  const centreRejectedCount = centreBaseSessions.filter(s => s.approvalStatus === 'rejected').length;
  const centreTotalCount = centreBaseSessions.length;

  const centreSessionsList = useMemo(() => {
    return centreBaseSessions.filter(s => isStatusMatch(s, filterStatus));
  }, [centreBaseSessions, filterStatus]);

  const attendanceCentreId = selectedCentreId || (activeSession?.centreId ? ((activeSession.centreId as any)?._id || activeSession.centreId) : null);

  const attendanceStudents = useMemo(() => {
    return studentsList
      .filter(s => {
        const sCid = (s.centreId as any)?._id || s.centreId;
        const matchesCentre = attendanceCentreId ? sCid === attendanceCentreId : true;
        const matchesSearch = s.name.toLowerCase().includes(attendanceSearchQuery.toLowerCase());
        return matchesCentre && matchesSearch;
      })
      .sort(compareStudentsByClassAndName);
  }, [studentsList, attendanceCentreId, attendanceSearchQuery]);

  const allFilteredSessionsList = useMemo(() => {
    return baseFilteredSessions.filter(s => {
      if (!isStatusMatch(s, filterStatus)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const centre = centresList.find(c => (c._id || c.id) === s.centreId || (s.centreId as any)?._id === (c._id || c.id));
      const fellow = fellowsList.find(f => (f._id || f.id) === s.fellowId);
      return (s.topic || "").toLowerCase().includes(q) ||
             (centre?.name || "").toLowerCase().includes(q) ||
             (fellow?.name || "").toLowerCase().includes(q);
    });
  }, [baseFilteredSessions, filterStatus, searchQuery, centresList, fellowsList]);

  const filteredCentres = useMemo(() => {
    return centresList.filter(c => {
      const assignedFellows = c.fellowIds.map(fid => fellowsList.find(f => f._id === fid || f.id === fid)?.name || "").join(" ").toLowerCase();
      const matchesSearch = c.name.toLowerCase().includes(centreSearchQuery.toLowerCase()) || 
                           c.location.toLowerCase().includes(centreSearchQuery.toLowerCase()) ||
                           assignedFellows.includes(centreSearchQuery.toLowerCase());
      const matchesType = filterType === "all" || c.type === filterType;
      
      const matchesBatch = filterBatch === "all" || c.fellowIds.some(fid => {
        const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
        return fellow?.batch === filterBatch;
      });

      const matchesFellow = filterCentreFellow === "all" || c.fellowIds.includes(filterCentreFellow);

      const stats = getCentreSessionStats(c);
      let matchesStatus = true;
      if (filterStatus === "approved") {
        matchesStatus = stats.approved > 0;
      } else if (filterStatus === "pending") {
        matchesStatus = stats.pending > 0;
      } else if (filterStatus === "revision_requested") {
        matchesStatus = stats.revision > 0;
      } else if (filterStatus === "rejected") {
        matchesStatus = stats.rejected > 0;
      }

      return matchesSearch && matchesType && matchesBatch && matchesFellow && matchesStatus;
    });
  }, [centresList, fellowsList, centreSearchQuery, filterType, filterBatch, filterCentreFellow, filterStatus, baseFilteredSessions]);

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <Card 
        onClick={() => setFilterStatus("all")}
        className={`glass-card-premium border-2 transition-all cursor-pointer hover:shadow-md ${filterStatus === "all" ? "border-primary/50 bg-primary/5 shadow-sm ring-2 ring-primary/20" : "border-border/40 hover:border-border"}`}
      >
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Sessions</p>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">{overallTotal}</h3>
            <p className="text-[10px] font-bold text-muted-foreground/80 mt-0.5">
              {filterDate ? formatDateDMY(filterDate) : filterMonth === "all" ? "All Time" : `${months.find(m => m.value === filterMonth)?.label || ""} ${filterYear}`}
            </p>
          </div>
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </CardContent>
      </Card>

      <Card 
        onClick={() => setFilterStatus(filterStatus === "approved" ? "all" : "approved")}
        className={`glass-card-premium border-2 transition-all cursor-pointer hover:shadow-md ${filterStatus === "approved" ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20" : "border-border/40 hover:border-emerald-200"}`}
      >
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Approved</p>
              {filterStatus === "approved" && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] font-black bg-emerald-600 text-white uppercase">Active</span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-700 mt-1">{overallApproved}</h3>
            <p className="text-[10px] font-bold text-emerald-600/80 mt-0.5">
              {overallTotal > 0 ? `${Math.round((overallApproved / overallTotal) * 100)}% of total` : "0% approved"}
            </p>
          </div>
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </CardContent>
      </Card>

      <Card 
        onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}
        className={`glass-card-premium border-2 transition-all cursor-pointer hover:shadow-md ${filterStatus === "pending" ? "border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20" : overallPending > 0 ? "border-amber-300/80 hover:border-amber-400" : "border-border/40"}`}
      >
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Pending Review</p>
              {overallPending > 0 && <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-amber-700 mt-1">{overallPending}</h3>
            <p className="text-[10px] font-bold text-amber-600/80 mt-0.5">
              {overallPending > 0 ? "Needs PM review" : "All reviewed"}
            </p>
          </div>
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </CardContent>
      </Card>

      <Card 
        onClick={() => setFilterStatus(filterStatus === "revision_requested" ? "all" : "revision_requested")}
        className={`glass-card-premium border-2 transition-all cursor-pointer hover:shadow-md ${filterStatus === "revision_requested" ? "border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-500/20" : overallRevision > 0 ? "border-orange-300/80 hover:border-orange-400" : "border-border/40 hover:border-orange-200"}`}
      >
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-700">Revision</p>
              {filterStatus === "revision_requested" && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] font-black bg-orange-600 text-white uppercase">Active</span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-orange-700 mt-1">{overallRevision}</h3>
            <p className="text-[10px] font-bold text-orange-600/80 mt-0.5">
              {overallRevision > 0 ? "Awaiting fellow update" : "0 in revision"}
            </p>
          </div>
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </CardContent>
      </Card>

      <Card 
        onClick={() => setFilterStatus(filterStatus === "rejected" ? "all" : "rejected")}
        className={`glass-card-premium border-2 transition-all cursor-pointer hover:shadow-md ${filterStatus === "rejected" ? "border-rose-500 bg-rose-50/50 shadow-sm ring-2 ring-rose-500/20" : "border-border/40 hover:border-rose-200"}`}
      >
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Rejected</p>
              {filterStatus === "rejected" && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] font-black bg-rose-600 text-white uppercase">Active</span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-rose-700 mt-1">{overallRejected}</h3>
            <p className="text-[10px] font-bold text-rose-600/80 mt-0.5">
              {overallRejected > 0 ? "Requires correction" : "0 rejected"}
            </p>
          </div>
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLogSessionButton = () => (
    <Button 
      onClick={() => {
        resetForm();
        if (selectedCentreId) setCentreId(selectedCentreId);
        setOpen(true);
      }}
      className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
    >
      <Plus className="h-4 w-4 mr-2" /> Log Session
    </Button>
  );

  const sessionModal = (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-primary p-6 md:p-8 text-white shrink-0">
          <DialogTitle className="text-2xl font-black tracking-tight">{editItem ? "Edit Session" : "Log New Session"}</DialogTitle>
          <p className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">
            Operation LTM · {selectedCentre?.name || "All Centres"}
          </p>
        </div>
        <ScrollArea className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-full">
          <div className="p-6 md:p-8 space-y-6">
            {!selectedCentreId && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Centre</Label>
                <Select value={centreId} onValueChange={setCentreId}>
                  <SelectTrigger className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11">
                    <SelectValue placeholder="Select Centre..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {centresList.map(c => (
                      <SelectItem key={c._id || c.id} value={c._id || c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                      <SelectItem key={f._id} value={f._id || f.id}>
                        {f.name} {f.batch ? `(${f.batch})` : ''}
                      </SelectItem>
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

            {/* Unified Documentation Section (Upload Directly OR Paste Cloud Link) */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-muted-foreground/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
                    Documentation (Photos / Videos)
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Upload files directly <span className="font-bold text-foreground">OR</span> paste an external link below.
                  </p>
                </div>
                {(sessionFiles.length > 0 || documentationLink.trim()) && (
                  <Badge className="bg-success/10 text-success border-none text-[10px] font-bold">
                    ✓ Documented
                  </Badge>
                )}
              </div>

              {/* Option 1: Direct File Upload */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Option 1: Upload Files Directly
                </span>
                <FileUpload
                  files={sessionFiles}
                  onFilesChange={setSessionFiles}
                  centreId={selectedCentreId || centreId || undefined}
                  centreName={selectedCentre?.name || centresList.find(c => (c._id || c.id) === (selectedCentreId || centreId))?.name}
                  context="Sessions"
                  date={date}
                  monthYear={`${months.find(m => m.value === filterMonth)?.label || 'Current'} ${filterYear}`}
                  label=""
                  maxFiles={20}
                />
              </div>

              {/* OR Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-muted-foreground/15"></div>
                <span className="flex-shrink mx-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-muted-foreground/10">
                  OR
                </span>
                <div className="flex-grow border-t border-muted-foreground/15"></div>
              </div>

              {/* Option 2: Paste External Cloud Link */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Option 2: Paste External Cloud Link
                </Label>
                <Input
                  placeholder="https://..."
                  value={documentationLink}
                  onChange={e => setDocumentationLink(e.target.value)}
                  className="rounded-xl border-muted-foreground/10 bg-background focus:bg-white transition-all h-10 text-xs"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="p-6 md:p-8 bg-muted/30 border-t flex justify-end gap-3 shrink-0">
          <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Cancel</Button></DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-primary/20"
          >
            {isSubmitting ? "Logging Session..." : (editItem ? "Save Changes" : "Confirm Log")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const isAnyFilterActive = filterDate !== "" || filterMonth !== new Date().getMonth().toString() || filterYear !== new Date().getFullYear().toString() || filterType !== "all" || filterBatch !== "all" || filterStatus !== "all" || filterCentreFellow !== "all" || centreSearchQuery !== "" || searchQuery !== "";

  const resetAllFilters = () => {
    setFilterDate("");
    setFilterMonth(new Date().getMonth().toString());
    setFilterYear(new Date().getFullYear().toString());
    setFilterType("all");
    setFilterBatch("all");
    setFilterStatus("all");
    setFilterCentreFellow("all");
    setCentreSearchQuery("");
    setSearchQuery("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!selectedCentreId ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="page-title">Sessions Log</h1>
              <p className="page-description uppercase tracking-[0.2em] text-[10px]">LTM Program Quality & Student Attendance Tracker</p>
            </div>
            <div className="flex items-center gap-3">
              {renderLogSessionButton()}
            </div>
          </div>

        {/* 2) Overall count of pending and approved session */}
        {renderStatsCards()}

        {/* Filters Bar */}
        <div className="bg-white/60 backdrop-blur-md p-3.5 rounded-[1.5rem] border border-white/40 shadow-lg space-y-3">
          {/* Top Row: Full-width Search Input + View Mode Switcher */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
              <Input 
                placeholder={viewMode === "centres" ? "Search centre by name, location, or fellow..." : "Search sessions by topic, centre, or fellow..."}
                className="pl-11 h-11 rounded-xl border-none shadow-sm bg-white font-bold text-xs w-full focus-visible:ring-primary/20" 
                value={viewMode === "centres" ? centreSearchQuery : searchQuery} 
                onChange={(e) => viewMode === "centres" ? setCentreSearchQuery(e.target.value) : setSearchQuery(e.target.value)} 
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-white border border-border/40 p-1 rounded-xl shadow-sm shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("centres")}
                className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 ${viewMode === "centres" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Centres</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("sessions")}
                className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 ${viewMode === "sessions" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>All Sessions</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/20">
            {/* 3) Date vise filter */}
            <div className="flex items-center gap-1.5 bg-white border border-border/40 rounded-xl px-2.5 h-10 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground shrink-0">Date</span>
              <Input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)} 
                className="h-8 w-[125px] border-none bg-transparent p-0 text-xs font-bold focus-visible:ring-0 cursor-pointer" 
              />
              {filterDate && (
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted rounded-md text-muted-foreground" onClick={() => setFilterDate("")}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Period Selects (Month / Year) */}
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[120px] h-10 rounded-xl bg-white border-border/40 shadow-sm text-xs font-bold">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {months.map(m => <SelectItem key={m.value} value={m.value} className="rounded-lg text-xs font-medium">{m.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[90px] h-10 rounded-xl bg-white border-border/40 shadow-sm text-xs font-bold">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {years.map(y => <SelectItem key={y} value={y} className="rounded-lg text-xs font-medium">{y === "all" ? "All Years" : y}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Programme Type (In-school vs After-school) */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px] h-10 rounded-xl bg-white border-border/40 shadow-sm text-xs font-bold">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="In-school">In-school</SelectItem>
                <SelectItem value="After-school">After-school</SelectItem>
              </SelectContent>
            </Select>

            {/* 4) Fellow batch vise filter */}
            <Select value={filterBatch} onValueChange={(val) => {
              setFilterBatch(val);
              if (filterCentreFellow !== "all") {
                const f = fellowsList.find(fellow => (fellow._id || fellow.id) === filterCentreFellow);
                if (f && f.batch && f.batch !== val && val !== "all") {
                  setFilterCentreFellow("all");
                }
              }
            }}>
              <SelectTrigger className="w-[120px] h-10 rounded-xl bg-white border-border/40 shadow-sm text-xs font-bold">
                <SelectValue placeholder="Batch" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                <SelectItem value="all">All Batches</SelectItem>
                {availableBatches.map(b => (
                  <SelectItem key={b} value={b}>Batch {b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 1) Show Pending & Approved Session filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-10 rounded-xl bg-white border-border/40 shadow-sm text-xs font-bold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved Only</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="revision_requested">Revision Requested</SelectItem>
                <SelectItem value="rejected">Rejected Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Fellow Filter (Admin/PM) */}
            {isAdmin && (
              <Select value={filterCentreFellow} onValueChange={setFilterCentreFellow}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-border/40 shadow-sm text-xs font-bold">
                  <SelectValue placeholder="Fellow" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                  <SelectItem value="all">All Fellows</SelectItem>
                  {fellowsList
                    .filter(f => filterBatch === "all" || f.batch === filterBatch)
                    .map(f => (
                      <SelectItem key={f._id || f.id} value={f._id || f.id}>
                        {f.name} {f.batch ? `(${f.batch})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            {isAnyFilterActive && (
              <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-10 px-3 text-xs font-bold text-muted-foreground hover:text-destructive ml-auto">
                Reset Filters
              </Button>
            )}
          </div>

          {/* Active filter pills & Reset button */}
          {isAnyFilterActive && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Active Filters:</span>
              {filterDate && (
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                  Date: {formatDateDMY(filterDate)}
                  <button onClick={() => setFilterDate("")} className="hover:bg-primary/10 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                </Badge>
              )}
              {filterBatch !== "all" && (
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                  Batch: {filterBatch}
                  <button onClick={() => setFilterBatch("all")} className="hover:bg-primary/10 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                </Badge>
              )}
              {filterType !== "all" && (
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                  Type: {filterType}
                  <button onClick={() => setFilterType("all")} className="hover:bg-primary/10 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                </Badge>
              )}
              {filterStatus !== "all" && (
                <Badge variant="outline" className={`text-[10px] font-bold gap-1 pr-1 ${filterStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : filterStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-300' : filterStatus === 'revision_requested' ? 'bg-orange-50 text-orange-700 border-orange-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>
                  Status: {filterStatus === 'approved' ? 'Approved' : filterStatus === 'pending' ? 'Pending' : filterStatus === 'revision_requested' ? 'Revision Requested' : 'Rejected'}
                  <button onClick={() => setFilterStatus("all")} className="hover:bg-black/10 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                </Badge>
              )}
              {filterCentreFellow !== "all" && (
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                  Fellow: {fellowsList.find(f => (f._id || f.id) === filterCentreFellow)?.name || filterCentreFellow}
                  <button onClick={() => setFilterCentreFellow("all")} className="hover:bg-primary/10 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-6 px-2 text-[10px] font-black uppercase text-muted-foreground hover:text-destructive">
                Reset All Filters
              </Button>
            </div>
          )}
        </div>

        {/* View Mode: Centres View */}
        {viewMode === "centres" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCentres.map(centre => {
              const cStats = getCentreSessionStats(centre);
              const studentCount = studentsList.filter(s => ((s.centreId as any)?._id || s.centreId) === (centre._id || centre.id)).length;
              const cId = centre._id || centre.id;
              
              return (
                <Card 
                  key={cId} 
                  className="glass-card-premium border-none hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
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

                  <CardContent className="space-y-3 pt-0">
                    <div className="border-t border-primary/5 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3" />
                          <span>{studentCount} Students</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <CalendarDays className="h-3 w-3" />
                          <span>{cStats.total} Sessions Logged</span>
                        </div>
                      </div>

                      {/* 1) Show Pending & Approved Session counts on Centre card */}
                      <div className="flex items-center justify-between gap-1 pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>{cStats.approved} Approved</span>
                          </Badge>
                          {cStats.pending > 0 ? (
                            <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-300 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                              <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                              <span>{cStats.pending} Pending</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-medium bg-gray-50/80 text-gray-400 border-gray-200/60 px-1.5 py-0.5 rounded-lg">
                              0 Pending
                            </Badge>
                          )}
                          {cStats.revision > 0 && (
                            <Badge variant="outline" className="text-[10px] font-bold bg-orange-50 text-orange-700 border-orange-200 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                              <RotateCcw className="h-3 w-3 text-orange-600" />
                              <span>{cStats.revision}</span>
                            </Badge>
                          )}
                          {cStats.rejected > 0 && (
                            <Badge variant="outline" className="text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              <span>{cStats.rejected}</span>
                            </Badge>
                          )}
                        </div>

                        {/* Fellow badges with batch version */}
                        <div className="flex flex-wrap gap-1 justify-end max-w-[130px]">
                          {centre.fellowIds?.map(fid => {
                            const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
                            return fellow ? (
                              <Badge key={fid} variant="outline" className="text-[8px] font-black uppercase py-0 h-4 border-primary/10 bg-primary/5 text-primary/70">
                                {fellow.name} {fellow.batch ? `(${fellow.batch})` : ''}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredCentres.length === 0 && (
              <div className="col-span-full text-center py-20 bg-muted/10 rounded-[3rem] border-2 border-dashed">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-sm font-bold text-muted-foreground mt-4">No centres match the current filters</p>
                <Button variant="outline" size="sm" onClick={resetAllFilters} className="mt-3 rounded-xl text-xs font-bold">
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* View Mode: All Sessions List across all centres */}
        {viewMode === "sessions" && (
          <div className="grid grid-cols-1 gap-4">
            {allFilteredSessionsList.map(s => {
              const centre = centresList.find(c => (c._id || c.id) === s.centreId || (s.centreId as any)?._id === (c._id || c.id));
              const fellow = fellowsList.find(f => (f._id || f.id) === s.fellowId);

              return (
                <Card key={s._id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden group bg-white">
                  <CardContent className="p-0 flex flex-col sm:flex-row">
                    <div className="p-6 sm:p-8 flex-1 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                            {formatDateDMY(s.date)}
                          </Badge>
                          {centre && (
                            <Badge variant="outline" className="bg-muted/50 text-foreground border-border/40 rounded-lg px-2.5 py-1 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-primary" /> {centre.name}
                            </Badge>
                          )}
                          {fellow && (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 rounded-lg px-2 py-1 font-bold text-[10px]">
                              {fellow.name} {fellow.batch ? `(${fellow.batch})` : ''}
                            </Badge>
                          )}
                          {s.isMusicBus && (
                            <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20 rounded-lg px-2 py-1 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                              <Truck className="h-3 w-3" /> Music Bus
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">{s.duration} mins</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{s.topic}</h3>
                        {s.approvalStatus === 'approved' && (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-emerald-600 text-white font-bold">Approved</Badge>
                            {getReviewerInfo(s) && (
                              <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                                by {getReviewerInfo(s)?.name}
                              </Badge>
                            )}
                          </div>
                        )}
                        {s.approvalStatus === 'rejected' && (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-rose-600 text-white font-bold">Rejected</Badge>
                            {getReviewerInfo(s) && (
                              <Badge variant="outline" className="text-[10px] font-bold text-rose-700 bg-rose-50 border-rose-200">
                                by {getReviewerInfo(s)?.name}
                              </Badge>
                            )}
                          </div>
                        )}
                        {(s.approvalStatus === 'revision_requested' || s.approvalStatus === 'revision_needed') && (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-orange-600 text-white font-bold flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" /> Revision Requested
                            </Badge>
                            {getReviewerInfo(s) && (
                              <Badge variant="outline" className="text-[10px] font-bold text-orange-700 bg-orange-50 border-orange-200">
                                by {getReviewerInfo(s)?.name}
                              </Badge>
                            )}
                          </div>
                        )}
                        {(!s.approvalStatus || s.approvalStatus === 'pending') && (
                          <Badge className="bg-amber-500 text-white font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Pending Review
                          </Badge>
                        )}
                      </div>

                      {(s.approvalStatus === 'revision_requested' || s.approvalStatus === 'revision_needed') && (s.reviewNote || (getReviewerInfo(s))) && (
                        <div className="bg-orange-50 text-orange-800 text-sm p-3.5 rounded-xl space-y-1.5 border border-orange-200">
                          {s.reviewNote && (
                            <div>
                              <strong className="font-bold">Revision Requested:</strong> {s.reviewNote}
                            </div>
                          )}
                          {getReviewerInfo(s) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-orange-700 pt-1.5 border-t border-orange-200/60">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 font-black text-[11px] uppercase tracking-wider">
                                Requested by:
                              </span>
                              <span className="font-black text-orange-800 text-sm">
                                {getReviewerInfo(s)?.name}
                              </span>
                              {getReviewerInfo(s)?.role && (
                                <span className="text-muted-foreground font-medium text-xs">
                                  ({getReviewerInfo(s)?.role})
                                </span>
                              )}
                              {s.reviewedAt && (
                                <span className="text-muted-foreground/80 font-normal text-xs ml-auto">
                                  on {formatDateDMY(s.reviewedAt)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {s.approvalStatus === 'rejected' && (s.reviewNote || (getReviewerInfo(s))) && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3.5 rounded-xl space-y-1.5 border border-destructive/20">
                          {s.reviewNote && (
                            <div>
                              <strong className="font-bold">Rejection Note:</strong> {s.reviewNote}
                            </div>
                          )}
                          {getReviewerInfo(s) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-destructive/90 pt-1.5 border-t border-destructive/15">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/15 text-destructive font-black text-[11px] uppercase tracking-wider">
                                Rejected by:
                              </span>
                              <span className="font-black text-destructive text-sm">
                                {getReviewerInfo(s)?.name}
                              </span>
                              {getReviewerInfo(s)?.role && (
                                <span className="text-muted-foreground font-medium text-xs">
                                  ({getReviewerInfo(s)?.role})
                                </span>
                              )}
                              {s.reviewedAt && (
                                <span className="text-muted-foreground/80 font-normal text-xs ml-auto">
                                  on {formatDateDMY(s.reviewedAt)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {s.approvalStatus === 'approved' && (s.reviewNote || (getReviewerInfo(s))) && (
                        <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-xl space-y-1.5 border border-emerald-200">
                          {s.reviewNote && (
                            <div>
                              <strong className="font-bold">Review Note:</strong> {s.reviewNote}
                            </div>
                          )}
                          {getReviewerInfo(s) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-emerald-700 pt-1.5 border-t border-emerald-200/60">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
                                Approved by:
                              </span>
                              <span className="font-black text-emerald-800 text-sm">
                                {getReviewerInfo(s)?.name}
                              </span>
                              {getReviewerInfo(s)?.role && (
                                <span className="text-muted-foreground font-medium text-xs">
                                  ({getReviewerInfo(s)?.role})
                                </span>
                              )}
                              {s.reviewedAt && (
                                <span className="text-muted-foreground/80 font-normal text-xs ml-auto">
                                  on {formatDateDMY(s.reviewedAt)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Attendance</span>
                          <span className="text-sm font-black flex items-center gap-1.5 mt-0.5"><Users className="h-4 w-4 text-info" />{s.studentsPresent} students</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Session Plan</span>
                          {s.sessionPlanLink ? (
                            <button onClick={() => setViewPlanText(s.sessionPlanLink!)} className="text-xs font-bold text-success mt-0.5 flex items-center gap-1 hover:underline cursor-pointer">
                              <CheckCircle2 className="h-3 w-3" /> View Plan
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-destructive mt-0.5">Missing Plan</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Documentation</span>
                          {s.documentationLink ? (
                            <a href={s.documentationLink.startsWith('http') ? s.documentationLink : `https://${s.documentationLink}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-success hover:underline mt-0.5 flex items-center gap-1">
                              View Link <CheckCircle2 className="h-3 w-3" />
                            </a>
                          ) : (s.files && s.files.length > 0) ? (
                            <span className="text-xs font-bold text-success mt-0.5 flex items-center gap-1">
                              {s.files.length} File{s.files.length > 1 ? 's' : ''} Attached <CheckCircle2 className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-destructive mt-0.5">Missing Media</span>
                          )}
                        </div>
                      </div>

                      {s.files && s.files.length > 0 && (
                        <FileGallery files={s.files} title="Media & Attachments" />
                      )}
                    </div>

                    <div className="bg-muted/30 sm:w-64 p-6 sm:p-8 flex flex-col justify-center gap-2.5 border-t sm:border-t-0 sm:border-l">
                      <Button className="w-full rounded-xl h-10 font-black uppercase tracking-widest text-[10px]" onClick={() => openAttendance(s)}>
                        <ClipboardCheck className="h-4 w-4 mr-2" /> Mark Attendance
                      </Button>
                      {isAdmin && (
                        <Button variant="outline" className="w-full rounded-xl h-10 font-black uppercase tracking-widest text-[10px] border-primary/20 text-primary hover:bg-primary/5" onClick={() => openReview(s)}>
                          Review Session
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-muted-foreground/20" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        {isMEManager && (
                          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(s._id)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {allFilteredSessionsList.length === 0 && (
              <div className="text-center py-20 bg-muted/10 rounded-[3rem] border-2 border-dashed">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-sm font-bold text-muted-foreground mt-4">No sessions found matching the active filters</p>
                <Button variant="outline" size="sm" onClick={resetAllFilters} className="mt-3 rounded-xl text-xs font-bold">
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    ) : (
      <div className="space-y-6">
        <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedCentreId(null)} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm border border-transparent hover:border-primary/20 hover:text-primary transition-all shrink-0">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-3xl font-[950] tracking-tighter text-foreground">{selectedCentre?.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge 
                  variant="outline" 
                  onClick={() => setFilterStatus(filterStatus === 'approved' ? 'all' : 'approved')}
                  className={`cursor-pointer transition-all hover:scale-105 active:scale-95 text-[10px] font-bold flex items-center gap-1 ${
                    filterStatus === 'approved' 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{centreApprovedCount} Approved</span>
                </Badge>
                <Badge 
                  variant="outline" 
                  onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
                  className={`cursor-pointer transition-all hover:scale-105 active:scale-95 text-[10px] font-bold flex items-center gap-1 ${
                    filterStatus === 'pending' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/20' 
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  <span>{centrePendingCount} Pending</span>
                </Badge>
                {centreRevisionCount > 0 && (
                  <Badge 
                    variant="outline" 
                    onClick={() => setFilterStatus(filterStatus === 'revision_requested' ? 'all' : 'revision_requested')}
                    className={`cursor-pointer transition-all hover:scale-105 active:scale-95 text-[10px] font-bold flex items-center gap-1 ${
                      filterStatus === 'revision_requested' 
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-500/20' 
                        : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                    }`}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{centreRevisionCount} Revision</span>
                  </Badge>
                )}
                {centreRejectedCount > 0 && (
                  <Badge 
                    variant="outline" 
                    onClick={() => setFilterStatus(filterStatus === 'rejected' ? 'all' : 'rejected')}
                    className={`cursor-pointer transition-all hover:scale-105 active:scale-95 text-[10px] font-bold flex items-center gap-1 ${
                      filterStatus === 'rejected' 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-500/20' 
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="h-3 w-3" />
                    <span>{centreRejectedCount} Rejected</span>
                  </Badge>
                )}
                <span 
                  onClick={() => setFilterStatus('all')}
                  className={`cursor-pointer hover:underline text-[10px] font-medium uppercase tracking-[0.2em] ${filterStatus === 'all' ? 'text-primary font-black' : 'text-muted-foreground'}`}
                >
                  | {centreTotalCount} Sessions Total
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderLogSessionButton()}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md p-3.5 rounded-[1.5rem] border border-white/40 shadow-lg space-y-3">
          {/* Top: Full width Search */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
            <Input 
              placeholder="Search sessions by topic or theme..." 
              className="pl-11 h-11 rounded-xl border-none shadow-sm bg-white font-bold text-xs w-full focus-visible:ring-primary/20" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          {/* Bottom: Filter controls */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/20">
            <div className="flex items-center gap-1.5 bg-white border border-border/40 rounded-xl px-2.5 h-10 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground shrink-0">Date</span>
              <Input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)} 
                className="h-8 w-[125px] border-none bg-transparent p-0 text-xs font-bold focus-visible:ring-0 cursor-pointer" 
              />
              {filterDate && (
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted rounded-md text-muted-foreground" onClick={() => setFilterDate("")}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="h-10 rounded-xl border-border/40 bg-white font-bold text-xs w-[120px] shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="h-10 rounded-xl border-border/40 bg-white font-bold text-xs w-[85px] shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                {years.map(y => <SelectItem key={y} value={y}>{y === "all" ? "All Years" : y}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Fellow Batch filter */}
            <Select value={filterBatch} onValueChange={(val) => {
              setFilterBatch(val);
              if (filterCentreFellow !== "all") {
                const f = fellowsList.find(fellow => (fellow._id || fellow.id) === filterCentreFellow);
                if (f && f.batch && f.batch !== val && val !== "all") {
                  setFilterCentreFellow("all");
                }
              }
            }}>
              <SelectTrigger className="w-[120px] h-10 rounded-xl bg-white border-border/40 shadow-sm text-xs font-bold">
                <SelectValue placeholder="Batch" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                <SelectItem value="all">All Batches</SelectItem>
                {availableBatches.map(b => (
                  <SelectItem key={b} value={b}>Batch {b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-10 rounded-xl border-border/40 bg-white font-bold text-xs w-[130px] shadow-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved Only</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="revision_requested">Revision Requested</SelectItem>
                <SelectItem value="rejected">Rejected Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Fellow Filter (Admin/PM) */}
            {isAdmin && (
              <Select value={filterCentreFellow} onValueChange={setFilterCentreFellow}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-border/40 shadow-sm text-xs font-bold">
                  <SelectValue placeholder="Fellow" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-1 max-h-[300px]">
                  <SelectItem value="all">All Fellows</SelectItem>
                  {fellowsList
                    .filter(f => selectedCentre?.fellowIds?.includes(f._id || f.id) || !selectedCentre)
                    .map(f => (
                      <SelectItem key={f._id || f.id} value={f._id || f.id}>
                        {f.name} {f.batch ? `(${f.batch})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            {isAnyFilterActive && (
              <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-10 px-3 text-xs font-bold text-muted-foreground hover:text-destructive ml-auto">
                Reset Filters
              </Button>
            )}
          </div>

          {/* Active filter pills */}
          {isAnyFilterActive && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Active Filters:</span>
              {filterDate && (
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                  Date: {formatDateDMY(filterDate)}
                  <button onClick={() => setFilterDate("")} className="hover:bg-primary/10 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                </Badge>
              )}
              {filterBatch !== "all" && (
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                  Batch: {filterBatch}
                  <button onClick={() => setFilterBatch("all")} className="hover:bg-primary/10 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                </Badge>
              )}
              {filterStatus !== "all" && (
                <Badge variant="outline" className={`text-[10px] font-bold gap-1 pr-1 ${filterStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : filterStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-300' : filterStatus === 'revision_requested' ? 'bg-orange-50 text-orange-700 border-orange-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>
                  Status: {filterStatus === 'approved' ? 'Approved' : filterStatus === 'pending' ? 'Pending' : filterStatus === 'revision_requested' ? 'Revision Requested' : 'Rejected'}
                  <button onClick={() => setFilterStatus("all")} className="hover:bg-black/10 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                </Badge>
              )}
              {filterCentreFellow !== "all" && (
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                  Fellow: {fellowsList.find(f => (f._id || f.id) === filterCentreFellow)?.name || filterCentreFellow}
                  <button onClick={() => setFilterCentreFellow("all")} className="hover:bg-primary/10 rounded p-0.5"><X className="h-2.5 w-2.5" /></button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-6 px-2 text-[10px] font-black uppercase text-muted-foreground hover:text-destructive">
                Reset All Filters
              </Button>
            </div>
          )}
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
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{s.topic}</h3>
                  {s.approvalStatus === 'approved' && (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-success text-white">Approved</Badge>
                      {getReviewerInfo(s) && (
                        <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                          by {getReviewerInfo(s)?.name}
                        </Badge>
                      )}
                    </div>
                  )}
                  {s.approvalStatus === 'rejected' && (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-destructive text-white">Rejected</Badge>
                      {getReviewerInfo(s) && (
                        <Badge variant="outline" className="text-[10px] font-bold text-rose-700 bg-rose-50 border-rose-200">
                          by {getReviewerInfo(s)?.name}
                        </Badge>
                      )}
                    </div>
                  )}
                  {(s.approvalStatus === 'revision_requested' || s.approvalStatus === 'revision_needed') && (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-orange-600 text-white font-bold flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" /> Revision Requested
                      </Badge>
                      {getReviewerInfo(s) && (
                        <Badge variant="outline" className="text-[10px] font-bold text-orange-700 bg-orange-50 border-orange-200">
                          by {getReviewerInfo(s)?.name}
                        </Badge>
                      )}
                    </div>
                  )}
                  {(!s.approvalStatus || s.approvalStatus === 'pending') && <Badge className="bg-warning text-white">Pending Review</Badge>}
                </div>
                {(s.approvalStatus === 'revision_requested' || s.approvalStatus === 'revision_needed') && (s.reviewNote || (getReviewerInfo(s))) && (
                  <div className="bg-orange-50 text-orange-800 text-sm p-3.5 rounded-xl space-y-1.5 border border-orange-200">
                    {s.reviewNote && (
                      <div>
                        <strong className="font-bold">Revision Requested:</strong> {s.reviewNote}
                      </div>
                    )}
                    {getReviewerInfo(s) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-orange-700 pt-1.5 border-t border-orange-200/60">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 font-black text-[11px] uppercase tracking-wider">
                          Requested by:
                        </span>
                        <span className="font-black text-orange-800 text-sm">
                          {getReviewerInfo(s)?.name}
                        </span>
                        {getReviewerInfo(s)?.role && (
                          <span className="text-muted-foreground font-medium text-xs">
                            ({getReviewerInfo(s)?.role})
                          </span>
                        )}
                        {s.reviewedAt && (
                          <span className="text-muted-foreground/80 font-normal text-xs ml-auto">
                            on {formatDateDMY(s.reviewedAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {s.approvalStatus === 'rejected' && (s.reviewNote || (getReviewerInfo(s))) && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3.5 rounded-xl space-y-1.5 border border-destructive/20">
                    {s.reviewNote && (
                      <div>
                        <strong className="font-bold">Rejection Note:</strong> {s.reviewNote}
                      </div>
                    )}
                    {getReviewerInfo(s) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-destructive/90 pt-1.5 border-t border-destructive/15">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/15 text-destructive font-black text-[11px] uppercase tracking-wider">
                          Rejected by:
                        </span>
                        <span className="font-black text-destructive text-sm">
                          {getReviewerInfo(s)?.name}
                        </span>
                        {getReviewerInfo(s)?.role && (
                          <span className="text-muted-foreground font-medium text-xs">
                            ({getReviewerInfo(s)?.role})
                          </span>
                        )}
                        {s.reviewedAt && (
                          <span className="text-muted-foreground/80 font-normal text-xs ml-auto">
                            on {formatDateDMY(s.reviewedAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {s.approvalStatus === 'approved' && (s.reviewNote || (getReviewerInfo(s))) && (
                  <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-xl space-y-1.5 border border-emerald-200">
                    {s.reviewNote && (
                      <div>
                        <strong className="font-bold">Review Note:</strong> {s.reviewNote}
                      </div>
                    )}
                    {getReviewerInfo(s) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-emerald-700 pt-1.5 border-t border-emerald-200/60">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
                          Approved by:
                        </span>
                        <span className="font-black text-emerald-800 text-sm">
                          {getReviewerInfo(s)?.name}
                        </span>
                        {getReviewerInfo(s)?.role && (
                          <span className="text-muted-foreground font-medium text-xs">
                            ({getReviewerInfo(s)?.role})
                          </span>
                        )}
                        {s.reviewedAt && (
                          <span className="text-muted-foreground/80 font-normal text-xs ml-auto">
                            on {formatDateDMY(s.reviewedAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                      <a href={s.documentationLink.startsWith('http') ? s.documentationLink : `https://${s.documentationLink}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-success hover:underline mt-0.5 flex items-center gap-1">View Link <CheckCircle2 className="h-3 w-3" /></a>
                    ) : (s.files && s.files.length > 0) ? (
                      <span className="text-xs font-bold text-success mt-0.5 flex items-center gap-1">
                        {s.files.length} File{s.files.length > 1 ? 's' : ''} Attached <CheckCircle2 className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-destructive mt-0.5">Missing Media</span>
                    )}
                  </div>
                </div>

                {s.files && s.files.length > 0 && (
                  <FileGallery files={s.files} title="Media & Attachments" />
                )}
              </div>
              <div className="bg-muted/30 sm:w-64 p-8 flex flex-col justify-center gap-3 border-l">
                <Button className="w-full rounded-xl h-10 font-black uppercase tracking-widest text-[10px]" onClick={() => openAttendance(s)}>
                  <ClipboardCheck className="h-4 w-4 mr-2" /> Mark Attendance
                </Button>
                {isAdmin && (
                  <Button variant="outline" className="w-full rounded-xl h-10 font-black uppercase tracking-widest text-[10px] border-primary/20 text-primary hover:bg-primary/5" onClick={() => openReview(s)}>
                    Review Session
                  </Button>
                )}
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
    </div>
    )}

      {/* Shared Session Log / Edit Dialog */}
      {sessionModal}

      {/* Shared Quick Attendance Dialog */}
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
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-lg text-[10px] font-black uppercase h-8 px-4" 
                onClick={() => {
                  const allIds = studentsList
                    .filter(s => {
                      const sCid = (s.centreId as any)?._id || s.centreId;
                      return attendanceCentreId ? sCid === attendanceCentreId : true;
                    })
                    .map(s => s._id || s.id);
                  setCheckedStudentIds(allIds);
                }}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg text-[10px] font-black uppercase h-8 px-4 bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary" 
                onClick={() => setCheckedStudentIds([])}
              >
                Clear All
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[340px] p-8">
            <div className="space-y-3">
              {attendanceStudents.map(s => {
                const sId = s._id || s.id;
                const isChecked = checkedStudentIds.includes(sId);
                return (
                  <div 
                    key={sId} 
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${isChecked ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/20'}`} 
                    onClick={() => setCheckedStudentIds(prev => prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId])}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${isChecked ? 'bg-primary text-white' : 'bg-muted text-transparent'}`}>
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-sm font-black tracking-tight">{s.name}</span>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-0.5">
                          {[s.age ? `Age ${s.age}` : null, s.gender, (s.grade || s.section) ? `Class ${s.grade || ''}${s.section ? `-${s.section}` : ''}`.trim() : null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                    {(s.grade || s.section) && (
                      <Badge variant="outline" className="rounded-lg text-[10px] font-bold opacity-70 uppercase">{s.grade || ''}{s.section ? `-${s.section}` : ''}</Badge>
                    )}
                  </div>
                );
              })}
              {attendanceStudents.length === 0 && (
                <div className="text-center py-8 text-xs font-bold text-muted-foreground">
                  No students found for this centre.
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="px-8 pb-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
              Review Note <span className="font-medium text-muted-foreground/50 normal-case tracking-normal">(optional)</span>
            </label>
            <Textarea
              placeholder="Add session reflections, key observations, or any attendance remarks..."
              value={attendanceReviewNote}
              onChange={(e) => setAttendanceReviewNote(e.target.value)}
              className="rounded-2xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all text-xs min-h-[70px] resize-none"
            />
          </div>
          <div className="px-8 pb-8 bg-muted/30 border-t pt-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{checkedStudentIds.length} Selected</span>
            <div className="flex gap-3">
              <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Cancel</Button></DialogClose>
              <Button className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] disabled:pointer-events-none disabled:opacity-50" onClick={handleSaveAttendance} disabled={isSubmittingAttendance}>{isSubmittingAttendance ? "Saving..." : "Save Attendance"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Review Session Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-[400px] rounded-[2rem] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">Review Session</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest">
              {reviewSession?.topic}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
              <Select value={reviewStatus} onValueChange={(val: 'approved' | 'rejected' | 'revision_requested') => setReviewStatus(val)}>
                <SelectTrigger className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white h-11 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="approved" className="text-success font-bold">Approve</SelectItem>
                  <SelectItem value="revision_requested" className="text-orange-600 font-bold">Request Revision</SelectItem>
                  <SelectItem value="rejected" className="text-destructive font-bold">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(reviewStatus === 'rejected' || reviewStatus === 'revision_requested' || reviewNote) && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {reviewStatus === 'revision_requested' ? "Revision Instructions" : "Review Note"} {(reviewStatus === 'rejected' || reviewStatus === 'revision_requested') && <span className="text-destructive">*</span>}
                </Label>
                <Textarea 
                  placeholder={
                    reviewStatus === 'revision_requested' 
                      ? "Explain what the fellow needs to update (e.g. upload missing media, correct student attendance, or update session plan)..." 
                      : reviewStatus === 'rejected' 
                        ? "Why is this session rejected?" 
                        : "Optional note..."
                  }
                  value={reviewNote} 
                  onChange={e => setReviewNote(e.target.value)} 
                  className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white min-h-[100px] resize-none text-xs" 
                />
                {reviewStatus === 'revision_requested' && (
                  <p className="text-[11px] text-muted-foreground">
                    A notification with your instructions will be sent directly to the fellow.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="pt-6 flex gap-2">
            <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold flex-1">Cancel</Button></DialogClose>
            <Button 
              onClick={handleReviewSubmit} 
              disabled={isSubmittingReview} 
              className={`rounded-xl font-black uppercase tracking-widest text-[10px] flex-1 ${
                reviewStatus === 'approved' 
                  ? 'bg-success hover:bg-success/90 text-white' 
                  : reviewStatus === 'revision_requested'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-destructive hover:bg-destructive/90 text-white'
              }`}
            >
              {isSubmittingReview ? "Saving..." : reviewStatus === 'approved' ? "Approve" : reviewStatus === 'revision_requested' ? "Request Revision" : "Reject"}
            </Button>
          </DialogFooter>
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
