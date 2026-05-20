import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, MapPin, CalendarDays, AlertTriangle, Pencil, Truck, ClipboardList, CheckCircle2, LayoutDashboard, TrendingUp, Search, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Visit = { 
  _id: string; 
  id: string; 
  date: string; 
  centreId: string; 
  centre: string; 
  observer: string; 
  observations: string; 
  issues: string; 
  rating: string; 
  type: "Regular" | "Music Bus" | "Music Bus Audit"; 
  quarter?: string;
  sessionPlanLink?: string;
  documentationLink?: string;
  isSession?: boolean;
};
type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };

const FieldVisitsPage = () => {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [centresList, setCentresList] = useState<Centre[]>([]);

  const [visitType, setVisitType] = useState<"Regular" | "Music Bus" | "Music Bus Audit">("Music Bus");
  const [quarter, setQuarter] = useState("Q1");
  const [sessionPlanLink, setSessionPlanLink] = useState("");
  const [documentationLink, setDocumentationLink] = useState("");
  const [loading, setLoading] = useState(true);

  const quarterlyStats = React.useMemo(() => {
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    const totalCentres = centresList.length;
    if (totalCentres === 0) return quarters.map(q => ({ q, count: 0, percent: 0 }));

    return quarters.map(q => {
      const visitedInQuarter = new Set(
        visits
          .filter(v => (v.type === "Music Bus" || v.type === "Music Bus Audit") && v.quarter === q)
          .map(v => v.centreId)
      );
      const count = visitedInQuarter.size;
      return { q, count, percent: Math.round((count / totalCentres) * 100) };
    });
  }, [visits, centresList]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Visit | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [centreId, setCentreId] = useState("");
  const [observations, setObservations] = useState("");
  const [issues, setIssues] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const params = user?.role === 'fellow' ? `?role=fellow&email=${user.email}` : '';
      const [visitsRes, centresRes, sessionsRes] = await Promise.all([
        api.get(`/field-visits${params}`),
        api.get(`/centres${params}`),
        api.get(`/sessions${params}`)
      ]);
      
      const centresData = centresRes.data;
      
      const sessionVisits = sessionsRes.data
        .filter((s: any) => s.isMusicBus)
        .map((s: any) => {
          const month = new Date(s.date).getMonth();
          let q = "Q1";
          if (month >= 3 && month <= 5) q = "Q1";
          else if (month >= 6 && month <= 8) q = "Q2";
          else if (month >= 9 && month <= 11) q = "Q3";
          else q = "Q4";

          return {
            _id: s._id,
            id: s._id,
            date: s.date,
            centreId: s.centreId,
            centre: centresData.find((c: any) => c._id === s.centreId)?.name || "Unknown",
            observer: "Fellow (Session)",
            observations: s.observations || "No observations recorded.",
            issues: s.issues || "None",
            rating: "Good",
            type: "Music Bus",
            quarter: q,
            sessionPlanLink: s.sessionPlanLink,
            documentationLink: s.documentationLink,
            isSession: true
          };
        });

      setVisits([...visitsRes.data, ...sessionVisits]);
      setCentresList(centresData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { 
    setCentreId(""); 
    setObservations(""); 
    setIssues(""); 
    setDate(new Date().toISOString().split("T")[0]); 
    setVisitType("Music Bus");
    setQuarter("Q1");
    setSessionPlanLink("");
    setDocumentationLink("");
    setEditItem(null); 
  };

  const openEdit = (v: Visit) => {
    setEditItem(v); 
    setObservations(v.observations); 
    setIssues(v.issues === "None" ? "" : v.issues); 
    setDate(v.date); 
    setVisitType(v.type === "Regular" ? "Music Bus" : v.type);
    setQuarter(v.quarter || "Q1");
    setSessionPlanLink(v.sessionPlanLink || "");
    setDocumentationLink(v.documentationLink || "");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!centreId) { toast.error("Please select a centre"); return; }
    
    const centre = centresList.find(c => (c._id || c.id) === centreId);
    const visitData = { 
      centreId,
      centre: centre?.name || "",
      date, 
      observations: observations.trim() || "No specific observations recorded.", 
      issues: issues.trim() || "None", 
      rating: "Good",
      type: visitType,
      quarter: quarter,
      sessionPlanLink: (sessionPlanLink || "").trim(),
      documentationLink: (documentationLink || "").trim(),
      observer: user?.name || "Admin"
    };
    
    try {
      if (editItem) {
        await api.put(`/field-visits/${editItem._id}`, visitData);
        toast.success("Visit updated successfully");
      } else {
        await api.post("/field-visits", visitData);
        toast.success(`${visitType} visit logged successfully`);
      }
      fetchData();
      resetForm(); 
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save visit");
    }
  };

  const filteredVisits = visits.filter(v => v.type === "Music Bus" || v.type === "Music Bus Audit");

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-foreground">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-[950] tracking-tighter text-foreground mb-2">Bus Visits Tracker</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Quarterly Program Quality & Music Bus Monitoring</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />Log Visit
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-lg">
            <div className="bg-primary p-8 text-white">
              <DialogTitle className="text-2xl font-black tracking-tight">{editItem ? "Edit Visit" : "Log Bus Visit"}</DialogTitle>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Quality Assurance Protocol</p>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visit Type</Label>
                  <Select value={visitType} onValueChange={(v: any) => setVisitType(v)}>
                    <SelectTrigger className="rounded-xl h-11 bg-muted/30 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="Music Bus">Music Bus Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl h-11 bg-muted/30 border-none font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Centre</Label>
                  <Select value={centreId} onValueChange={setCentreId} disabled={!!editItem}>
                    <SelectTrigger className="rounded-xl h-11 bg-muted/30 border-none font-bold">
                      <SelectValue placeholder="Select centre" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {centresList.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quarter</Label>
                  <Select value={quarter} onValueChange={(v: any) => setQuarter(v)}>
                    <SelectTrigger className="rounded-xl h-11 bg-muted/30 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="Q1">Quarter 1</SelectItem>
                      <SelectItem value="Q2">Quarter 2</SelectItem>
                      <SelectItem value="Q3">Quarter 3</SelectItem>
                      <SelectItem value="Q4">Quarter 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observations</Label>
                <Textarea placeholder="Key findings and highlights..." value={observations} onChange={e => setObservations(e.target.value)} className="rounded-2xl bg-muted/30 border-none min-h-[100px] resize-none focus-visible:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Critical Issues (if any)</Label>
                <Textarea placeholder="Any blockers or red flags..." value={issues} onChange={e => setIssues(e.target.value)} className="rounded-2xl bg-muted/30 border-none min-h-[80px] resize-none focus-visible:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Session Plan Link</Label>
                  <Input placeholder="Google Drive link..." value={sessionPlanLink} onChange={e => setSessionPlanLink(e.target.value)} className="rounded-xl h-11 bg-muted/30 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Documentation</Label>
                  <Input placeholder="Resource/Photo link..." value={documentationLink} onChange={e => setDocumentationLink(e.target.value)} className="rounded-xl h-11 bg-muted/30 border-none font-bold" />
                </div>
              </div>
            </div>
            <div className="p-8 bg-muted/30 border-t flex justify-end gap-3">
              <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit} className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                {editItem ? "Save Changes" : "Confirm Log"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8 outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quarterlyStats.map(stat => (
              <Card key={stat.q} className="border-none shadow-sm bg-white/60 rounded-3xl overflow-hidden group hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-[1000] uppercase tracking-[0.2em] text-primary">{stat.q} Coverage</span>
                    <span className="text-xs font-black text-muted-foreground">{stat.count}/{centresList.length}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-[1000] tracking-tighter">{stat.percent}%</span>
                      <TrendingUp className={`h-4 w-4 ${stat.percent > 0 ? 'text-success' : 'text-muted-foreground/20'}`} />
                    </div>
                    <Progress value={stat.percent} className="h-2 bg-primary/5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden">
            <div className="p-8 border-b flex items-center justify-between">
              <div>
                <h3 className="font-black text-xl tracking-tight">Quarterly Coverage Matrix</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Status of Music Bus visits across all centres</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-muted/5">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Centre Name</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Q1</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Q2</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Q3</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Q4</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Latest Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/10">
                  {centresList.map(centre => {
                    const cId = centre._id || centre.id;
                    const centreVisits = visits.filter(v => v.centreId === cId && (v.type === "Music Bus" || v.type === "Music Bus Audit"));
                    return (
                      <tr key={cId} className="hover:bg-primary/5 transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-black text-sm tracking-tight">{centre.name}</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                              <MapPin className="h-3 w-3" /> {centre.location}
                           </div>
                        </td>
                        {["Q1", "Q2", "Q3", "Q4"].map(q => {
                          const visited = centreVisits.some(v => v.quarter === q);
                          return (
                            <td key={q} className="px-8 py-6 text-center">
                              {visited ? (
                                <div className="h-6 w-6 rounded-lg bg-success/10 flex items-center justify-center mx-auto">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-lg bg-muted/20 flex items-center justify-center mx-auto">
                                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-8 py-6 text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {centreVisits.length > 0 ? centreVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : "No visits"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <h3 className="font-black text-xl tracking-tight px-2">Detailed Visit Logs</h3>
            <div className="grid grid-cols-1 gap-4">
              {filteredVisits.length === 0 ? (
                <Card className="border-none shadow-sm bg-white/40 rounded-[2rem] p-20 text-center border-2 border-dashed">
                  <Truck className="h-16 w-16 text-muted-foreground mx-auto opacity-10 mb-4" />
                  <p className="text-sm font-bold text-muted-foreground">No Music Bus logs found.</p>
                </Card>
              ) : (
                filteredVisits.map(v => (
                  <Card key={v._id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
                    <CardContent className="p-6 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <Badge className="h-10 w-12 rounded-xl bg-primary/10 text-primary border-none flex items-center justify-center text-xs font-black">{v.quarter}</Badge>
                          <div>
                             <h4 className="font-black text-sm">{v.centre}</h4>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{v.date} • {v.observer}</p>
                          </div>
                       </div>
                       <div className="flex-1 px-12">
                          <p className="text-xs font-medium text-muted-foreground line-clamp-1 italic mb-2">"{v.observations}"</p>
                          <div className="flex flex-wrap gap-2">
                            {v.sessionPlanLink && (
                              <a href={v.sessionPlanLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary hover:underline">
                                <ExternalLink className="h-2.5 w-2.5" /> Plan
                              </a>
                            )}
                            {v.documentationLink && (
                              <a href={v.documentationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary hover:underline">
                                <ExternalLink className="h-2.5 w-2.5" /> Docs
                              </a>
                            )}
                          </div>
                       </div>
                       {!v.isSession ? (
                         <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary shrink-0" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                       ) : (
                         <Badge variant="outline" className="border-orange-500/20 text-orange-600 bg-orange-500/10 rounded-lg text-[10px] font-black uppercase px-2 py-1 tracking-wider shrink-0">Session</Badge>
                       )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default FieldVisitsPage;
