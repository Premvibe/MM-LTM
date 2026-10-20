import { useState, useMemo, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, GraduationCap, MapPin, Search, Filter, Users, ClipboardCheck, Music, Sparkles, LayoutGrid, Save, X, Info, CalendarDays, CheckCircle2, Building2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export const RUBRIC_POINTERS: Record<string, { title: string; subtitle: string; levels: { score: number; desc: string }[] }> = {
  involvement: {
    title: "Involvement",
    subtitle: "Class engagement & student presence",
    levels: [
      { score: 1, desc: "Almost no involvement; just moving through; withdrawn" },
      { score: 2, desc: "Very little spontaneous involvement" },
      { score: 3, desc: "Calmly involved" },
      { score: 4, desc: "Active involvement and engagement" },
      { score: 5, desc: "Hyperactive" }
    ]
  },
  emotion: {
    title: "Emotion",
    subtitle: "Emotional disclosure & affective expression",
    levels: [
      { score: 1, desc: "None-both in appearance and active denial" },
      { score: 2, desc: "Disclosure of a very superficial nature" },
      { score: 3, desc: "Disclosure of a personal nature but not of an emotional nature" },
      { score: 4, desc: "Disclosure of an emotional affective nature within an appropriate context" },
      { score: 5, desc: "Disclosures of an emotional and affective nature- spilling out" }
    ]
  },
  creativity: {
    title: "Creativity",
    subtitle: "Originality in play & group activities",
    levels: [
      { score: 1, desc: "No contribution to games and activities at all" },
      { score: 2, desc: "No active contribution, barely responds, but present" },
      { score: 3, desc: "Contributing actively. Repetitive, follows and imitates others" },
      { score: 4, desc: "Original in ideas and play. Brings meaning to group work" },
      { score: 5, desc: "Too erratic. Wants to follow patterns that are out of context" }
    ]
  },
  interaction: {
    title: "Interaction",
    subtitle: "Social exchange & attentive listening",
    levels: [
      { score: 1, desc: "None. Lost in his/her own world" },
      { score: 2, desc: "Very little interaction. Responds to others intermittently" },
      { score: 3, desc: "Responds and interacts, though slightly subdued" },
      { score: 4, desc: "Listens attentively and responds. Completes a transaction appropriately" },
      { score: 5, desc: "Very overt and continuous attention seeking. Does not listen attentively" }
    ]
  },
  sur: {
    title: "Sur / Melody",
    subtitle: "Pitch, tonal accuracy & vocal melody",
    levels: [
      { score: 1, desc: "Poor" },
      { score: 2, desc: "Basic" },
      { score: 3, desc: "Good" },
      { score: 4, desc: "Very Good" },
      { score: 5, desc: "Excellent" }
    ]
  },
  laya: {
    title: "Lay / Rythm",
    subtitle: "Rhythmic pulse, tempo & groove",
    levels: [
      { score: 1, desc: "Poor" },
      { score: 2, desc: "Basic" },
      { score: 3, desc: "Good" },
      { score: 4, desc: "Very Good" },
      { score: 5, desc: "Excellent" }
    ]
  },
  word: {
    title: "Words / Speech",
    subtitle: "Pronunciation, diction & lyrical clarity",
    levels: [
      { score: 1, desc: "Poor" },
      { score: 2, desc: "Basic" },
      { score: 3, desc: "Good" },
      { score: 4, desc: "Very Good" },
      { score: 5, desc: "Excellent" }
    ]
  },
  bhav: {
    title: "Bhav / Emotions",
    subtitle: "Musical feeling, expressiveness & soul",
    levels: [
      { score: 1, desc: "Poor" },
      { score: 2, desc: "Basic" },
      { score: 3, desc: "Good" },
      { score: 4, desc: "Very Good" },
      { score: 5, desc: "Excellent" }
    ]
  }
};

export const getRubric = (key: string) => {
  const norm = (key || "").toLowerCase().trim();
  if (norm.includes("involve")) return RUBRIC_POINTERS.involvement;
  if (norm.includes("emotion") && !norm.includes("bhav")) return RUBRIC_POINTERS.emotion;
  if (norm.includes("creativ")) return RUBRIC_POINTERS.creativity;
  if (norm.includes("interact")) return RUBRIC_POINTERS.interaction;
  if (norm.includes("sur") || norm.includes("melody")) return RUBRIC_POINTERS.sur;
  if (norm.includes("lay") || norm.includes("rythm") || norm.includes("rhythm")) return RUBRIC_POINTERS.laya;
  if (norm.includes("word") || norm.includes("speech")) return RUBRIC_POINTERS.word;
  if (norm.includes("bhav")) return RUBRIC_POINTERS.bhav;
  return null;
};

const RubricHeader = ({
  categoryKey,
  label,
  className = "",
  badgeColor = "text-foreground"
}: {
  categoryKey: string;
  label?: string;
  className?: string;
  badgeColor?: string;
}) => {
  const rubric = getRubric(categoryKey);
  const display = label || (rubric ? rubric.title : categoryKey);

  if (!rubric) {
    return <span className={className}>{display}</span>;
  }

  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <div className={`inline-flex items-center justify-center gap-1 cursor-help group py-0.5 select-none ${className}`}>
          <span className={`border-b border-dashed border-muted-foreground/50 group-hover:border-primary group-hover:text-primary transition-colors ${badgeColor}`}>
            {display}
          </span>
          <Info className="h-2.5 w-2.5 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="center"
        sideOffset={6}
        className="p-0 border-none bg-transparent shadow-2xl z-50 overflow-visible"
      >
        <div className="w-80 sm:w-88 p-3.5 bg-slate-900/98 text-slate-100 rounded-2xl shadow-2xl border border-slate-700/80 text-xs backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="font-black text-xs uppercase tracking-wider text-amber-300">
                  {rubric.title} (1-5)
                </p>
                <p className="text-[10px] text-slate-400 font-medium">{rubric.subtitle}</p>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Rubric
            </span>
          </div>
          <div className="space-y-1.5 text-left">
            {rubric.levels.map((lvl) => (
              <div key={lvl.score} className="flex items-start gap-2.5 p-1 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span
                  className={`inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-black shrink-0 ${
                    lvl.score === 1
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : lvl.score === 2
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : lvl.score === 3
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      : lvl.score === 4
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {lvl.score}
                </span>
                <span className="text-[11px] text-slate-200 leading-snug flex-1 pt-0.5">
                  {lvl.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const SCORE_LABELS = {
  1: "Basic",
  2: "Good",
  3: "Very Good",
  4: "Excellent",
  5: "Outstanding"
};

const SEL_CATEGORIES = ["Involvement", "Emotion", "Creativity", "Interaction"];

const LEADING_QUESTIONS = {
  self: [
    "How difficult is it for you to ask questions in class?",
    "How difficult is it for you to finish work, even when it is hard?",
    "How difficult is it for you to share your feelings with others?",
    "How difficult is it for you to ask others for feedback?",
    "How difficult is it for you to talk about yourself and your family?",
    "How difficult is it for you to set goals for yourself?",
    "How difficult is it for you to ask for help?"
  ],
  other: [
    "How difficult is it for you to make new friends in your class?",
    "How difficult is it for you to share things with your friends?",
    "How difficult is it for you to say sorry when you make a mistake?",
    "How difficult is it for you to work in a group?",
    "How difficult is it for you to learn from people with different opinions?",
    "How difficult is it for you to know how someone is feeling by looking at their face?"
  ],
  community: [
    "How difficult is it for you to understand problems in your class or school?",
    "How difficult is it for you to speak up when you see something unfair?",
    "How difficult is it for you to speak about your community?",
    "How difficult is it for you to be a leader?",
    "How difficult is it for you to solve problems that affect both you and your classmates?",
    "How difficult is it for you to solve problems at home?"
  ]
};

const AFTER_SCHOOL_QUESTIONS = {
  background: [
    { id: "formalEducation", q: "Have you received formal music education from somewhere else?", type: "select", options: ["Yes", "No"] },
    { id: "duration", q: "If yes, how long did you undergo it?", type: "select", options: ["1-2 Weeks", "1-6 Months", "Minimum 1 Year", "More than 1 Year", "Never"] },
  ],
  knowledge: [
    { id: "alankar", q: "Do you know about Alankar in music?", type: "select", options: ["Yes", "No"] },
    { id: "singAlankar", q: "Do you know how to sing/Play Alankar?", type: "select", options: ["Yes", "No", "Maybe"] },
    { id: "notes", q: "Do you know about 'high' and 'low' notes in music?", type: "select", options: ["Yes", "No"] },
    { id: "overlap", q: "Do you understand overlap in Music?", type: "select", options: ["Yes", "No"] },
    { id: "harmony", q: "Do you know about Harmony in music?", type: "select", options: ["Yes", "No"] },
  ],
  engagement: [
    { id: "shareTalent", q: "Have you thought about sharing your musical talent with others?", type: "select", options: ["Yes", "No"] },
    { id: "instagram", q: "I post my musical videos on my Instagram account.", type: "select", options: ["Never", "Sometimes", "1 in week", "3 to 4 in week", "Regularly"] },
    { id: "stageCount", q: "How many times have you performed on stage until now?", type: "number" },
    { id: "stageConfidence", q: "I feel confident while performing on stage.", type: "select", options: ["Yes", "No", "Sometimes"] },
    { id: "paidPerformance", q: "I have done at least 1 paid music performance in last year.", type: "select", options: ["Yes", "No"] },
  ],
  vision: [
    { id: "career", q: "Do you see yourself pursuing music as a career?", type: "select", options: ["Yes", "No", "Maybe", "I haven't decided yet"] },
    { id: "parentSupport", q: "Do your parents support your music education?", type: "select", options: ["Yes", "No", "I don't know"] },
    { id: "professionalSupport", q: "Do you see your parents supporting you in becoming a professional musician?", type: "select", options: ["Yes", "No", "Maybe", "Can't say"] },
    { id: "neededSupport", q: "What kind of support do you think you would need?", type: "text" },
  ]
};

const ScoreCell = ({ score }: { score: number }) => {
  const colors = ["bg-muted text-muted-foreground", "bg-destructive/10 text-destructive", "bg-warning/10 text-warning", "bg-accent/10 text-accent", "bg-info/10 text-info", "bg-success/10 text-success"];
  const label = SCORE_LABELS[score as keyof typeof SCORE_LABELS] || "-";
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-black ${colors[score]}`}>{score || "-"}</span>
      <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/40">{label}</span>
    </span>
  );
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

const AssessmentsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCentreId = searchParams.get("centre");
  const setSelectedCentreId = (id: string | null) => {
    if (id) setSearchParams({ centre: id });
    else setSearchParams({});
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [centres, setCentres] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fellowsList, setFellowsList] = useState<any[]>([]);
  const [assessmentsData, setAssessmentsData] = useState<any[]>([]);
  const [sessionsData, setSessionsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [centreSearchQuery, setCentreSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterFellow, setFilterFellow] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("SEL");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState("Monthly-Evaluation");
  const [activePhase, setActivePhase] = useState("Pre");
  const [activeQuarter, setActiveQuarter] = useState(() => {
    const m = new Date().getMonth();
    if (m >= 6 && m <= 8) return "Q1";
    if (m >= 9 && m <= 11) return "Q2";
    if (m >= 0 && m <= 2) return "Q3";
    return "Q4";
  });
  
  // Bulk State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bulkScores, setBulkScores] = useState<Record<string, any>>({});
  
  // Single Form States
  const [musicalScores, setMusicalScores] = useState({ sur: 1, laya: 1, word: 1, bhav: 1 });
  const [selScores, setSelScores] = useState({ involvement: 1, emotion: 1, creativity: 1, interaction: 1 });
  const [leadingScores, setLeadingScores] = useState({
    self: new Array(7).fill(1),
    other: new Array(6).fill(1),
    community: new Array(6).fill(1)
  });
  const [afterSchoolData, setAfterSchoolData] = useState<any>({});
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [editingAssessmentDate, setEditingAssessmentDate] = useState<string | null>(null);

  const getRoleParams = () => {
    return user?.role === 'fellow' 
      ? `?role=fellow&email=${user.email}` 
      : user?.role === 'program_manager' 
        ? `?role=program_manager&email=${user.email}` 
        : '';
  };

  useEffect(() => {
    const params = getRoleParams();
    Promise.all([
      api.get(`/students${params}`), 
      api.get(`/centres${params}`),
      api.get(`/fellows${params}`),
      api.get(`/assessments${params}`),
      api.get(`/sessions${params}`)
    ])
      .then(([sRes, cRes, fRes, aRes, sessRes]) => {
        setStudents(sRes.data);
        setCentres(cRes.data);
        setFellowsList(fRes.data);
        setAssessmentsData(aRes.data);
        setSessionsData(sessRes.data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogAssessment = async () => {
    if (isSubmitting) return;
    if (!selectedStudent) return;
    setIsSubmitting(true);
    
    let payloadData: any = {};
    let finalCategory = activeCategory;
    let finalPhase = activePhase;

    if (activeCategory === "Monthly-Evaluation") {
      payloadData = { selMid: selScores, musical: musicalScores };
      finalPhase = "Continuous";
    } else if (activeCategory === "SEL-Mid") {
      payloadData = { selMid: selScores };
      finalPhase = "Continuous";
    } else if (activeCategory === "Musical") {
      payloadData = { musical: musicalScores };
      finalPhase = "Mid";
    } else if (activeCategory === "InSchool-PrePost") {
      if (activePhase === "Mid") {
        // Mid phase: combined musical + SEL
        payloadData = { musical: musicalScores, selMid: selScores };
        finalCategory = "Mid-Evaluation";
      } else {
        payloadData = { leading: leadingScores };
      }
    } else if (activeCategory === "AfterSchool-PrePost") {
      if (activePhase === "Mid") {
        payloadData = { musical: musicalScores, selMid: selScores };
        finalCategory = "Mid-Evaluation";
      } else {
        const hasLegacyData = Boolean(afterSchoolData?.background || afterSchoolData?.knowledge);
        payloadData = hasLegacyData ? { afterSchool: afterSchoolData } : { leading: leadingScores };
        if (!hasLegacyData) {
          finalCategory = "InSchool-PrePost";
        }
      }
    }

    const acadYear = selectedMonth < 6 ? selectedYear - 1 : selectedYear;
    const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
    const dateStr = editingAssessmentDate 
      ? editingAssessmentDate 
      : (isCurrentMonth ? new Date().toISOString() : new Date(selectedYear, selectedMonth, 15).toISOString());

    try {
      const payload = {
        studentId: selectedStudent._id || selectedStudent.id,
        centreId: selectedStudent.centreId,
        fellowId: user?.role === 'fellow' ? user?.id : (selectedCentre?.fellowIds?.[0] || user?.id),
        category: finalCategory,
        phase: finalPhase,
        quarter: (finalPhase === "Mid" || finalCategory === "Mid-Evaluation") ? activeQuarter : undefined,
        data: payloadData,
        date: dateStr,
        remarks
      };

      if (editingAssessmentId) {
        await api.put(`/assessments/${editingAssessmentId}`, payload);
        toast.success("Assessment updated successfully");
      } else {
        await api.post("/assessments", payload);
        toast.success("Assessment logged successfully");
      }
      setEditingAssessmentId(null);
      setEditingAssessmentDate(null);
      setIsLogOpen(false);
      const aRes = await api.get(`/assessments${getRoleParams()}`);
      setAssessmentsData(aRes.data);
    } catch (error) {
      toast.error("Failed to log assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!editingAssessmentId) return;
    if (!window.confirm("Are you sure you want to delete this assessment record?")) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/assessments/${editingAssessmentId}`);
      toast.success("Assessment deleted successfully");
      setEditingAssessmentId(null);
      setEditingAssessmentDate(null);
      setIsLogOpen(false);
      const aRes = await api.get(`/assessments${getRoleParams()}`);
      setAssessmentsData(aRes.data);
    } catch (error) {
      toast.error("Failed to delete assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    try {
      await api.put(`/students/${studentId}`, { status: newStatus, month: selectedMonth, year: selectedYear });
      setStudents(prev => prev.map(s => (s._id || s.id) === studentId ? { ...s, status: newStatus } : s));
      toast.success("Student status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const activeCentresCount = centres.length;

  const handleBulkSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const acadYear = selectedMonth < 6 ? selectedYear - 1 : selectedYear;
      const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
      let dateStr = isCurrentMonth ? new Date().toISOString() : new Date(selectedYear, selectedMonth, 15).toISOString();

      const assessments = Object.entries(bulkScores).map(([studentId, data]) => ({
        studentId,
        centreId: selectedCentreId,
        fellowId: user?.role === 'fellow' ? user?.id : (selectedCentre?.fellowIds?.[0] || user?.id),
        category: activeCategory,
        phase: activePhase,
        quarter: (activePhase === "Mid" || activeCategory === "Mid-Evaluation") ? activeQuarter : undefined,
        data,
        date: dateStr
      }));

      if (assessments.length === 0) {
        toast.error("No assessment data entered");
        return;
      }

      await api.post("/assessments/bulk", { assessments });
      toast.success(`Successfully logged ${assessments.length} assessments`);
      setIsBulkOpen(false);
      const aRes = await api.get(`/assessments${getRoleParams()}`);
      setAssessmentsData(aRes.data);
    } catch (error) {
      toast.error("Failed to save bulk assessments");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCentre = centres.find(c => (c._id || c.id) === selectedCentreId);
  const centreStudents = useMemo(() => {
    if (!selectedCentreId) return [];
    const statusOrder: Record<string, number> = { Active: 1, Inactive: 2, Left: 3 };
    return students
      .filter(s => (s.centreId?._id || s.centreId) === selectedCentreId)
      .sort((a, b) => {
        const orderA = statusOrder[a.status || "Active"] || 99;
        const orderB = statusOrder[b.status || "Active"] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      });
  }, [students, selectedCentreId]);

  const processedAssessments = useMemo(() => {
    const statusOrder: Record<string, number> = { Active: 1, Inactive: 2, Left: 3 };
    return centreStudents
      .filter(s => (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const orderA = statusOrder[a.status || "Active"] || 99;
        const orderB = statusOrder[b.status || "Active"] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      })
      .map((s) => {
        const studentAssessments = assessmentsData.filter(a => (a.studentId?._id || a.studentId) === (s._id || s.id));
        return {
          id: s._id || s.id,
          student: s.name,
          records: studentAssessments,
          raw: s
        };
      });
  }, [centreStudents, searchQuery, assessmentsData]);

  if (loading) {
    return <div className="h-[200px] w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!selectedCentreId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header mb-8">
          <h1 className="text-3xl font-[950] tracking-tighter text-foreground mb-2">Student Assessments</h1>
          <p className="text-muted-foreground font-medium">Select a learning centre to manage academic and SEL progress records.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg mb-8">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
            <Input 
              placeholder="Find centre by name or location..." 
              className="pl-10 h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs" 
              value={centreSearchQuery} 
              onChange={(e) => setCentreSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[120px] h-10 rounded-xl bg-white/60 border-none shadow-sm font-black text-[10px] uppercase tracking-widest">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <SelectItem key={m} value={String(i)} className="rounded-lg text-xs font-medium">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[90px] h-10 rounded-xl bg-white/60 border-none shadow-sm font-black text-[10px] uppercase tracking-widest">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {[2025, 2026, 2027, 2028].map(y => (
                  <SelectItem key={y} value={String(y)} className="rounded-lg text-xs font-medium">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-primary/10 mx-1 hidden md:block" />

            <Select value={filterFellow} onValueChange={setFilterFellow}>
              <SelectTrigger className="h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs w-[160px]"><SelectValue placeholder="All Fellows" /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">All Fellows</SelectItem>
                {fellowsList.map(f => <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs w-[130px]"><SelectValue placeholder="Centre Type" /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="In-school">In-school</SelectItem>
                <SelectItem value="After-school">After-school</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centres
            .filter(c => {
              const assignedFellows = c.fellowIds?.map(fid => fellowsList.find(f => f._id === fid || f.id === fid)?.name || "").join(" ").toLowerCase() || "";
              const matchesSearch = c.name.toLowerCase().includes(centreSearchQuery.toLowerCase()) || 
                                   c.location.toLowerCase().includes(centreSearchQuery.toLowerCase()) ||
                                   assignedFellows.includes(centreSearchQuery.toLowerCase());
              const matchesType = filterType === "all" || c.type === filterType;
              const matchesFellow = filterFellow === "all" || c.fellowIds?.includes(filterFellow);
              return matchesSearch && matchesType && matchesFellow;
            })
            .map(centre => {
              const centreStudents = students.filter(s => (s.centreId?._id || s.centreId) === (centre._id || centre.id));
              const studentCount = centreStudents.length;
              
              const currentMonth = selectedMonth;
              const currentYear = selectedYear;
              
              const assessedThisMonthCount = centreStudents.filter(s => {
                const sId = s._id || s.id;
                return assessmentsData.some(a => {
                  if ((a.studentId?._id || a.studentId) !== sId) return false;
                  const d = new Date(a.date);
                  return d.getMonth() === currentMonth && d.getFullYear() === currentYear && a.phase === "Continuous";
                });
              }).length;
              
              const assessedPercentage = studentCount > 0 ? Math.round((assessedThisMonthCount / studentCount) * 100) : 0;
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
                          <span>{studentCount} Students Enrolled</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${assessedPercentage >= 80 ? 'text-success' : assessedPercentage > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                          <GraduationCap className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{assessedPercentage}% Assessed This Month</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                        {centre.fellowIds?.map((fid: string) => {
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

  const innerAssessedCount = centreStudents.filter(s => {
    const sId = s._id || s.id;
    return assessmentsData.some(a => {
      if ((a.studentId?._id || a.studentId) !== sId) return false;
      const d = new Date(a.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && a.phase === "Continuous";
    });
  }).length;

  const monthlyCentreSessions = sessionsData.filter(sess => {
    if ((sess.centreId?._id || sess.centreId) !== selectedCentreId) return false;
    const d = new Date(sess.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });
  const totalMonthlySessionsCount = monthlyCentreSessions.length;

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-10">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCentreId(null)} className="h-9 w-9 sm:h-12 sm:w-12 rounded-2xl bg-white shadow-sm hover:bg-primary hover:text-white transition-all shrink-0 mt-0.5">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-3xl font-[950] tracking-tighter text-foreground truncate">{selectedCentre?.name}</h1>
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1.5">
              <Badge variant={selectedCentre?.type === "In-school" ? "default" : "secondary"} className="rounded-full text-[8px] sm:text-[10px] uppercase tracking-widest font-black">{selectedCentre?.type}</Badge>
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">{centreStudents.length} Students</span>
              <span className="text-[10px] sm:text-xs font-bold text-primary">{innerAssessedCount} Assessed</span>
              <span className="text-[10px] sm:text-xs font-bold text-success">{totalMonthlySessionsCount} Sessions</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/40 backdrop-blur-md p-1.5 rounded-xl sm:rounded-[1.5rem] border border-white/20 shadow-lg">
          <div className="relative min-w-0 w-full sm:w-auto sm:min-w-[200px]">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
            <Input 
              placeholder="Find student..." 
              className="pl-9 sm:pl-10 rounded-xl bg-white/60 border-none h-9 sm:h-10 shadow-sm focus:ring-primary/20 font-bold text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[110px] sm:w-[120px] h-9 sm:h-10 rounded-xl bg-white/60 border-none shadow-sm font-black text-[9px] sm:text-[10px] uppercase tracking-widest">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <SelectItem key={m} value={String(i)} className="rounded-lg text-xs font-medium">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[80px] sm:w-[90px] h-9 sm:h-10 rounded-xl bg-white/60 border-none shadow-sm font-black text-[9px] sm:text-[10px] uppercase tracking-widest">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {[2025, 2026, 2027, 2028].map(y => (
                  <SelectItem key={y} value={String(y)} className="rounded-lg text-xs font-medium">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeTab === "SEL" && (
              <Button 
                className="rounded-xl h-9 sm:h-10 px-4 sm:px-6 font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-primary text-white shadow-lg hover:shadow-primary/20 transition-all"
                onClick={() => {
                  const initialBulkScores: Record<string, any> = {};
                  centreStudents.forEach(s => {
                    const sId = s._id || s.id;
                    const sAssessments = assessmentsData.filter(a => (a.studentId?._id || a.studentId) === sId && a.phase === "Continuous");
                    const monthlyRecord = sAssessments.find(a => {
                      const d = new Date(a.date);
                      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                    });
                    if (monthlyRecord && monthlyRecord.data) {
                      initialBulkScores[sId] = {
                        musical: monthlyRecord.data.musical || { sur: 0, laya: 0, word: 0, bhav: 0 },
                        selMid: monthlyRecord.data.selMid || { involvement: 0, emotion: 0, creativity: 0, interaction: 0 }
                      };
                    }
                  });
                  setBulkScores(initialBulkScores);
                  setActiveCategory("Monthly-Evaluation");
                  setActivePhase("Continuous");
                  setIsBulkOpen(true);
                }}
              >
                <LayoutGrid className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Bulk Log
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 sm:mb-8 p-1 sm:p-1.5 bg-white/50 backdrop-blur-xl rounded-xl sm:rounded-[1.5rem] border border-white/20 shadow-xl h-11 sm:h-14 w-full sm:w-auto">
          <TabsTrigger value="SEL" className="rounded-lg sm:rounded-xl h-8 sm:h-10 px-3 sm:px-8 font-black uppercase tracking-widest text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white flex-1 sm:flex-none">Session Logs (Monthly)</TabsTrigger>
          <TabsTrigger value="Milestones" className="rounded-lg sm:rounded-xl h-8 sm:h-10 px-3 sm:px-8 font-black uppercase tracking-widest text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white flex-1 sm:flex-none">Annual Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="SEL" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 gap-4">
            {processedAssessments.map((a) => {
              const records = a.records.filter(r => r.phase === "Continuous");
              let monthlyRecord = records.find(r => {
                const d = new Date(r.date);
                return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
              });
              
              const isAssessedThisMonth = monthlyRecord !== undefined;
              let isPreviousRecord = false;
              let previousMonthName = "";
              
              if (!monthlyRecord) {
                const pastRecords = records.filter(r => {
                   const d = new Date(r.date);
                   return d.getFullYear() < selectedYear || (d.getFullYear() === selectedYear && d.getMonth() < selectedMonth);
                }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                if (pastRecords.length > 0) {
                  monthlyRecord = pastRecords[0];
                  isPreviousRecord = true;
                  previousMonthName = new Date(monthlyRecord.date).toLocaleString('default', { month: 'short' });
                }
              }

              const monthlyLogsCount = records.filter(r => {
                const d = new Date(r.date);
                return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
              }).length;

              const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
              const isInactive = a.raw.status === "Inactive" || a.raw.status === "Left";

              const presentCount = monthlyCentreSessions.filter(sess => 
                sess.presentStudentIds && sess.presentStudentIds.includes(a.id)
              ).length;
              const monthlyAttendancePercent = totalMonthlySessionsCount > 0 
                ? Math.round((presentCount / totalMonthlySessionsCount) * 100) 
                : 0;

              return (
                <Card key={a.id} className={`glass-card-premium border-none shadow-xl hover:shadow-2xl transition-all rounded-2xl sm:rounded-[2rem] overflow-hidden group ${isInactive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      {/* Student Info Header */}
                      <div className="p-4 sm:p-6 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-black text-sm sm:text-base tracking-tight group-hover:text-primary transition-colors truncate">{a.student}</h4>
                          <Select value={a.raw.status || "Active"} onValueChange={(val) => handleStatusChange(a.id, val)}>
                            <SelectTrigger className="h-6 px-1.5 sm:px-2 w-[70px] sm:w-[80px] shrink-0 text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/50 border-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active" className="text-[10px] font-bold">Active</SelectItem>
                              <SelectItem value="Inactive" className="text-[10px] font-bold">Inactive</SelectItem>
                              <SelectItem value="Left" className="text-[10px] font-bold">Left</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1.5">
                           <Badge variant="outline" className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary/60">{monthlyAttendancePercent}% ATT</Badge>
                           {isAssessedThisMonth && <Badge className="bg-success/10 text-success border-none text-[7px] sm:text-[8px] font-black uppercase tracking-widest">SYNCED</Badge>}
                           {isPreviousRecord && <Badge className="bg-orange-500/10 text-orange-600 border-none text-[7px] sm:text-[8px] font-black uppercase tracking-widest">PREV: {previousMonthName}</Badge>}
                        </div>
                      </div>
                      {/* Score Grid - Horizontally scrollable on mobile */}
                      <div className="overflow-x-auto">
                        <div className={`p-3 sm:p-4 grid grid-cols-8 min-w-[500px] items-center justify-items-center gap-1 ${isPreviousRecord ? 'opacity-40' : ''}`}>
                          {[
                            { label: "Sur", value: monthlyRecord?.data.musical?.sur },
                            { label: "Laya", value: monthlyRecord?.data.musical?.laya },
                            { label: "Word", value: monthlyRecord?.data.musical?.word },
                            { label: "Bhav", value: monthlyRecord?.data.musical?.bhav },
                            { label: "Involve", value: monthlyRecord?.data.selMid?.involvement },
                            { label: "Emotion", value: monthlyRecord?.data.selMid?.emotion },
                            { label: "Create", value: monthlyRecord?.data.selMid?.creativity },
                            { label: "Interact", value: monthlyRecord?.data.selMid?.interaction },
                          ].map((item, i) => (
                            <div key={i} className="text-center w-full">
                              <p className="text-[7px] sm:text-[9px] font-black text-muted-foreground/50 uppercase mb-1.5 sm:mb-2 truncate">{item.label}</p>
                              <ScoreCell score={item.value} />
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Action Button */}
                      <div className="p-3 sm:p-4 border-t border-primary/5 flex items-center bg-muted/5 shrink-0 justify-center">
                        {isAssessedThisMonth ? (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                               <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                             <p className="text-[8px] sm:text-[9px] font-black text-success uppercase tracking-widest">LOGGED {formatDateDMY(monthlyRecord.date)}</p>
                          </div>
                        ) : isInactive ? (
                          <div className="flex items-center gap-2 opacity-50">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                               <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                             <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">DISABLED ({a.raw.status})</p>
                          </div>
                        ) : (
                          <Button 
                            className="rounded-2xl h-10 sm:h-11 px-5 sm:px-6 font-black uppercase tracking-widest text-[9px] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all whitespace-nowrap"
                            onClick={() => {
                              setSelectedStudent(a.raw);
                              setActiveCategory("Monthly-Evaluation");
                              setActivePhase("Continuous");
                              setIsLogOpen(true);
                            }}
                          >
                            <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                            Log Score
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="Milestones" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="rounded-2xl border border-primary/5 overflow-x-auto bg-white shadow-lg">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_repeat(2,120px)] sm:grid-cols-[1fr_repeat(2,160px)] min-w-[400px] gap-0 bg-muted/40 border-b border-primary/10 px-3 sm:px-5 py-2.5 sm:py-3">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-muted-foreground">Student</span>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-center text-muted-foreground">Pre Assessment</span>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-center text-muted-foreground">Post Assessment</span>
              </div>
              {/* Student rows */}
              {processedAssessments.map((a) => {
                const milestoneCategories = ["InSchool-PrePost", "AfterSchool-PrePost", "Mid-Evaluation"];
                
                const selectedAcademicYear = selectedMonth < 6 ? selectedYear - 1 : selectedYear;
                
                const getRecordAcademicYear = (dateStr: string) => {
                  const d = new Date(dateStr);
                  const m = d.getMonth();
                  const y = d.getFullYear();
                  return m < 6 ? y - 1 : y;
                };

                const academicYearRecords = a.records.filter(r => getRecordAcademicYear(r.date) === selectedAcademicYear);

                const pre = academicYearRecords.find(r => r.phase === "Pre" && milestoneCategories.includes(r.category));
                const post = academicYearRecords.find(r => r.phase === "Post" && milestoneCategories.includes(r.category));
                
                const openEditModal = (record: any, phase: string) => {
                  setSelectedStudent(a.raw);
                  setActiveCategory(record.data?.afterSchool ? record.category : "InSchool-PrePost");
                  setActivePhase(phase);
                  setEditingAssessmentId(record._id || record.id);
                  setEditingAssessmentDate(record.date || null);
                  
                  // Pre-fill form with existing data safely
                  const leading = record.data?.leading || {};
                  setLeadingScores({
                    self: Array.isArray(leading.self) && leading.self.length === 7 ? [...leading.self] : new Array(7).fill(1),
                    other: Array.isArray(leading.other) && leading.other.length === 6 ? [...leading.other] : new Array(6).fill(1),
                    community: Array.isArray(leading.community) && leading.community.length === 6 ? [...leading.community] : new Array(6).fill(1),
                  });
                  if (record.data?.afterSchool) {
                    setAfterSchoolData(record.data.afterSchool);
                  } else {
                    setAfterSchoolData({});
                  }
                  if (record.data?.musical) {
                    setMusicalScores(record.data.musical);
                  } else {
                    setMusicalScores({ sur: 1, laya: 1, word: 1, bhav: 1 });
                  }
                  if (record.data?.selMid) {
                    setSelScores(record.data.selMid);
                  } else {
                    setSelScores({ involvement: 1, emotion: 1, creativity: 1, interaction: 1 });
                  }
                  setRemarks(record.remarks || "");
                  setIsLogOpen(true);
                };

                const isMilestoneInactive = a.raw.status === "Inactive" || a.raw.status === "Left";

                return (
                  <div key={a.id} className={`grid grid-cols-[1fr_repeat(2,120px)] sm:grid-cols-[1fr_repeat(2,160px)] min-w-[400px] gap-0 items-center px-3 sm:px-5 py-2.5 sm:py-3 border-b border-muted/50 hover:bg-primary/[0.02] transition-colors group ${isMilestoneInactive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary">{a.student.charAt(0)}</div>
                      <div>
                        <span className="text-sm font-bold block leading-tight">{a.student}</span>
                      </div>
                    </div>
                    {/* Pre */}
                    <div className="text-center">
                      {pre ? (
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <Badge className="bg-success/10 text-success border-none text-[11px] font-bold px-2.5 py-0.5">
                            {typeof pre.averageScore === 'number' && pre.averageScore > 0 ? `${pre.averageScore} / 5` : "Done"}
                          </Badge>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-[10px] font-black uppercase text-primary hover:bg-primary/10 rounded-lg cursor-pointer" 
                            onClick={() => openEditModal(pre, "Pre")}
                          >
                            Edit ✎
                          </Button>
                        </div>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium px-3 transition-colors ${isMilestoneInactive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/5'}`}
                          onClick={() => {
                            if (isMilestoneInactive) return;
                            setSelectedStudent(a.raw);
                            setEditingAssessmentId(null);
                            setEditingAssessmentDate(null);
                            setLeadingScores({
                              self: new Array(7).fill(1),
                              other: new Array(6).fill(1),
                              community: new Array(6).fill(1),
                            });
                            setActiveCategory("InSchool-PrePost");
                            setActivePhase("Pre");
                            setIsLogOpen(true);
                          }}
                        >
                          Pending
                        </Badge>
                      )}
                    </div>
                    {/* Post */}
                    <div className="text-center">
                      {post ? (
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <Badge className="bg-success/10 text-success border-none text-[11px] font-bold px-2.5 py-0.5">
                            {typeof post.averageScore === 'number' && post.averageScore > 0 ? `${post.averageScore} / 5` : "Done"}
                          </Badge>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-[10px] font-black uppercase text-primary hover:bg-primary/10 rounded-lg cursor-pointer" 
                            onClick={() => openEditModal(post, "Post")}
                          >
                            Edit ✎
                          </Button>
                        </div>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium px-3 transition-colors ${isMilestoneInactive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/5'}`}
                          onClick={() => {
                            if (isMilestoneInactive) return;
                            setSelectedStudent(a.raw);
                            setEditingAssessmentId(null);
                            setEditingAssessmentDate(null);
                            setLeadingScores({
                              self: new Array(7).fill(1),
                              other: new Array(6).fill(1),
                              community: new Array(6).fill(1),
                            });
                            setActiveCategory("InSchool-PrePost");
                            setActivePhase("Post");
                            setIsLogOpen(true);
                          }}
                        >
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
           </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ClipboardCheck className="h-24 w-24" /></div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-[950] tracking-tight">
                {editingAssessmentId ? `Edit ${activePhase}-Assessment: ` : "Record Performance: "}{selectedStudent?.name}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-medium text-sm">
                Logging {activeCategory === "Monthly-Evaluation" ? `Monthly Assessment (SEL & Musical)` : activeCategory === "SEL-Mid" ? `Monthly SEL Assessment` : activeCategory === "Musical" ? `Quarterly Musical Assessment — ${activeQuarter}` : (activeCategory === "InSchool-PrePost" || activeCategory === "AfterSchool-PrePost") ? `${activePhase}-Assessment (Leading Self, Other & Community)` : `${activeCategory} Assessment Phase`}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                {(activeCategory === "InSchool-PrePost" || activeCategory === "AfterSchool-PrePost") ? (
                  <>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                      <div className="rounded-2xl h-12 bg-muted/50 px-4 flex items-center text-sm font-bold text-muted-foreground">
                        Pre/Post Assessment (Leading Survey)
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evaluation Phase</Label>
                      <div className="rounded-2xl h-12 bg-muted/50 px-4 flex items-center text-sm font-bold text-muted-foreground">
                        {activePhase}-Assessment (Survey)
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                      <Select value={activeCategory} onValueChange={(v) => {
                        setActiveCategory(v);
                        if (v === "SEL-Mid" || v === "Monthly-Evaluation") setActivePhase("Continuous");
                        else if (v === "Musical") setActivePhase("Mid");
                      }}>
                        <SelectTrigger className="rounded-2xl h-12 bg-muted border-none font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="Monthly-Evaluation">Monthly Progress (SEL & Musical)</SelectItem>
                          <SelectItem value="InSchool-PrePost">Pre/Post Assessment (Leading Survey)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(activeCategory === "InSchool-PrePost" || activeCategory === "AfterSchool-PrePost") && (
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evaluation Phase</Label>
                        <Select value={activePhase} onValueChange={setActivePhase}>
                          <SelectTrigger className="rounded-2xl h-12 bg-muted border-none font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="Pre">Pre-Assessment (Survey)</SelectItem>
                            <SelectItem value="Mid">Mid-Assessment (Combined Evaluation)</SelectItem>
                            <SelectItem value="Post">Post-Assessment (Survey)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* Quarter selector for mid assessments */}
              {(activePhase === "Mid") && (
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary whitespace-nowrap">Quarter</Label>
                  <div className="flex gap-2 flex-1">
                    {[{v: "Q1", label: "Q1 (Jul-Sep)"}, {v: "Q2", label: "Q2 (Oct-Dec)"}, {v: "Q3", label: "Q3 (Jan-Mar)"}, {v: "Q4", label: "Q4 (Apr-Jun)"}].map(({v, label}) => (
                      <button
                        key={v}
                        onClick={() => setActiveQuarter(v)}
                        className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${activeQuarter === v ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white hover:bg-muted text-muted-foreground'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeCategory === "Musical" && (
                <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 animate-in fade-in duration-500">
                   <h5 className="font-black text-sm mb-6 flex items-center gap-2"><Music className="h-4 w-4 text-primary" /> Musical Proficiency Scoring</h5>
                   <div className="grid grid-cols-2 gap-6">
                      {['sur', 'laya', 'word', 'bhav'].map(k => (
                        <div key={k} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="capitalize font-black text-[10px] tracking-widest text-muted-foreground">{k}</Label>
                            <RubricHeader categoryKey={k} label="Rubric Guide" className="text-[9px] font-bold text-primary/80" />
                          </div>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button
                                key={v}
                                title={`${v}: ${getRubric(k)?.levels[v - 1]?.desc || SCORE_LABELS[v as keyof typeof SCORE_LABELS]}`}
                                onClick={() => setMusicalScores({ ...musicalScores, [k as keyof typeof musicalScores]: v })}
                                className={`flex-1 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${musicalScores[k as keyof typeof musicalScores] === v ? 'bg-primary text-white shadow-lg scale-105' : 'bg-white hover:bg-muted shadow-sm'}`}
                              >
                                <span className="text-xs font-black">{v}</span>
                                <span className={`text-[7px] font-black uppercase ${musicalScores[k as keyof typeof musicalScores] === v ? 'text-white/70' : 'text-muted-foreground/40'}`}>{SCORE_LABELS[v as keyof typeof SCORE_LABELS]}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {(activeCategory === "SEL-Mid" || activeCategory === "Monthly-Evaluation" || (activePhase === "Mid" && activeCategory !== "Musical")) && (
                 <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="p-6 bg-accent/5 rounded-[2.5rem] border border-accent/10">
                       <h5 className="font-black text-sm mb-6 flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> {activeCategory === "SEL-Mid" || activeCategory === "Monthly-Evaluation" ? "Monthly SEL Rubrics" : "Quantitative SEL Rubrics"}</h5>
                       <div className="space-y-6">
                          {SEL_CATEGORIES.map((key) => (
                            <div key={key} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="capitalize font-black text-[10px] tracking-widest text-muted-foreground">{key}</Label>
                                <RubricHeader categoryKey={key} label="Rubric Guide" className="text-[9px] font-bold text-accent/80" badgeColor="text-accent" />
                              </div>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(v => (
                                  <button
                                    key={v}
                                    title={`${v}: ${getRubric(key)?.levels[v - 1]?.desc || SCORE_LABELS[v as keyof typeof SCORE_LABELS]}`}
                                    onClick={() => setSelScores({ ...selScores, [key.toLowerCase() as keyof typeof selScores]: v })}
                                    className={`flex-1 h-12 rounded-xl flex flex-col items-center justify-center transition-all border-2 ${selScores[key.toLowerCase() as keyof typeof selScores] === v ? 'border-accent bg-accent text-white shadow-lg' : 'border-transparent bg-white hover:bg-muted'}`}
                                  >
                                    <span className="text-xs font-black">{v}</span>
                                    <span className={`text-[7px] font-black uppercase ${selScores[key.toLowerCase() as keyof typeof selScores] === v ? 'text-white/70' : 'text-muted-foreground/40'}`}>{SCORE_LABELS[v as keyof typeof SCORE_LABELS]}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                    {/* Musical scores only for combined Mid-Evaluation, NOT for standalone SEL-Mid */}
                    {activeCategory !== "SEL-Mid" && (
                    <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-primary/10">
                       <h5 className="font-black text-sm mb-6 flex items-center gap-2"><Music className="h-4 w-4 text-primary" /> Musical Milestone Assessment</h5>
                       <div className="grid grid-cols-2 gap-4">
                          {['sur', 'laya', 'word', 'bhav'].map(k => (
                            <div key={k} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="capitalize font-black text-[10px] tracking-widest text-muted-foreground">{k}</Label>
                                <RubricHeader categoryKey={k} label="Rubric Guide" className="text-[9px] font-bold text-primary/80" />
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(v => (
                                  <button
                                    key={v}
                                    title={`${v}: ${getRubric(k)?.levels[v - 1]?.desc || SCORE_LABELS[v as keyof typeof SCORE_LABELS]}`}
                                    onClick={() => setMusicalScores({ ...musicalScores, [k as keyof typeof musicalScores]: v })}
                                    className={`flex-1 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${musicalScores[k as keyof typeof musicalScores] === v ? 'bg-primary text-white shadow-lg' : 'bg-white hover:bg-muted'}`}
                                  >
                                    <span className="text-xs font-black">{v}</span>
                                    <span className={`text-[7px] font-black uppercase ${musicalScores[k as keyof typeof musicalScores] === v ? 'text-white/70' : 'text-muted-foreground/40'}`}>{SCORE_LABELS[v as keyof typeof SCORE_LABELS]}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                    )}
                 </div>
              )}

              {(activePhase === "Pre" || activePhase === "Post") && activeCategory !== "Musical" && (activeCategory === "InSchool-PrePost" || (activeCategory === "AfterSchool-PrePost" && !afterSchoolData?.background && !afterSchoolData?.knowledge)) && (
                <div className="space-y-8">
                  {Object.entries(LEADING_QUESTIONS).map(([domain, questions]) => (
                    <div key={domain} className="space-y-4">
                      <h5 className="font-black uppercase tracking-[0.2em] text-[10px] text-primary bg-primary/5 w-fit px-4 py-1.5 rounded-full">Leading {domain}</h5>
                      <div className="space-y-4">
                        {questions.map((q, i) => (
                          <div key={i} className="space-y-3 p-4 bg-muted/30 rounded-2xl">
                            <p className="text-xs font-bold leading-relaxed">{q}</p>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(v => {
                                const isSelected = (leadingScores[domain as keyof typeof leadingScores]?.[i] ?? 1) === v;
                                return (
                                  <button
                                    type="button"
                                    key={v}
                                    onClick={() => {
                                      setLeadingScores(prev => {
                                        const current = Array.isArray(prev[domain as keyof typeof leadingScores])
                                          ? [...prev[domain as keyof typeof leadingScores]]
                                          : new Array(questions.length).fill(1);
                                        while (current.length < questions.length) current.push(1);
                                        current[i] = v;
                                        return {
                                          ...prev,
                                          [domain]: current
                                        };
                                      });
                                    }}
                                    className={`flex-1 h-9 rounded-xl font-black text-[10px] transition-all cursor-pointer ${isSelected ? 'bg-primary text-white shadow-lg' : 'bg-white hover:bg-muted text-foreground'}`}
                                  >
                                    {v}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(activePhase === "Pre" || activePhase === "Post") && activeCategory !== "Musical" && activeCategory === "AfterSchool-PrePost" && (Boolean(afterSchoolData?.background) || Boolean(afterSchoolData?.knowledge)) && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {Object.entries(AFTER_SCHOOL_QUESTIONS).map(([section, questions]) => (
                    <div key={section} className="space-y-4">
                      <h5 className="font-black uppercase tracking-[0.2em] text-[10px] text-primary bg-primary/5 w-fit px-4 py-1.5 rounded-full">{section} Analysis</h5>
                      <div className="space-y-4">
                        {questions.map((q: any) => (
                          <div key={q.id} className="space-y-3 p-4 bg-muted/30 rounded-2xl">
                            <p className="text-xs font-bold leading-relaxed">{q.q}</p>
                            {q.type === "select" ? (
                              <Select 
                                value={afterSchoolData[section]?.[q.id] || ""} 
                                onValueChange={(v) => {
                                  const newData = { ...afterSchoolData };
                                  if (!newData[section]) newData[section] = {};
                                  newData[section][q.id] = v;
                                  setAfterSchoolData(newData);
                                }}
                              >
                                <SelectTrigger className="h-10 rounded-xl bg-white border-none shadow-sm text-xs font-medium"><SelectValue placeholder="Select answer" /></SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-xl">
                                  {q.options.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : q.type === "number" ? (
                              <Input 
                                type="number" 
                                className="h-10 rounded-xl bg-white border-none shadow-sm text-xs" 
                                placeholder="Enter count..."
                                value={afterSchoolData[section]?.[q.id] || ""}
                                onChange={(e) => {
                                  const newData = { ...afterSchoolData };
                                  if (!newData[section]) newData[section] = {};
                                  newData[section][q.id] = parseInt(e.target.value);
                                  setAfterSchoolData(newData);
                                }}
                              />
                            ) : (
                              <textarea 
                                className="w-full h-20 p-3 rounded-xl bg-white border-none shadow-sm text-xs resize-none" 
                                placeholder="Enter your response..."
                                value={afterSchoolData[section]?.[q.id] || ""}
                                onChange={(e) => {
                                  const newData = { ...afterSchoolData };
                                  if (!newData[section]) newData[section] = {};
                                  newData[section][q.id] = e.target.value;
                                  setAfterSchoolData(newData);
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Facilitator Feedback & Remarks</Label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Notes on progress, behavior, or musical breakthroughs..."
                  className="w-full min-h-[100px] p-4 rounded-2xl bg-muted border-none outline-none focus:ring-2 ring-primary/20 font-medium text-sm transition-all"
                />
              </div>
            </div>
          </ScrollArea>
          
          <div className="p-8 bg-muted/30 border-t border-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogClose asChild>
                <Button variant="ghost" className="rounded-2xl h-12 px-6 font-bold" onClick={() => { setEditingAssessmentId(null); setEditingAssessmentDate(null); }}>Cancel</Button>
              </DialogClose>
              {editingAssessmentId && (
                <Button 
                  type="button"
                  variant="outline" 
                  className="rounded-2xl h-12 px-5 font-bold text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-colors"
                  onClick={handleDeleteAssessment}
                  disabled={isSubmitting}
                >
                  Delete Record
                </Button>
              )}
            </div>
            <Button 
              className="rounded-2xl h-12 px-10 font-[950] uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" 
              onClick={handleLogAssessment}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Syncing Record..." : editingAssessmentId ? "Update & Save" : "Confirm & Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className={`rounded-2xl sm:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-h-[100dvh] sm:max-h-[95vh] ${activeCategory === "Mid-Evaluation" || activeCategory === "Monthly-Evaluation" ? "max-w-[100vw] sm:max-w-[98vw] w-full" : "max-w-[100vw] sm:max-w-[95vw] w-full sm:w-[1100px]"}`}>
          <div className="bg-primary p-4 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-xl font-[950] tracking-tight truncate">Bulk Assessment: {selectedCentre?.name}</DialogTitle>
              <DialogDescription className="sr-only">Bulk score entry for all students at this centre</DialogDescription>
              <div className="flex items-center gap-4 mt-1.5 sm:mt-2">
                <Badge className="bg-white/20 text-white border-none rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-0.5 sm:py-1 h-5 sm:h-7">
                   {activeCategory === "Monthly-Evaluation" ? "Monthly Evaluation (SEL & Musical)" : activeCategory === "SEL-Mid" ? "Monthly SEL Progress" : "Quarterly Musical Progress"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0">
              <Button variant="ghost" onClick={() => setIsBulkOpen(false)} className="text-white hover:bg-white/10 rounded-xl h-8 sm:h-10 px-3 sm:px-4 font-bold text-xs"><X className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Cancel</Button>
              <Button 
                variant="ghost"
                onClick={() => setBulkScores({})}
                className="text-white hover:bg-white/10 rounded-xl h-8 sm:h-10 px-3 sm:px-4 font-black uppercase tracking-widest text-[8px] sm:text-[10px] border border-white/30"
              >
                Clear All
              </Button>
              <Button 
                onClick={handleBulkSubmit}
                disabled={isSubmitting}
                className="bg-white text-primary hover:bg-white/90 rounded-xl h-8 sm:h-10 px-4 sm:px-6 font-black uppercase tracking-widest text-[8px] sm:text-[10px] shadow-xl"
              >
                {isSubmitting ? "Saving..." : "Save All"}
              </Button>
            </div>
          </div>
          
          <div className="p-0 overflow-hidden">
            <div className="h-[calc(100dvh-180px)] sm:h-[75vh] overflow-auto">
              <table className="min-w-max w-full caption-bottom text-sm">
                <TableHeader className="bg-white sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <TableRow>
                    <TableHead className="w-[150px] sm:w-[180px] min-w-[150px] sm:min-w-[180px] font-black text-[9px] sm:text-[10px] uppercase tracking-widest pl-3 sm:pl-4 sticky left-0 bg-white z-30">Student Name</TableHead>
                    {(activeCategory === "Musical" || activeCategory === "Mid-Evaluation" || activeCategory === "Monthly-Evaluation") && [
                      { key: "sur", label: "Sur" },
                      { key: "laya", label: "Laya" },
                      { key: "word", label: "Word" },
                      { key: "bhav", label: "Bhav" }
                    ].map(col => (
                      <TableHead key={col.key} className="text-center p-1 font-black text-[9px] sm:text-[10px] uppercase tracking-widest">
                        <RubricHeader categoryKey={col.key} label={col.label} />
                      </TableHead>
                    ))}
                    {(activeCategory === "SEL-Mid" || activeCategory === "Mid-Evaluation" || activeCategory === "Monthly-Evaluation") && [
                      { key: "involvement", label: "Involvement" },
                      { key: "emotion", label: "Emotion" },
                      { key: "creativity", label: "Creativity" },
                      { key: "interaction", label: "Interaction" }
                    ].map(col => (
                      <TableHead key={col.key} className="text-center p-1 font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-accent">
                        <RubricHeader categoryKey={col.key} label={col.label} />
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-black text-[9px] sm:text-[10px] uppercase tracking-widest">Avg</TableHead>
                    <TableHead className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest pr-4 sm:pr-8">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centreStudents.map(s => {
                    const sId = s._id || s.id;
                    const sData = bulkScores[sId] || { musical: { sur: 0, laya: 0, word: 0, bhav: 0 }, selMid: { involvement: 0, emotion: 0, creativity: 0, interaction: 0 } };
                    
                    const calculateAvg = () => {
                      const m = sData.musical;
                      const sel = sData.selMid;
                      if (activeCategory === "Musical") {
                        if (!m.sur && !m.laya && !m.word && !m.bhav) return 0;
                        return (m.sur + m.laya + m.word + m.bhav) / 4;
                      } else if (activeCategory === "SEL-Mid") {
                        if (!sel.involvement && !sel.emotion && !sel.creativity && !sel.interaction) return 0;
                        return (sel.involvement + sel.emotion + sel.creativity + sel.interaction) / 4;
                      } else if (activeCategory === "Mid-Evaluation" || activeCategory === "Monthly-Evaluation") {
                        const total = (m.sur+m.laya+m.word+m.bhav + sel.involvement+sel.emotion+sel.creativity+sel.interaction);
                        return total > 0 ? total / 8 : 0;
                      }
                      return 0;
                    };

                    const avg = calculateAvg();
                    const isInactive = s.status === "Inactive" || s.status === "Left";

                    const presentCount = monthlyCentreSessions.filter(sess => 
                      sess.presentStudentIds && sess.presentStudentIds.includes(sId)
                    ).length;
                    const monthlyAttendancePercent = totalMonthlySessionsCount > 0 
                      ? Math.round((presentCount / totalMonthlySessionsCount) * 100) 
                      : 0;

                    const sAssessments = assessmentsData.filter(a => (a.studentId?._id || a.studentId) === sId && a.phase === "Continuous");
                    let monthlyRecord = sAssessments.find(a => {
                      const d = new Date(a.date);
                      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                    });
                    
                    const isAssessedThisMonth = monthlyRecord !== undefined;
                    let isPreviousRecord = false;
                    let previousMonthName = "";
                    
                    if (!monthlyRecord) {
                      const pastRecords = sAssessments.filter(a => {
                         const d = new Date(a.date);
                         return d.getFullYear() < selectedYear || (d.getFullYear() === selectedYear && d.getMonth() < selectedMonth);
                      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                      
                      if (pastRecords.length > 0) {
                        isPreviousRecord = true;
                        previousMonthName = new Date(pastRecords[0].date).toLocaleString('default', { month: 'short' });
                      }
                    }

                    return (
                      <TableRow key={sId} className={`hover:bg-primary/5 transition-colors group ${isInactive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                        <TableCell className="font-bold text-[10px] sm:text-xs pl-3 sm:pl-4 sticky left-0 bg-white z-10 group-hover:bg-primary/5 w-[150px] sm:w-[180px] min-w-[150px] sm:min-w-[180px]">
                          <div className="flex flex-col gap-1 items-start">
                            <div className="flex items-start justify-between gap-1.5 w-full">
                              <span className="truncate flex-1" title={s.name}>{s.name}</span>
                              <Select value={s.status || "Active"} onValueChange={(val) => handleStatusChange(sId, val)}>
                                <SelectTrigger className="h-5 px-1 w-[55px] sm:w-[65px] shrink-0 text-[7px] sm:text-[8px] font-black uppercase tracking-widest bg-muted border-none">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active" className="text-[10px] font-bold">Active</SelectItem>
                                  <SelectItem value="Inactive" className="text-[10px] font-bold">Inactive</SelectItem>
                                  <SelectItem value="Left" className="text-[10px] font-bold">Left</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center flex-wrap gap-0.5 sm:gap-1">
                               <Badge variant="outline" className={`text-[6px] sm:text-[7px] font-black uppercase tracking-widest border-primary/20 px-1 py-0 h-3.5 sm:h-4 ${monthlyAttendancePercent < 50 ? 'text-destructive' : 'text-primary/60'}`}>{monthlyAttendancePercent}% ATT</Badge>
                               {isAssessedThisMonth && <Badge className="bg-success/10 text-success border-none text-[6px] sm:text-[7px] font-black uppercase tracking-widest px-1 py-0 h-3.5 sm:h-4">SYNCED</Badge>}
                               {isPreviousRecord && <Badge className="bg-orange-500/10 text-orange-600 border-none text-[6px] sm:text-[7px] font-black uppercase tracking-widest px-1 py-0 h-3.5 sm:h-4">PREV: {previousMonthName}</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        {(activeCategory === "Musical" || activeCategory === "Mid-Evaluation" || activeCategory === "Monthly-Evaluation") && ['sur', 'laya', 'word', 'bhav'].map(k => {
                          const r = getRubric(k);
                          return (
                            <TableCell key={k} className="text-center p-0.5 sm:p-1">
                              <div className="flex items-center justify-center gap-px">
                                {[1, 2, 3, 4, 5].map(v => (
                                  <button
                                    key={v}
                                    title={`${v}: ${r?.levels[v - 1]?.desc || ''}`}
                                    disabled={isInactive}
                                    onClick={() => {
                                      if (isInactive) return;
                                      const next = { ...bulkScores };
                                      if (!next[sId]) next[sId] = { musical: { sur: 0, laya: 0, word: 0, bhav: 0 }, selMid: { involvement: 0, emotion: 0, creativity: 0, interaction: 0 } };
                                      next[sId].musical[k] = v;
                                      setBulkScores(next);
                                    }}
                                    className={`${activeCategory === "Mid-Evaluation" || activeCategory === "Monthly-Evaluation" ? "h-5 w-5 sm:h-6 sm:w-6 text-[8px] sm:text-[9px]" : "h-6 w-6 sm:h-7 sm:w-7 text-[9px] sm:text-[10px]"} rounded-lg font-black transition-all ${isInactive ? 'opacity-30 cursor-not-allowed' : ''} ${sData.musical[k] === v ? 'bg-primary text-white shadow-sm' : 'bg-muted hover:bg-muted/80'}`}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                          );
                        })}
                        {(activeCategory === "Mid-Evaluation" || activeCategory === "Monthly-Evaluation") && ['involvement', 'emotion', 'creativity', 'interaction'].map(k => {
                          const r = getRubric(k);
                          return (
                            <TableCell key={k} className="text-center p-0.5 sm:p-1">
                              <div className="flex items-center justify-center gap-px">
                                {[1, 2, 3, 4, 5].map(v => (
                                  <button
                                    key={v}
                                    title={`${v}: ${r?.levels[v - 1]?.desc || ''}`}
                                    disabled={isInactive}
                                    onClick={() => {
                                      if (isInactive) return;
                                      const next = { ...bulkScores };
                                      if (!next[sId]) next[sId] = { musical: { sur: 0, laya: 0, word: 0, bhav: 0 }, selMid: { involvement: 0, emotion: 0, creativity: 0, interaction: 0 } };
                                      next[sId].selMid[k] = v;
                                      setBulkScores(next);
                                    }}
                                    className={`h-5 w-5 sm:h-6 sm:w-6 rounded text-[8px] sm:text-[9px] font-black transition-all ${isInactive ? 'opacity-30 cursor-not-allowed' : ''} ${sData.selMid[k] === v ? 'bg-accent text-white shadow-sm' : 'bg-muted hover:bg-muted/80'}`}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                          );
                        })}
                        {activeCategory === "SEL-Mid" && ['involvement', 'emotion', 'creativity', 'interaction'].map(k => {
                          const r = getRubric(k);
                          return (
                            <TableCell key={k} className="text-center p-1 sm:p-2">
                              <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                                {[1, 2, 3, 4, 5].map(v => (
                                  <button
                                    key={v}
                                    title={`${v}: ${r?.levels[v - 1]?.desc || ''}`}
                                    disabled={isInactive}
                                    onClick={() => {
                                      if (isInactive) return;
                                      const newScores = { ...bulkScores };
                                      if (!newScores[sId]) newScores[sId] = { selMid: { involvement: 0, emotion: 0, creativity: 0, interaction: 0 } };
                                      newScores[sId].selMid[k] = v;
                                      setBulkScores(newScores);
                                    }}
                                    className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-[9px] sm:text-[10px] font-black transition-all ${isInactive ? 'opacity-30 cursor-not-allowed' : ''} ${sData.selMid[k] === v ? 'bg-accent text-white shadow-md' : 'bg-muted hover:bg-muted/80'}`}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`rounded-xl font-black tabular-nums border-none text-[10px] sm:text-xs ${avg > 0 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground/30'}`}>
                            {avg > 0 ? avg.toFixed(1) : "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-8">
                          {avg > 0 ? (
                            <Badge className="bg-success/20 text-success border-none text-[7px] sm:text-[8px] uppercase tracking-widest font-black rounded-full px-1.5 sm:px-2 py-0">Ready</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground/40 border-none text-[7px] sm:text-[8px] uppercase tracking-widest font-black rounded-full px-1.5 sm:px-2 py-0">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </table>
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-muted/20 border-t flex items-center gap-2 sm:gap-3 px-4 sm:px-8">
             <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
             <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Bulk logging will update scores on student profiles immediately.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentsPage;
