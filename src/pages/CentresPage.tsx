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
import { Building2, Plus, MapPin, Users, Pencil, Search, Filter, PauseCircle, PlayCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";


type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number; status?: "active" | "paused"; startDate?: string; endDate?: string; pocName?: string; pocContact?: string; pocEmail?: string; };
type Fellow = { _id: string; id: string; name: string; email: string; phone: string; centreIds: string[]; sessionsCompleted: number; attendanceRate: number; batch?: string };

const CentresPage = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pocName, setPocName] = useState("");
  const [pocContact, setPocContact] = useState("");
  const [pocEmail, setPocEmail] = useState("");

  const filteredCentres = useMemo(() => {
    return centres.filter(c => {
      const assignedFellows = c.fellowIds.map(fid => fellowsList.find(f => f._id === fid || f.id === fid)?.name || "").join(" ").toLowerCase();
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          assignedFellows.includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || c.type === filterType;
      const matchesBatch = filterBatch === "all" || c.fellowIds.length === 0 || c.fellowIds.some(fid => {
        const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
        return fellow?.batch === filterBatch;
      });
      const matchesFellow = filterFellow === "all" || c.fellowIds.includes(filterFellow);
      return matchesSearch && matchesType && matchesBatch && matchesFellow;
    });
  }, [centres, fellowsList, searchQuery, filterType, filterBatch, filterFellow]);

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
      const [centresRes, fellowsRes] = await Promise.all([
        api.get(`/centres${params}`),
        api.get(`/fellows${params}`)
      ]);
      setCentres(centresRes.data.sort((a: Centre, b: Centre) => a.name.localeCompare(b.name)));
      setFellowsList(fellowsRes.data.sort((a: Fellow, b: Fellow) => a.name.localeCompare(b.name)));
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setName(""); setLocation(""); setType("In-school"); setSelectedFellowIds([]); setStartDate(""); setEndDate(""); setPocName(""); setPocContact(""); setPocEmail(""); setEditItem(null); };

  const openEdit = (c: Centre) => {
    setEditItem(c); 
    setName(c.name); 
    setLocation(c.location); 
    setType(c.type); 
    setSelectedFellowIds(c.fellowIds); 
    setStartDate(c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : "");
    setEndDate(c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : "");
    setPocName(c.pocName || "");
    setPocContact(c.pocContact || "");
    setPocEmail(c.pocEmail || "");
    setOpen(true);
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
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit}>{editItem ? "Save Changes" : "Add Centre"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider">Total Centres</p>
              <p className="text-2xl font-black mt-1">{filteredCentres.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-success uppercase tracking-wider">Active</p>
              <p className="text-2xl font-black mt-1">{filteredCentres.filter(c => c.status !== "paused").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
              <PlayCircle className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-warning uppercase tracking-wider">Paused</p>
              <p className="text-2xl font-black mt-1">{filteredCentres.filter(c => c.status === "paused").length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
              <PauseCircle className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg mb-8">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
          <Input 
            placeholder="Find centre by name or location..." 
            className="pl-10 h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterBatch} onValueChange={(v) => {
            setFilterBatch(v);
            if (v !== "all" && filterFellow !== "all") {
              const selectedFellowObj = fellowsList.find(f => f._id === filterFellow);
              if (selectedFellowObj && selectedFellowObj.batch !== v) {
                setFilterFellow("all");
              }
            }
          }}>
            <SelectTrigger className="h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs w-[100px] md:w-[120px]"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all">All Batches</SelectItem>
              {Array.from(new Set(fellowsList.map(f => f.batch).filter(Boolean))).sort().map(b => (
                <SelectItem key={b} value={b!}>Batch {b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterFellow} onValueChange={setFilterFellow}>
            <SelectTrigger className="h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs w-[130px] md:w-[180px]"><SelectValue placeholder="All Fellows" /></SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all">All Fellows</SelectItem>
              {fellowsList
                .filter(f => filterBatch === "all" || f.batch === filterBatch)
                .map(f => <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>)}
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
          {filteredCentres.length} Centre{filteredCentres.length !== 1 ? 's' : ''}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCentres
          .map(c => (
          <Card key={c._id} className="animate-fade-in hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/centres/${c._id}`)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{c.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{c.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-7 w-7 ${c.status === "paused" ? "text-success hover:text-success/80" : "text-warning hover:text-warning/80"}`}
                    onClick={(e) => toggleStatus(e, c)}
                    title={c.status === "paused" ? "Resume Centre" : "Pause Centre"}
                  >
                    {c.status === "paused" ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(c); }}><Pencil className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={c.type === "In-school" ? "default" : "secondary"} className="w-fit">{c.type}</Badge>
                  {c.status === "paused" && <Badge variant="destructive" className="w-fit uppercase text-[10px]">Paused</Badge>}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{c.studentCount} students</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {c.startDate && (
                      <span className="text-[10px] text-muted-foreground font-medium">Start: {new Date(c.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    )}
                    {c.endDate && (
                      <span className="text-[10px] text-muted-foreground font-medium">End: {new Date(c.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {c.fellowIds.map(fid => {
                    const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
                    return fellow ? (
                      <Badge key={fid} variant="outline" className="text-[10px] font-medium py-0 h-4">{fellow.name}</Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CentresPage;
