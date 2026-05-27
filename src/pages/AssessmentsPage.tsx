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
  const [activeCategory, setActiveCategory] = useState("SEL-Mid");
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

  useEffect(() => {
    const params = user?.role === 'fellow' ? `?role=fellow&email=${user.email}` : '';
    Promise.all([
      api.get(`/students${params}`), 
      api.get(`/centres${params}`),
      api.get("/fellows"),
      api.get("/assessments")
    ])
      .then(([sRes, cRes, fRes, aRes]) => {
        setStudents(sRes.data);
        setCentres(cRes.data);
        setFellowsList(fRes.data);
        setAssessmentsData(aRes.data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogAssessment = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    
    let payloadData: any = {};
    let finalCategory = activeCategory;
    let finalPhase = activePhase;

    if (activeCategory === "SEL-Mid") {
      payloadData = { selMid: selScores };
      finalPhase = "Continuous";
    } else if (activeCategory === "Musical") {
      payloadData = { musical: musicalScores };
      finalPhase = "Mid";
    } else if (activeCategory === "InSchool-PrePost") {
      if (activePhase === "Mid") {
        // Mid phase for In-school: combined musical + SEL
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
        payloadData = { afterSchool: afterSchoolData };
      }
    }

    const acadYear = selectedMonth < 6 ? selectedYear - 1 : selectedYear;
    let dateStr = new Date().toISOString();
    if (finalCategory === "SEL-Mid") {
      dateStr = new Date(selectedYear, selectedMonth, 15).toISOString();
    } else if (finalCategory === "Musical" || finalCategory === "Mid-Evaluation") {
      const q = activeQuarter;
      if (q === "Q1") dateStr = new Date(acadYear, 7, 15).toISOString();
      else if (q === "Q2") dateStr = new Date(acadYear, 10, 15).toISOString();
      else if (q === "Q3") dateStr = new Date(acadYear + 1, 1, 15).toISOString();
      else if (q === "Q4") dateStr = new Date(acadYear + 1, 4, 15).toISOString();
    } else {
      const p = finalPhase;
      if (p === "Pre") dateStr = new Date(acadYear, 6, 15).toISOString();
      else if (p === "Post") dateStr = new Date(acadYear + 1, 5, 15).toISOString();
    }

    try {
      await api.post("/assessments", {
        studentId: selectedStudent._id || selectedStudent.id,
        centreId: selectedStudent.centreId,
        fellowId: user?.id,
        category: finalCategory,
        phase: finalPhase,
        quarter: (finalPhase === "Mid" || finalCategory === "Mid-Evaluation") ? activeQuarter : undefined,
        data: payloadData,
        date: dateStr,
        remarks
      });
      toast.success("Assessment logged successfully");
      setIsLogOpen(false);
      const aRes = await api.get("/assessments");
      setAssessmentsData(aRes.data);
    } catch (error) {
      toast.error("Failed to log assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    setIsSubmitting(true);
    try {
      const acadYear = selectedMonth < 6 ? selectedYear - 1 : selectedYear;
      let dateStr = new Date().toISOString();
      if (activeCategory === "SEL-Mid") {
        dateStr = new Date(selectedYear, selectedMonth, 15).toISOString();
      } else if (activeCategory === "Musical" || activeCategory === "Mid-Evaluation") {
        const q = activeQuarter;
        if (q === "Q1") dateStr = new Date(acadYear, 7, 15).toISOString();
        else if (q === "Q2") dateStr = new Date(acadYear, 10, 15).toISOString();
        else if (q === "Q3") dateStr = new Date(acadYear + 1, 1, 15).toISOString();
        else if (q === "Q4") dateStr = new Date(acadYear + 1, 4, 15).toISOString();
      } else {
        const p = activePhase;
        if (p === "Pre") dateStr = new Date(acadYear, 6, 15).toISOString();
        else if (p === "Post") dateStr = new Date(acadYear + 1, 5, 15).toISOString();
      }

      const assessments = Object.entries(bulkScores).map(([studentId, data]) => ({
        studentId,
        centreId: selectedCentreId,
        fellowId: user?.id,
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
      const aRes = await api.get("/assessments");
      setAssessmentsData(aRes.data);
    } catch (error) {
      toast.error("Failed to save bulk assessments");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCentre = centres.find(c => (c._id || c.id) === selectedCentreId);
  const centreStudents = selectedCentreId ? students.filter(s => (s.centreId?._id || s.centreId) === selectedCentreId) : [];

  const processedAssessments = useMemo(() =>
    centreStudents
      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((s) => {
        const studentAssessments = assessmentsData.filter(a => (a.studentId?._id || a.studentId) === (s._id || s.id));
        return {
          id: s._id || s.id,
          student: s.name,
          records: studentAssessments,
          raw: s
        };
      }),
    [centreStudents, searchQuery, assessmentsData]
  );

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
          <div className="flex items-center gap-2">
            <Select value={filterFellow} onValueChange={setFilterFellow}>
              <SelectTrigger className="h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs w-[180px]"><SelectValue placeholder="All Fellows" /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">All Fellows</SelectItem>
                {fellowsList.map(f => <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs w-[150px]"><SelectValue placeholder="Centre Type" /></SelectTrigger>
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
              const studentCount = students.filter(s => (s.centreId?._id || s.centreId) === (centre._id || centre.id)).length;
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
                        <div className="flex items-center gap-1.5 text-primary">
                          <GraduationCap className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Progress Tracking Active</span>
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

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCentreId(null)} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm hover:bg-primary hover:text-white transition-all shrink-0">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-3xl font-[950] tracking-tighter text-foreground">{selectedCentre?.name}</h1>
            <div className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
              <Badge variant={selectedCentre?.type === "In-school" ? "default" : "secondary"} className="rounded-full text-[10px] uppercase tracking-widest font-black">{selectedCentre?.type}</Badge>
              <span className="opacity-20">|</span>
              <span className="text-sm font-bold">{centreStudents.length} Students Enrolled</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
          <div className="relative min-w-0 flex-1 sm:flex-none sm:min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
            <Input 
              placeholder="Find student..." 
              className="pl-10 rounded-xl bg-white/60 border-none h-10 shadow-sm focus:ring-primary/20 font-bold text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="h-8 w-px bg-primary/10 mx-1" />

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

          {activeTab === "SEL" && (
            <Button 
              className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-lg hover:shadow-primary/20 transition-all ml-1"
              onClick={() => {
                setBulkScores({});
                setActiveCategory("SEL-Mid");
                setActivePhase("Continuous");
                setIsBulkOpen(true);
              }}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Bulk Log
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 p-1.5 bg-white/50 backdrop-blur-xl rounded-[1.5rem] border border-white/20 shadow-xl h-14">
          <TabsTrigger value="SEL" className="rounded-xl h-10 px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">Session Logs (SEL)</TabsTrigger>
          <TabsTrigger value="Milestones" className="rounded-xl h-10 px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">Annual Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="SEL" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 gap-4">
            {processedAssessments.map((a) => {
              const records = a.records.filter(r => r.category === "SEL-Mid" && r.phase === "Continuous");
              const monthlyRecord = records.find(r => {
                const d = new Date(r.date);
                return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
              });
              
              const isAssessedThisMonth = monthlyRecord !== undefined;
              const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

              return (
                <Card key={a.id} className="glass-card-premium border-none shadow-xl hover:shadow-2xl transition-all rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row lg:items-center">
                      <div className="p-8 lg:w-[280px] bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <h4 className="font-black text-lg tracking-tight mb-1 group-hover:text-primary transition-colors">{a.student}</h4>
                        <div className="flex items-center gap-2 mt-2">
                           <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary/60">{records.length} TOTAL LOGS</Badge>
                           {isAssessedThisMonth && <Badge className="bg-success/10 text-success border-none text-[8px] font-black uppercase tracking-widest">CURRENT MONTH SYNCED</Badge>}
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-wrap items-center gap-12">
                        <div className="text-center group/score"><p className="text-[10px] font-black text-muted-foreground/50 uppercase mb-3 tracking-widest group-hover/score:text-primary transition-colors">Involvement</p><ScoreCell score={monthlyRecord?.data.selMid?.involvement} /></div>
                        <div className="text-center group/score"><p className="text-[10px] font-black text-muted-foreground/50 uppercase mb-3 tracking-widest group-hover/score:text-primary transition-colors">Emotion</p><ScoreCell score={monthlyRecord?.data.selMid?.emotion} /></div>
                        <div className="text-center group/score"><p className="text-[10px] font-black text-muted-foreground/50 uppercase mb-3 tracking-widest group-hover/score:text-primary transition-colors">Creativity</p><ScoreCell score={monthlyRecord?.data.selMid?.creativity} /></div>
                        <div className="text-center group/score"><p className="text-[10px] font-black text-muted-foreground/50 uppercase mb-3 tracking-widest group-hover/score:text-primary transition-colors">Interaction</p><ScoreCell score={monthlyRecord?.data.selMid?.interaction} /></div>
                      </div>
                      <div className="p-8 lg:border-l border-primary/5 flex items-center gap-4 bg-muted/5 min-w-[200px] justify-center">
                        {isAssessedThisMonth ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                               <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <p className="text-[10px] font-black text-success uppercase tracking-widest">LOGGED {new Date(monthlyRecord.date).toLocaleDateString()}</p>
                          </div>
                        ) : (
                          <Button 
                            className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                            onClick={() => {
                              setSelectedStudent(a.raw);
                              setActiveCategory("SEL-Mid");
                              setActivePhase("Continuous");
                              setIsLogOpen(true);
                            }}
                          >
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Log SEL Scores
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
           <div className="rounded-2xl border border-primary/5 overflow-hidden bg-white shadow-lg">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_repeat(6,100px)] gap-0 bg-muted/40 border-b border-primary/10 px-5 py-3">
                <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Student</span>
                <span className="text-xs font-black uppercase tracking-wide text-center text-muted-foreground">Pre</span>
                <span className="text-xs font-black uppercase tracking-wide text-center text-primary">Q1<span className="block text-[9px] font-bold text-muted-foreground/50 normal-case">Jul-Sep</span></span>
                <span className="text-xs font-black uppercase tracking-wide text-center text-primary">Q2<span className="block text-[9px] font-bold text-muted-foreground/50 normal-case">Oct-Dec</span></span>
                <span className="text-xs font-black uppercase tracking-wide text-center text-primary">Q3<span className="block text-[9px] font-bold text-muted-foreground/50 normal-case">Jan-Mar</span></span>
                <span className="text-xs font-black uppercase tracking-wide text-center text-primary">Q4<span className="block text-[9px] font-bold text-muted-foreground/50 normal-case">Apr-Jun</span></span>
                <span className="text-xs font-black uppercase tracking-wide text-center text-muted-foreground">Post</span>
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
                const midQ1 = academicYearRecords.find(r => (r.category === "Musical" || r.category === "Mid-Evaluation") && r.phase === "Mid" && r.quarter === "Q1");
                const midQ2 = academicYearRecords.find(r => (r.category === "Musical" || r.category === "Mid-Evaluation") && r.phase === "Mid" && r.quarter === "Q2");
                const midQ3 = academicYearRecords.find(r => (r.category === "Musical" || r.category === "Mid-Evaluation") && r.phase === "Mid" && r.quarter === "Q3");
                const midQ4 = academicYearRecords.find(r => (r.category === "Musical" || r.category === "Mid-Evaluation") && r.phase === "Mid" && r.quarter === "Q4");
                
                return (
                  <div key={a.id} className="grid grid-cols-[1fr_repeat(6,100px)] gap-0 items-center px-5 py-3 border-b border-muted/50 hover:bg-primary/[0.02] transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary">{a.student.charAt(0)}</div>
                      <div>
                        <span className="text-sm font-bold block leading-tight">{a.student}</span>
                      </div>
                    </div>
                    {/* Pre */}
                    <div className="text-center">
                      {pre ? <Badge className="bg-success/10 text-success border-none text-xs font-bold px-3">Done</Badge> : <Badge variant="outline" className="text-xs font-medium px-3 cursor-pointer hover:bg-primary/5" onClick={() => {
                        setSelectedStudent(a.raw);
                        setActiveCategory(selectedCentre?.type === "In-school" ? "InSchool-PrePost" : "AfterSchool-PrePost");
                        setActivePhase("Pre");
                        setIsLogOpen(true);
                      }}>Pending</Badge>}
                    </div>
                    {/* Q1-Q4 */}
                    {[{data: midQ1, q: "Q1"}, {data: midQ2, q: "Q2"}, {data: midQ3, q: "Q3"}, {data: midQ4, q: "Q4"}].map(({data, q}) => (
                      <div key={q} className="text-center">
                        {data ? (
                          <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-3">{data.averageScore?.toFixed(1)}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-medium px-3 cursor-pointer hover:bg-primary/5 hover:text-primary" onClick={() => {
                            setSelectedStudent(a.raw);
                            setActiveCategory("Musical");
                            setActivePhase("Mid");
                            setActiveQuarter(q);
                            setIsLogOpen(true);
                          }}>Log</Badge>
                        )}
                      </div>
                    ))}
                    {/* Post */}
                    <div className="text-center">
                      {post ? <Badge className="bg-success/10 text-success border-none text-xs font-bold px-3">Done</Badge> : <Badge variant="outline" className="text-xs font-medium px-3 cursor-pointer hover:bg-primary/5" onClick={() => {
                        setSelectedStudent(a.raw);
                        setActiveCategory(selectedCentre?.type === "In-school" ? "InSchool-PrePost" : "AfterSchool-PrePost");
                        setActivePhase("Post");
                        setIsLogOpen(true);
                      }}>Pending</Badge>}
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
              <DialogTitle className="text-2xl font-[950] tracking-tight">Record Performance: {selectedStudent?.name}</DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-medium text-sm">
                Logging {activeCategory === "SEL-Mid" ? `Monthly SEL Assessment` : activeCategory === "Musical" ? `Quarterly Musical Assessment — ${activeQuarter}` : `${activeCategory} Assessment Phase`}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                  <Select value={activeCategory} onValueChange={(v) => {
                    setActiveCategory(v);
                    if (v === "SEL-Mid") setActivePhase("Continuous");
                    else if (v === "Musical") setActivePhase("Mid");
                  }}>
                    <SelectTrigger className="rounded-2xl h-12 bg-muted border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="SEL-Mid">SEL Progress (Monthly)</SelectItem>
                      <SelectItem value="Musical">Musical Proficiency (Quarterly)</SelectItem>
                      {selectedCentre?.type === "In-school" && <SelectItem value="InSchool-PrePost">In-School Pre/Post</SelectItem>}
                      {selectedCentre?.type === "After-school" && <SelectItem value="AfterSchool-PrePost">After-School Pre/Post</SelectItem>}
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
                          <Label className="capitalize font-black text-[10px] tracking-widest text-muted-foreground">{k}</Label>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button
                                key={v}
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

              {(activeCategory === "SEL-Mid" || (activePhase === "Mid" && activeCategory !== "Musical")) && (
                 <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="p-6 bg-accent/5 rounded-[2.5rem] border border-accent/10">
                       <h5 className="font-black text-sm mb-6 flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> {activeCategory === "SEL-Mid" ? "Quarterly SEL Rubrics" : "Quantitative SEL Rubrics"}</h5>
                       <div className="space-y-6">
                          {SEL_CATEGORIES.map((key) => (
                            <div key={key} className="space-y-3">
                              <Label className="capitalize font-black text-[10px] tracking-widest text-muted-foreground">{key}</Label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(v => (
                                  <button
                                    key={v}
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
                              <Label className="capitalize font-black text-[10px] tracking-widest text-muted-foreground">{k}</Label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(v => (
                                  <button
                                    key={v}
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

              {(activePhase === "Pre" || activePhase === "Post") && activeCategory !== "Musical" && activeCategory === "InSchool-PrePost" && (
                <div className="space-y-8">
                  {Object.entries(LEADING_QUESTIONS).map(([domain, questions]) => (
                    <div key={domain} className="space-y-4">
                      <h5 className="font-black uppercase tracking-[0.2em] text-[10px] text-primary bg-primary/5 w-fit px-4 py-1.5 rounded-full">Leading {domain}</h5>
                      <div className="space-y-4">
                        {questions.map((q, i) => (
                          <div key={i} className="space-y-3 p-4 bg-muted/30 rounded-2xl">
                            <p className="text-xs font-bold leading-relaxed">{q}</p>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(v => (
                                <button
                                  key={v}
                                  onClick={() => {
                                    const newScores = { ...leadingScores };
                                    newScores[domain as keyof typeof leadingScores][i] = v;
                                    setLeadingScores(newScores);
                                  }}
                                  className={`flex-1 h-9 rounded-xl font-black text-[10px] transition-all ${leadingScores[domain as keyof typeof leadingScores][i] === v ? 'bg-primary text-white shadow-lg' : 'bg-white'}`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(activePhase === "Pre" || activePhase === "Post") && activeCategory !== "Musical" && activeCategory === "AfterSchool-PrePost" && (
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
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-2xl h-12 px-8 font-bold">Cancel</Button>
            </DialogClose>
            <Button 
              className="rounded-2xl h-12 px-10 font-[950] uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" 
              onClick={handleLogAssessment}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Syncing Record..." : "Confirm & Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className={`rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl ${activeCategory === "Mid-Evaluation" ? "max-w-[98vw] w-full" : "max-w-[95vw] w-[1100px]"}`}>
          <div className="bg-primary p-6 text-white flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-[950] tracking-tight">Bulk Assessment: {selectedCentre?.name}</DialogTitle>
              <DialogDescription className="sr-only">Bulk score entry for all students at this centre</DialogDescription>
              <div className="flex items-center gap-4 mt-2">
                <Badge className="bg-white/20 text-white border-none rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1 h-7">
                   {activeCategory === "SEL-Mid" ? "Monthly SEL Progress" : "Quarterly Musical Progress"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setIsBulkOpen(false)} className="text-white hover:bg-white/10 rounded-xl h-10 px-4 font-bold"><X className="mr-2 h-4 w-4" /> Cancel</Button>
              <Button 
                onClick={handleBulkSubmit}
                disabled={isSubmitting}
                className="bg-white text-primary hover:bg-white/90 rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-xl"
              >
                {isSubmitting ? "Saving..." : "Save All Records"}
              </Button>
            </div>
          </div>
          
          <div className="p-0">
            <ScrollArea className="h-[75vh]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-20">
                  <TableRow>
                    <TableHead className="w-[140px] min-w-[140px] font-black text-[10px] uppercase tracking-widest pl-4 sticky left-0 bg-muted/50 z-30">Student Name</TableHead>
                    {(activeCategory === "Musical" || activeCategory === "Mid-Evaluation") && ["Sur", "Laya", "Word", "Bhav"].map(k => (
                      <TableHead key={k} className="text-center font-black text-[10px] uppercase tracking-widest">{k}</TableHead>
                    ))}
                    {(activeCategory === "SEL-Mid" || activeCategory === "Mid-Evaluation") && ["Invol.", "Emot.", "Creat.", "Inter."].map(k => (
                      <TableHead key={k} className="text-center font-black text-[10px] uppercase tracking-widest text-accent">{k}</TableHead>
                    ))}
                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest">Avg</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest pr-8">Status</TableHead>
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
                      } else if (activeCategory === "Mid-Evaluation") {
                        const total = (m.sur+m.laya+m.word+m.bhav + sel.involvement+sel.emotion+sel.creativity+sel.interaction);
                        return total > 0 ? total / 8 : 0;
                      }
                      return 0;
                    };

                    const avg = calculateAvg();

                    return (
                      <TableRow key={sId} className="hover:bg-primary/5 transition-colors group">
                        <TableCell className="font-bold text-xs pl-4 sticky left-0 bg-white z-10 group-hover:bg-primary/5">{s.name}</TableCell>
                        {(activeCategory === "Musical" || activeCategory === "Mid-Evaluation") && ['sur', 'laya', 'word', 'bhav'].map(k => (
                          <TableCell key={k} className="text-center p-1">
                            <div className="flex items-center justify-center gap-px">
                              {[1, 2, 3, 4, 5].map(v => (
                                <button
                                  key={v}
                                  onClick={() => {
                                    const next = { ...bulkScores };
                                    if (!next[sId]) next[sId] = { musical: { sur: 0, laya: 0, word: 0, bhav: 0 }, selMid: { involvement: 0, emotion: 0, creativity: 0, interaction: 0 } };
                                    next[sId].musical[k] = v;
                                    setBulkScores(next);
                                  }}
                                  className={`${activeCategory === "Mid-Evaluation" ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]"} rounded-lg font-black transition-all ${sData.musical[k] === v ? 'bg-primary text-white shadow-sm' : 'bg-muted hover:bg-muted/80'}`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                        ))}
                        {activeCategory === "Mid-Evaluation" && ['involvement', 'emotion', 'creativity', 'interaction'].map(k => (
                          <TableCell key={k} className="text-center p-1">
                            <div className="flex items-center justify-center gap-px">
                              {[1, 2, 3, 4, 5].map(v => (
                                <button
                                  key={v}
                                  onClick={() => {
                                    const next = { ...bulkScores };
                                    if (!next[sId]) next[sId] = { musical: { sur: 0, laya: 0, word: 0, bhav: 0 }, selMid: { involvement: 0, emotion: 0, creativity: 0, interaction: 0 } };
                                    next[sId].selMid[k] = v;
                                    setBulkScores(next);
                                  }}
                                  className={`h-6 w-6 rounded text-[9px] font-black transition-all ${sData.selMid[k] === v ? 'bg-accent text-white shadow-sm' : 'bg-muted hover:bg-muted/80'}`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                        ))}
                        {activeCategory === "SEL-Mid" && ['involvement', 'emotion', 'creativity', 'interaction'].map(k => (
                          <TableCell key={k} className="text-center p-2">
                            <div className="flex items-center justify-center gap-1">
                              {[1, 2, 3, 4, 5].map(v => (
                                <button
                                  key={v}
                                  onClick={() => {
                                    const newScores = { ...bulkScores };
                                    if (!newScores[sId]) newScores[sId] = { selMid: { involvement: 0, emotion: 0, creativity: 0, interaction: 0 } };
                                    newScores[sId].selMid[k] = v;
                                    setBulkScores(newScores);
                                  }}
                                  className={`h-7 w-7 rounded-lg text-[10px] font-black transition-all ${sData.selMid[k] === v ? 'bg-accent text-white shadow-md' : 'bg-muted hover:bg-muted/80'}`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`rounded-xl font-black tabular-nums border-none ${avg > 0 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground/30'}`}>
                            {avg > 0 ? avg.toFixed(1) : "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8">
                          {avg > 0 ? (
                            <Badge className="bg-success/20 text-success border-none text-[8px] uppercase tracking-widest font-black rounded-full px-2 py-0">Ready</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground/40 border-none text-[8px] uppercase tracking-widest font-black rounded-full px-2 py-0">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          <div className="p-4 bg-muted/20 border-t flex items-center gap-3 px-8">
             <Info className="h-4 w-4 text-primary" />
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Bulk logging will update the last assessment score on student profiles immediately.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentsPage;
