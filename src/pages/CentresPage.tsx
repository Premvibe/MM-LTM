import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Plus, MapPin, Users, Pencil, Search, Filter, PauseCircle, PlayCircle, X, Trash2, BookOpen, Calendar, ClipboardCheck, Award } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";


type Centre = { 
  _id: string; 
  id: string; 
  name: string; 
  location: string; 
  type: "In-school" | "After-school"; 
  fellowIds: string[]; 
  studentCount: number; 
  totalSessions?: number;
  sessionCount?: number;
  attendanceRate?: number;
  assessmentPercent?: number;
  avgAssessmentScore?: number;
  status?: "active" | "paused"; 
  startDate?: string; 
  endDate?: string; 
  pocName?: string; 
  pocContact?: string; 
  pocEmail?: string; 
  programManagers?: string[]; 
  programManagerNames?: string[]; 
  programManagerIds?: string[]; 
};
type Fellow = { _id: string; id: string; name: string; email: string; phone: string; centreIds: string[]; sessionsCompleted: number; attendanceRate: number; batch?: string };
type PMUser = { _id: string; name: string; email: string; role: string; assignedCentreIds?: string[] };

const getPMs = (c: Centre): string[] => {
  if (c.programManagers && c.programManagers.length > 0) return c.programManagers;
  if ((c as any).programManagerNames && (c as any).programManagerNames.length > 0) return (c as any).programManagerNames;
  return [];
};

const CentresPage = () => {
  const { user, isAdmin, isSuperAdmin, isMEManager } = useAuth();
  const navigate = useNavigate();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
  const [pmList, setPmList] = useState<PMUser[]>([]);
  const [selectedPmIds, setSelectedPmIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Centre | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"In-school" | "After-school">("In-school");
  const [selectedFellowIds, setSelectedFellowIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterFellow, setFilterFellow] = useState<string>("all");
  const [filterPM, setFilterPM] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterSessionPresence, setFilterSessionPresence] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pocName, setPocName] = useState("");
  const [pocContact, setPocContact] = useState("");
  const [pocEmail, setPocEmail] = useState("");

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

  const filteredCentres = useMemo(() => {
    return centres.filter(c => {
      const assignedFellows = c.fellowIds.map(fid => fellowsList.find(f => f._id === fid || f.id === fid)?.name || "").join(" ").toLowerCase();
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          assignedFellows.includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || c.type === filterType;
      const matchesBatch = filterBatch === "all" || c.fellowIds.some(fid => {
        const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
        return fellow?.batch === filterBatch;
      });
      const matchesFellow = filterFellow === "all" || c.fellowIds.includes(filterFellow);
      const pmNames = getPMs(c);
      const matchesPM = filterPM === "all" || 
                        (filterPM === "unassigned" ? pmNames.length === 0 :
                         filterPM === "assigned" ? pmNames.length > 0 :
                         pmNames.includes(filterPM));
      const matchesStatus = filterStatus === "all" || 
                            (filterStatus === "active" ? c.status !== "paused" : c.status === "paused");

      const sessionsCountForCentre = (filterMonth !== 'all' || filterYear !== 'all' ? c.sessionCount : c.totalSessions) ?? c.sessionCount ?? 0;
      const matchesSessionPresence = filterSessionPresence === "all" ||
        (filterSessionPresence === "has_sessions" ? sessionsCountForCentre > 0 : sessionsCountForCentre === 0);

      return matchesSearch && matchesType && matchesBatch && matchesFellow && matchesPM && matchesStatus && matchesSessionPresence;
    });
  }, [centres, fellowsList, searchQuery, filterType, filterBatch, filterFellow, filterPM, filterStatus, filterSessionPresence, filterMonth, filterYear]);

  const totalSessionsCount = useMemo(() => {
    return filteredCentres.reduce((acc, c) => acc + ((filterMonth !== 'all' || filterYear !== 'all' ? c.sessionCount : c.totalSessions) ?? c.sessionCount ?? 0), 0);
  }, [filteredCentres, filterMonth, filterYear]);

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (user?.role === 'fellow' && user.email) {
        params.set('role', 'fellow');
        params.set('email', user.email);
      } else if (user?.role === 'program_manager' && user.email) {
        params.set('role', 'program_manager');
        params.set('email', user.email);
      }
      if (filterMonth !== 'all') {
        params.set('month', filterMonth);
      }
      if (filterYear !== 'all') {
        params.set('year', filterYear);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const emailParams = user?.role === 'fellow' 
        ? `?role=fellow&email=${user.email}` 
        : user?.role === 'program_manager' 
          ? `?role=program_manager&email=${user.email}` 
          : '';

      const [centresRes, fellowsRes, adminsRes] = await Promise.all([
        api.get(`/centres${queryString}`),
        api.get(`/fellows${emailParams}`),
        isSuperAdmin ? api.get('/admins') : Promise.resolve({ data: [] })
      ]);
      setCentres(centresRes.data.sort((a: Centre, b: Centre) => a.name.localeCompare(b.name)));
      setFellowsList(fellowsRes.data.sort((a: Fellow, b: Fellow) => a.name.localeCompare(b.name)));
      if (adminsRes.data && Array.isArray(adminsRes.data)) {
        setPmList(adminsRes.data.filter((a: any) => a.role === 'program_manager'));
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { 
    setName(""); 
    setLocation(""); 
    setType("In-school"); 
    setSelectedFellowIds([]); 
    setSelectedPmIds([]);
    setStartDate(""); 
    setEndDate(""); 
    setPocName(""); 
    setPocContact(""); 
    setPocEmail(""); 
    setEditItem(null); 
  };

  const openEdit = (c: Centre) => {
    setEditItem(c); 
    setName(c.name); 
    setLocation(c.location); 
    setType(c.type); 
    setSelectedFellowIds(c.fellowIds); 
    
    // Initialize selected PM IDs: from programManagerIds or matching names with pmList
    const pmsForCentre = getPMs(c);
    const existingPmIds = c.programManagerIds && c.programManagerIds.length > 0
      ? c.programManagerIds
      : pmList.filter(pm => pmsForCentre.includes(pm.name)).map(pm => pm._id);
    setSelectedPmIds(existingPmIds);

    setStartDate(c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : "");
    setEndDate(c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : "");
    setPocName(c.pocName || "");
    setPocContact(c.pocContact || "");
    setPocEmail(c.pocEmail || "");
    setOpen(true);
  };

  const togglePM = (pmId: string) => {
    setSelectedPmIds(prev => 
      prev.includes(pmId) ? prev.filter(id => id !== pmId) : [...prev, pmId]
    );
  };

  const toggleFellow = (fid: string) => {
    setSelectedFellowIds(prev => {
      // Find the fellow to know both their _id and potential id
      const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
      if (!fellow) return prev;
      
      const isAlreadySelected = prev.some(id => id === fellow._id || id === fellow.id);
      
      if (isAlreadySelected) {
        return prev.filter(id => id !== fellow._id && id !== fellow.id);
      }
      
      const limit = type === "In-school" ? 2 : 1;
      if (prev.length >= limit) {
        toast.warning(`Maximum ${limit} fellow(s) allowed for ${type} centres`);
        return prev;
      }
      return [...prev, fid];
    });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !location.trim()) { toast.error("Please fill in all fields"); return; }
    if (type === "In-school" && selectedFellowIds.length !== 2) {
      toast.error("In-school centres must have exactly 2 fellows assigned");
      return;
    }
    if (type === "After-school" && selectedFellowIds.length !== 1) {
      toast.error("After-school centres must have exactly 1 fellow assigned");
      return;
    }

    const centreData = { 
      name: name.trim(), 
      location: location.trim(), 
      type, 
      fellowIds: selectedFellowIds,
      programManagerIds: selectedPmIds,
      startDate: startDate || undefined,
      endDate: endDate === "" ? null : endDate,
      pocName: pocName.trim() || undefined,
      pocContact: pocContact.trim() || undefined,
      pocEmail: pocEmail.trim() || undefined
    };

    try {
      if (editItem) {
        await api.put(`/centres/${editItem._id}`, centreData);
        toast.success("Centre updated successfully");
      } else {
        await api.post("/centres", { ...centreData, studentCount: 0 });
        toast.success("Centre added successfully");
      }
      fetchData();
      resetForm(); 
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save centre");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this centre?")) return;
    try {
      await api.delete(`/centres/${id}`);
      toast.success("Centre deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete centre");
    }
  };

  const toggleStatus = async (e: React.MouseEvent, centre: Centre) => {
    e.stopPropagation();
    const newStatus = centre.status === "paused" ? "active" : "paused";
    try {
      await api.put(`/centres/${centre._id}`, { status: newStatus });
      toast.success(`Centre ${newStatus === "active" ? "resumed" : "paused"} successfully`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Centres</h1>
          <p className="page-description">Manage learning centres across the program</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Centre</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Centre" : "Add New Centre"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-2">
              <div className="space-y-2">
                <Label htmlFor="name">Centre Name</Label>
                <Input id="name" placeholder="e.g. Govt. School - Saket" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Saket, New Delhi" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v: "In-school" | "After-school") => {
                  setType(v);
                  if (v === "After-school" && selectedFellowIds.length > 1) {
                    setSelectedFellowIds(selectedFellowIds.slice(0, 1));
                  }
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-school">In-school (2 Fellows)</SelectItem>
                    <SelectItem value="After-school">After-school (1 Fellow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Starting Date</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Closing Date</Label>
                  <div className="flex items-center gap-2">
                    <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1" />
                    {endDate && (
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setEndDate("")} title="Clear closing date">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="pocName">POC Name</Label>
                  <Input id="pocName" placeholder="e.g. Rahul Sharma" value={pocName} onChange={e => setPocName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pocContact">Contact Number</Label>
                  <Input id="pocContact" placeholder="e.g. 9876543210" value={pocContact} onChange={e => setPocContact(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pocEmail">Email ID</Label>
                  <Input id="pocEmail" placeholder="e.g. rahul@school.edu" value={pocEmail} onChange={e => setPocEmail(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign Fellows <span className="text-xs text-muted-foreground">({type === "In-school" ? "exactly 2 required" : "exactly 1 required"})</span></Label>
                <div className="border rounded-md p-3 space-y-4 max-h-60 overflow-y-auto">
                  {Array.from(new Set(fellowsList.map(f => f.batch || "Unspecified"))).sort().reverse().map(batchVersion => (
                    <div key={batchVersion} className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Batch {batchVersion}</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {fellowsList
                          .filter(f => (f.batch || "Unspecified") === batchVersion)
                          .map(f => {
                            const isSelected = selectedFellowIds.some(id => id === f._id || id === f.id);
                            return (
                              <div key={f._id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`fellow-${f._id}`}
                                  checked={isSelected}
                                  disabled={!isSelected && selectedFellowIds.length >= (type === "In-school" ? 2 : 1)}
                                  onCheckedChange={() => toggleFellow(f._id)}
                                />
                                <label htmlFor={`fellow-${f._id}`} className="text-sm cursor-pointer flex items-center justify-between flex-1 pr-2">
                                  <span>{f.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{f.phone || f.email}</span>
                                </label>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
                {((type === "In-school" && selectedFellowIds.length !== 2) || (type === "After-school" && selectedFellowIds.length !== 1)) && (
                  <p className="text-xs text-destructive">Please select exactly {type === "In-school" ? 2 : 1} fellow{type === "In-school" ? "s" : ""} ({selectedFellowIds.length} selected)</p>
                )}
              </div>

              {isSuperAdmin && pmList.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <Label>Assign Program Manager(s) <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {pmList.map(pm => {
                      const isSelected = selectedPmIds.includes(pm._id);
                      return (
                        <div key={pm._id} className="flex items-center gap-2">
                          <Checkbox
                            id={`pm-${pm._id}`}
                            checked={isSelected}
                            onCheckedChange={() => togglePM(pm._id)}
                          />
                          <label htmlFor={`pm-${pm._id}`} className="text-sm cursor-pointer flex items-center justify-between flex-1 pr-2">
                            <span className="font-medium">{pm.name}</span>
                            <span className="text-[10px] text-muted-foreground">{pm.email}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit}>{editItem ? "Save Changes" : "Add Centre"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 ${isSuperAdmin ? 'xl:grid-cols-6' : 'xl:grid-cols-4'} gap-4 mb-6`}>
        <Card 
          className={`cursor-pointer transition-all ${filterStatus === 'all' && filterPM === 'all' && filterSessionPresence === 'all' ? 'ring-2 ring-primary shadow-sm' : ''} bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:scale-[1.02]`}
          onClick={() => { setFilterStatus("all"); setFilterPM("all"); setFilterSessionPresence("all"); }}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Total Centres</p>
              <p className="text-2xl font-black mt-1">{filteredCentres.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${filterStatus === 'active' ? 'ring-2 ring-success shadow-sm' : ''} bg-gradient-to-br from-success/10 to-success/5 border-success/20 hover:scale-[1.02]`}
          onClick={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-success uppercase tracking-wider">Active</p>
              <p className="text-2xl font-black mt-1">{filteredCentres.filter(c => c.status !== "paused").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
              <PlayCircle className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${filterStatus === 'paused' ? 'ring-2 ring-warning shadow-sm' : ''} bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hover:scale-[1.02]`}
          onClick={() => setFilterStatus(filterStatus === 'paused' ? 'all' : 'paused')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-warning uppercase tracking-wider">Paused</p>
              <p className="text-2xl font-black mt-1">{filteredCentres.filter(c => c.status === "paused").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
              <PauseCircle className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${filterSessionPresence === 'has_sessions' ? 'ring-2 ring-indigo-500 shadow-sm' : ''} bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 hover:scale-[1.02]`}
          onClick={() => setFilterSessionPresence(prev => prev === 'has_sessions' ? 'all' : 'has_sessions')}
          title="Click to toggle centres with sessions"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                {filterMonth !== 'all' ? `${months.find(m => m.value === filterMonth)?.label?.slice(0, 3)} Sessions` : 'Total Sessions'}
              </p>
              <p className="text-2xl font-black mt-1 text-indigo-950 dark:text-indigo-200">{totalSessionsCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        {isSuperAdmin && (
          <>
            <Card 
              className={`cursor-pointer transition-all ${filterPM === 'assigned' ? 'ring-2 ring-purple-500 shadow-sm' : ''} bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:scale-[1.02]`}
              onClick={() => setFilterPM(filterPM === 'assigned' ? 'all' : 'assigned')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">PM Assigned</p>
                  <p className="text-2xl font-black mt-1">{centres.filter(c => getPMs(c).length > 0).length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all ${filterPM === 'unassigned' ? 'ring-2 ring-red-500 shadow-sm' : ''} bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 hover:scale-[1.02]`}
              onClick={() => setFilterPM(filterPM === 'unassigned' ? 'all' : 'unassigned')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Unassigned</p>
                  <p className="text-2xl font-black mt-1">{centres.filter(c => getPMs(c).length === 0).length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/40 shadow-sm space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
            <Input 
              placeholder="Search centres by name, location, or fellow..." 
              className="pl-10 h-10 rounded-xl border-border/40 bg-white/90 font-medium text-xs w-full shadow-none focus-visible:ring-primary/20" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          {(filterMonth !== 'all' || filterYear !== 'all' || filterBatch !== 'all' || filterFellow !== 'all' || filterType !== 'all' || filterPM !== 'all' || filterSessionPresence !== 'all' || searchQuery) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setFilterMonth("all");
                setFilterYear("all");
                setFilterBatch("all");
                setFilterFellow("all");
                setFilterType("all");
                setFilterPM("all");
                setFilterSessionPresence("all");
                setSearchQuery("");
              }} 
              className="h-10 px-3.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 shrink-0"
              title="Reset all filters"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Reset Filters
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/20">
          <div className="flex items-center gap-1.5 mr-1 text-muted-foreground/80">
            <Filter className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Filters:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-1 rounded-xl border border-primary/10">
            <Calendar className="h-3.5 w-3.5 text-primary/70 mr-0.5" />
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="h-7 rounded-lg border-none bg-white text-xs font-semibold w-[110px] shadow-none">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="all">All Months</SelectItem>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="h-7 rounded-lg border-none bg-white text-xs font-semibold w-[85px] shadow-none">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="all">All Years</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-4 w-[1px] bg-border/40 mx-1 hidden sm:block" />

          <Select value={filterBatch} onValueChange={(v) => {
            setFilterBatch(v);
            if (v !== "all" && filterFellow !== "all") {
              const selectedFellowObj = fellowsList.find(f => f._id === filterFellow);
              if (selectedFellowObj && selectedFellowObj.batch !== v) {
                setFilterFellow("all");
              }
            }
          }}>
            <SelectTrigger className="h-8 rounded-xl border-border/40 bg-white/90 text-xs font-medium w-[110px] shadow-none">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              <SelectItem value="all">All Batches</SelectItem>
              {Array.from(new Set(fellowsList.map(f => f.batch).filter(Boolean))).sort().map(b => (
                <SelectItem key={b} value={b!}>Batch {b}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterFellow} onValueChange={setFilterFellow}>
            <SelectTrigger className="h-8 rounded-xl border-border/40 bg-white/90 text-xs font-medium w-[130px] shadow-none">
              <SelectValue placeholder="All Fellows" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              <SelectItem value="all">All Fellows</SelectItem>
              {fellowsList
                .filter(f => filterBatch === "all" || f.batch === filterBatch)
                .map(f => <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 rounded-xl border-border/40 bg-white/90 text-xs font-medium w-[115px] shadow-none">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="In-school">In-school</SelectItem>
              <SelectItem value="After-school">After-school</SelectItem>
            </SelectContent>
          </Select>

          {isSuperAdmin && (
            <Select value={filterPM} onValueChange={setFilterPM}>
              <SelectTrigger className="h-8 rounded-xl border-border/40 bg-white/90 text-xs font-medium w-[125px] shadow-none">
                <SelectValue placeholder="All PMs" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="all">All PMs</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {Array.from(new Set(centres.flatMap(c => getPMs(c)))).sort().map(pm => (
                  <SelectItem key={pm} value={pm}>{pm}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterSessionPresence === 'has_sessions' && (
            <Badge variant="secondary" className="h-8 px-2.5 rounded-xl text-[11px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 cursor-pointer" onClick={() => setFilterSessionPresence('all')}>
              <span>With sessions only</span>
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
          {filteredCentres.length} Centre{filteredCentres.length !== 1 ? 's' : ''}
        </h2>
        {filterMonth !== 'all' && (
          <Badge variant="outline" className="text-xs font-semibold text-primary bg-primary/5 border-primary/20 py-1 px-2.5">
            Showing Sessions for {months.find(m => m.value === filterMonth)?.label}{filterYear !== 'all' ? ` ${filterYear}` : ''}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredCentres
          .map(c => (
          <Card 
            key={c._id} 
            className="animate-fade-in hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between border-border/60 hover:border-primary/30" 
            onClick={() => navigate(`/centres/${c._id}`)}
          >
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-bold leading-snug line-clamp-2" title={c.name}>
                      {c.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/90" title={c.location}>
                      <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{c.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-7 w-7 rounded-lg ${c.status === "paused" ? "text-success hover:text-success hover:bg-success/10" : "text-warning hover:text-warning hover:bg-warning/10"}`}
                    onClick={(e) => toggleStatus(e, c)}
                    title={c.status === "paused" ? "Resume Centre" : "Pause Centre"}
                  >
                    {c.status === "paused" ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" 
                    onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                    title="Edit Centre"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {isMEManager && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10" 
                      onClick={(e) => handleDelete(e, c._id)}
                      title="Delete Centre"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Badge variant={c.type === "In-school" ? "default" : "secondary"} className="text-[10px] font-semibold py-0.5 px-2">
                  {c.type}
                </Badge>
                {c.status === "paused" && (
                  <Badge variant="destructive" className="text-[10px] font-bold uppercase py-0.5 px-2 tracking-wider">
                    Paused
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0 flex flex-col justify-between flex-1 space-y-3">
              <div className="space-y-2.5">
                {/* Metric Chips: Students, Sessions, Attendance & Assessment */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Students</p>
                      <p className="text-xs font-black text-foreground mt-0.5">{c.studentCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40">
                    <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-indigo-600/90 tracking-wider leading-none">
                        {filterMonth !== 'all' ? `${months.find(m => m.value === filterMonth)?.label?.slice(0, 3)} Sessions` : 'Sessions'}
                      </p>
                      <p className="text-xs font-black text-indigo-950 dark:text-indigo-200 mt-0.5">
                        {filterMonth !== 'all' || filterYear !== 'all' ? (c.sessionCount ?? 0) : (c.totalSessions ?? c.sessionCount ?? 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-emerald-700/90 dark:text-emerald-400 tracking-wider leading-none">Attendance</p>
                      <p className="text-xs font-black text-emerald-950 dark:text-emerald-200 mt-0.5">
                        {c.attendanceRate !== undefined ? `${c.attendanceRate}%` : '0%'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40" title={c.avgAssessmentScore ? `Score: ${c.avgAssessmentScore} / 5` : undefined}>
                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Award className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-amber-700/90 dark:text-amber-400 tracking-wider leading-none">Assessment</p>
                      <p className="text-xs font-black text-amber-950 dark:text-amber-200 mt-0.5">
                        {c.assessmentPercent !== undefined ? `${c.assessmentPercent}%` : '0%'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates if available */}
                {(c.startDate || c.endDate) && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-medium px-1">
                    <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                    <span>
                      {c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      {' — '}
                      {c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing'}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer: Fellows & PMs */}
              <div className="pt-2.5 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
                <div className="flex flex-wrap items-center gap-1 min-w-0 flex-1">
                  {c.fellowIds.map(fid => {
                    const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
                    return fellow ? (
                      <Badge key={fid} variant="outline" className="text-[10px] font-medium py-0.5 px-2 bg-background/80 truncate max-w-[120px]" title={fellow.name}>
                        {fellow.name}
                      </Badge>
                    ) : null;
                  })}
                </div>

                {isSuperAdmin && getPMs(c).length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {getPMs(c).map((pmName, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[9px] font-semibold py-0.5 px-1.5 bg-purple-50 text-purple-700 border border-purple-200">
                        PM: {pmName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CentresPage;
