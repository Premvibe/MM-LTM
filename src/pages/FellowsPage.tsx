import React, { useState, useEffect, useMemo } from "react";
import api, { apiErrorMessage, isAuthError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, UserCheck, UserX, UserMinus, ShieldX, CalendarDays, X, HandHeart, Repeat, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTerms } from "@/contexts/ProgramContext";

type Fellow = { 
  _id: string; 
  id: string; 
  name: string; 
  email: string; 
  phone: string; 
  batch?: string; 
  status?: string; 
  centreIds: string[]; 
  centreAssignedDate?: string;
  centreEndDate?: string;
  sessionsCompleted: number; 
  attendanceRate: number; 
  programManagers?: string[];
  leftDate?: string;
  leftReason?: string;
  replacesFellowId?: string;
  replacedByFellowId?: string;
};
type DonorOption = { _id: string; name: string; type: string; status: string };
type Sponsorship = {
  _id: string;
  donorId: string;
  donorName: string;
  fellowId: string;
  program?: string;
  startDate?: string;
  endDate?: string;
  status: "Active" | "Ended" | "Transferred";
  notes?: string;
};
type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };

const formatDateDMY = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const FellowsPage = () => {
  const terms = useTerms();
  const { user, isMEManager, isSuperAdmin, isAdmin } = useAuth();
  // Donor information is for admins and directors, not program managers
  const canSeeDonors = isAdmin && user?.role !== "program_manager";
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
  const [centresList, setCentresList] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Fellow | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [batch, setBatch] = useState("4.0");
  const [status, setStatus] = useState("Active");
  const [password, setPassword] = useState("");
  const [centreAssignedDate, setCentreAssignedDate] = useState("");
  const [centreEndDate, setCentreEndDate] = useState("");
  const [selectedCentreIds, setSelectedCentreIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDonor, setFilterDonor] = useState<string>("all");

  // Donors
  const [donorsList, setDonorsList] = useState<DonorOption[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [newLink, setNewLink] = useState({ donorId: "", program: "", startDate: "", endDate: "" });

  // Mark Left & Replace
  const [replaceTarget, setReplaceTarget] = useState<Fellow | null>(null);
  const [replaceForm, setReplaceForm] = useState({
    leftDate: "", leftReason: "", mode: "existing" as "existing" | "new", replacementFellowId: "",
    name: "", email: "", phone: "", batch: "", password: "", joinDate: "", carryDonors: true, carryCentres: true, endReplacementDonors: true,
  });
  const [replacing, setReplacing] = useState(false);

  const fellowById = useMemo(() => Object.fromEntries(fellowsList.map(f => [f._id, f])), [fellowsList]);
  const activeDonorsByFellow = useMemo(() => {
    const m: Record<string, Sponsorship[]> = {};
    sponsorships.filter(s => s.status === "Active").forEach(s => { (m[s.fellowId] ||= []).push(s); });
    return m;
  }, [sponsorships]);
  // Every donor link, current first, so fellows who left still show who funded them
  const allDonorsByFellow = useMemo(() => {
    const m: Record<string, Sponsorship[]> = {};
    sponsorships.forEach(s => { (m[s.fellowId] ||= []).push(s); });
    Object.values(m).forEach(list => list.sort((a, b) => Number(b.status === "Active") - Number(a.status === "Active")));
    return m;
  }, [sponsorships]);
  const programOptions = useMemo(
    () => Array.from(new Set(sponsorships.map(s => s.program).filter(Boolean))).sort() as string[],
    [sponsorships]
  );

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { Active: 0, Inactive: 0, Left: 0, Terminated: 0, Total: fellowsList.length };
    fellowsList.forEach(f => {
      const s = f.status || "Active";
      if (s in counts) counts[s as keyof typeof counts]++;
    });
    return counts;
  }, [fellowsList]);

  const filteredFellows = useMemo(() => {
    return fellowsList.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBatch = filterBatch === "all" || f.batch === filterBatch;
      const matchesStatus = filterStatus === "all" || (f.status || "Active") === filterStatus;
      
      const fellowCentres = centresList.filter(c => c.fellowIds.includes(f._id) || c.fellowIds.includes(f.id));
      const matchesType = filterType === "all" || fellowCentres.some(c => c.type === filterType);

      const fellowDonors = allDonorsByFellow[f._id] || [];
      const matchesDonor = filterDonor === "all" ||
        (filterDonor === "none" ? fellowDonors.length === 0 : fellowDonors.some(s => s.donorId === filterDonor));

      return matchesSearch && matchesBatch && matchesType && matchesStatus && matchesDonor;
    });
  }, [fellowsList, centresList, searchQuery, filterBatch, filterType, filterStatus, filterDonor, allDonorsByFellow]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const params = user?.role === 'program_manager' ? `?role=program_manager&email=${user.email}` : '';
      const [fellowsRes, centresRes] = await Promise.all([
        api.get(`/fellows${params}`),
        api.get(`/centres${params}`)
      ]);
      setFellowsList(fellowsRes.data.sort((a: Fellow, b: Fellow) => a.name.localeCompare(b.name)));
      setCentresList(centresRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
    fetchDonorData();
  };

  // Donor data comes from protected routes, so it loads separately and never blocks the fellow list
  const fetchDonorData = async () => {
    if (!canSeeDonors) return;
    try {
      const [donorsRes, sponsorshipsRes] = await Promise.all([api.get("/donors"), api.get("/sponsorships")]);
      setDonorsList(donorsRes.data);
      setSponsorships(sponsorshipsRes.data);
    } catch (error) {
      if (!isAuthError(error)) toast.error("Failed to load donor information");
    }
  };

  const addDonorLink = async () => {
    if (!editItem) return;
    if (!newLink.donorId) { toast.error("Choose a donor"); return; }
    try {
      await api.post("/sponsorships", { ...newLink, fellowId: editItem._id });
      toast.success("Donor linked");
      setNewLink({ donorId: "", program: "", startDate: "", endDate: "" });
      fetchDonorData();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to link donor"));
    }
  };

  const removeDonorLink = async (s: Sponsorship) => {
    if (!window.confirm(`Remove ${s.donorName} from this ${terms.fellow}? This deletes the record. To keep history, use "End" instead.`)) return;
    try {
      await api.delete(`/sponsorships/${s._id}`);
      toast.success("Donor removed");
      fetchDonorData();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to remove donor"));
    }
  };

  const endDonorLink = async (s: Sponsorship) => {
    try {
      await api.put(`/sponsorships/${s._id}`, { status: "Ended", endDate: s.endDate || new Date().toISOString().split("T")[0] });
      toast.success(`${s.donorName} marked as ended`);
      fetchDonorData();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update donor"));
    }
  };

  const openReplace = (f: Fellow) => {
    setReplaceTarget(f);
    setReplaceForm({
      leftDate: new Date().toISOString().split("T")[0], leftReason: "", mode: "existing", replacementFellowId: "",
      name: "", email: "", phone: "", batch: f.batch || "", password: "", joinDate: "", carryDonors: true, carryCentres: true, endReplacementDonors: true,
    });
  };

  const handleReplace = async () => {
    if (!replaceTarget) return;
    const r = replaceForm;
    if (r.mode === "existing" && !r.replacementFellowId) { toast.error(`Choose the replacement ${terms.fellow}`); return; }
    if (r.mode === "new" && (!r.name.trim() || !r.email.trim() || !r.phone.trim() || !r.password.trim())) {
      toast.error(`Fill in the new ${terms.fellow}'s name, email, phone and password`); return;
    }
    setReplacing(true);
    try {
      const res = await api.post(`/fellows/${replaceTarget._id}/replace`, {
        leftDate: r.leftDate || undefined,
        leftReason: r.leftReason.trim() || undefined,
        joinDate: r.joinDate || undefined,
        carryDonors: r.carryDonors,
        carryCentres: r.carryCentres,
        endReplacementDonors: r.mode === "existing" && r.endReplacementDonors,
        ...(r.mode === "existing"
          ? { replacementFellowId: r.replacementFellowId }
          : { newFellow: { name: r.name.trim(), email: r.email.trim(), phone: r.phone.trim(), batch: r.batch.trim(), password: r.password } }),
      });
      toast.success(res.data.message);
      setReplaceTarget(null);
      fetchData();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to record replacement"));
    } finally {
      setReplacing(false);
    }
  };

  const resetForm = () => { 
    setName(""); 
    setEmail(""); 
    setPhone(""); 
    setBatch("4.0"); 
    setStatus("Active"); 
    setPassword(""); 
    setCentreAssignedDate(""); 
    setCentreEndDate(""); 
    setSelectedCentreIds([]); 
    setEditItem(null); 
    setNewLink({ donorId: "", program: "", startDate: "", endDate: "" });
  };

  const openEdit = (f: Fellow) => {
    setEditItem(f); 
    setName(f.name); 
    setEmail(f.email); 
    setPhone(f.phone); 
    setBatch(f.batch || "4.0"); 
    setStatus(f.status || "Active"); 
    setPassword(""); 
    setCentreAssignedDate(f.centreAssignedDate ? new Date(f.centreAssignedDate).toISOString().split('T')[0] : "");
    setCentreEndDate(f.centreEndDate ? new Date(f.centreEndDate).toISOString().split('T')[0] : "");

    const associatedCentres = centresList
      .filter(c => (c.fellowIds || []).includes(f._id) || (f.id && (c.fellowIds || []).includes(f.id)) || (f.centreIds || []).includes(c._id) || (f.centreIds || []).includes(c.id))
      .map(c => c._id);
    setSelectedCentreIds(associatedCentres);
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) { toast.error("Please fill in name, email, and phone"); return; }
    if (!editItem && !password.trim()) { toast.error(`Password is required for new ${terms.fellows}`); return; }
    
    const fellowData: any = { 
      name: name.trim(), 
      email: email.trim(), 
      phone: phone.trim(), 
      batch, 
      status,
      centreIds: selectedCentreIds,
      centreAssignedDate: centreAssignedDate || null,
      centreEndDate: centreEndDate || null
    };
    if (password.trim()) {
      fellowData.password = password.trim();
    }

    try {
      if (editItem) {
        await api.put(`/fellows/${editItem._id}`, fellowData);
        toast.success(`${terms.Fellow} updated successfully`);
      } else {
        await api.post("/fellows", { ...fellowData, sessionsCompleted: 0, attendanceRate: 100 });
        toast.success(`${terms.Fellow} added successfully`);
      }
      fetchData();
      resetForm(); 
      setOpen(false);
    } catch (error) {
      toast.error(`Failed to save ${terms.fellow}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete this ${terms.fellow}?`)) return;
    try {
      await api.delete(`/fellows/${id}`);
      toast.success(`${terms.Fellow} deleted successfully`);
      fetchData();
    } catch (error) {
      toast.error(apiErrorMessage(error, `Failed to delete ${terms.fellow}`));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-200">Active</Badge>;
      case "Inactive":
        return <Badge className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border-none hover:bg-amber-200">Inactive</Badge>;
      case "Left":
        return <Badge className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border-none hover:bg-slate-200">Left</Badge>;
      case "Terminated":
        return <Badge className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-red-100 text-red-700 border-none hover:bg-red-200">Terminated</Badge>;
      default:
        return <Badge className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-200">Active</Badge>;
    }
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{terms.Fellows}</h1>
          <p className="page-description">Manage program {terms.fellows} and track performance</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add {terms.Fellow}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
            <div className="bg-primary p-6 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <DialogTitle className="text-xl font-black tracking-tight">{editItem ? `Edit ${terms.Fellow}` : `Add New ${terms.Fellow}`}</DialogTitle>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{terms.Fellow} Profile, Centre Assignments & Records</p>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <Label htmlFor="fellow-name" className="text-xs font-bold">Full Name</Label>
                <Input id="fellow-name" placeholder="e.g. Priya Gupta" value={name} onChange={e => setName(e.target.value)} className="rounded-xl font-medium text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fellow-email" className="text-xs font-bold">Email</Label>
                  <Input id="fellow-email" type="email" placeholder="e.g. priya@manzil.org" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl font-medium text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fellow-phone" className="text-xs font-bold">Phone</Label>
                  <Input id="fellow-phone" placeholder="e.g. +91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl font-medium text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fellow-batch" className="text-xs font-bold">Batch Version</Label>
                  <Input id="fellow-batch" placeholder="e.g. 4.0" value={batch} onChange={e => setBatch(e.target.value)} className="rounded-xl font-medium text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="rounded-xl font-medium text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="Active" className="text-xs">Active</SelectItem>
                      <SelectItem value="Inactive" className="text-xs">Inactive</SelectItem>
                      <SelectItem value="Left" className="text-xs">Left</SelectItem>
                      <SelectItem value="Terminated" className="text-xs">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Centre Assignment */}
              <div className="space-y-2 border-t border-border/50 pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Assigned Centre(s)</Label>
                  <span className="text-[10px] text-muted-foreground font-semibold">{selectedCentreIds.length} selected</span>
                </div>
                <div className="max-h-32 overflow-y-auto border border-border/40 rounded-xl p-2 space-y-1 bg-muted/20">
                  {centresList.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground p-2">No centres available</p>
                  ) : (
                    centresList.map(centre => {
                      const isChecked = selectedCentreIds.includes(centre._id);
                      return (
                        <div
                          key={centre._id}
                          onClick={() => {
                            setSelectedCentreIds(prev =>
                              prev.includes(centre._id)
                                ? prev.filter(id => id !== centre._id)
                                : [...prev, centre._id]
                            );
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                            isChecked ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded border-primary text-primary focus:ring-primary pointer-events-none"
                            />
                            <span>{centre.name}</span>
                          </div>
                          <Badge variant={centre.type === "In-school" ? "default" : "secondary"} className="text-[8px] py-0 px-1.5 h-4">
                            {centre.type}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Centre Dates */}
              <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="centre-assigned-date" className="text-xs font-bold flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> Centre Assigned Date
                  </Label>
                  <Input
                    id="centre-assigned-date"
                    type="date"
                    value={centreAssignedDate}
                    onChange={e => setCentreAssignedDate(e.target.value)}
                    className="rounded-xl font-medium text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">Start date at centre</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="centre-end-date" className="text-xs font-bold flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> Centre End Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="centre-end-date"
                      type="date"
                      value={centreEndDate}
                      onChange={e => setCentreEndDate(e.target.value)}
                      className="rounded-xl font-medium text-xs pr-8"
                    />
                    {centreEndDate && (
                      <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500"
                        onClick={() => setCentreEndDate("")}
                        title="Clear end date"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Leave empty if ongoing</p>
                </div>
              </div>

              {/* Donors (saved immediately, separate from "Save Changes") */}
              {editItem && canSeeDonors && (
                <div className="space-y-2 border-t border-border/50 pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5"><HandHeart className="h-3.5 w-3.5 text-primary" /> Donors</Label>
                    <span className="text-[10px] text-muted-foreground font-semibold">Changes here save immediately</span>
                  </div>
                  {sponsorships.filter(s => s.fellowId === editItem._id).length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">No donor linked yet.</p>
                  ) : (
                    <div className="border border-border/40 rounded-xl divide-y">
                      {sponsorships.filter(s => s.fellowId === editItem._id).map(s => (
                        <div key={s._id} className="flex items-center justify-between gap-2 p-2 text-xs">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold">{s.donorName}</span>
                              {s.program && <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0 font-normal">{s.program}</Badge>}
                              {s.status !== "Active" && <Badge variant="outline" className="text-[9px] h-4 px-1 py-0">{s.status}</Badge>}
                            </div>
                            {(s.startDate || s.endDate) && (
                              <p className="text-[10px] text-muted-foreground">{formatDateDMY(s.startDate) || "…"} – {formatDateDMY(s.endDate) || "ongoing"}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {s.status === "Active" && (
                              <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => endDonorLink(s)}>End</Button>
                            )}
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeDonorLink(s)} title="Remove">
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 bg-muted/20 rounded-xl p-2">
                    <Select value={newLink.donorId} onValueChange={v => setNewLink({ ...newLink, donorId: v })}>
                      <SelectTrigger className="rounded-lg text-xs h-8"><SelectValue placeholder={donorsList.length ? "Choose donor" : "Add donors first"} /></SelectTrigger>
                      <SelectContent>
                        {donorsList.map(d => <SelectItem key={d._id} value={d._id} className="text-xs">{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input list="donor-programs" placeholder="Program, e.g. Mix" value={newLink.program} onChange={e => setNewLink({ ...newLink, program: e.target.value })} className="rounded-lg text-xs h-8" />
                    <datalist id="donor-programs">{programOptions.map(p => <option key={p} value={p} />)}</datalist>
                    <Input type="date" title="Start date" value={newLink.startDate} onChange={e => setNewLink({ ...newLink, startDate: e.target.value })} className="rounded-lg text-xs h-8" />
                    <Input type="date" title="End date" value={newLink.endDate} onChange={e => setNewLink({ ...newLink, endDate: e.target.value })} className="rounded-lg text-xs h-8" />
                    <Button type="button" size="sm" variant="secondary" className="col-span-2 h-8 text-xs font-bold" onClick={addDonorLink}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Link Donor
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <Label htmlFor="fellow-password" className="text-xs font-bold">Password {editItem && <span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">(Leave blank to keep unchanged)</span>}</Label>
                <Input id="fellow-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl font-medium text-xs" />
              </div>
            </div>

            <div className="p-4 bg-muted/20 border-t flex items-center justify-end gap-3 flex-shrink-0">
              <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold text-xs">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit} className="rounded-xl font-black uppercase tracking-widest text-[10px] px-6 h-10 shadow-lg shadow-primary/20">{editItem ? "Save Changes" : `Add ${terms.Fellow}`}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${filterStatus === 'all' ? 'border-primary shadow-md' : 'border-transparent'}`}
          onClick={() => setFilterStatus('all')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
              <p className="text-2xl font-black text-primary">{statusCounts.Total}</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${filterStatus === 'Active' ? 'border-emerald-500 shadow-md' : 'border-transparent'}`}
          onClick={() => setFilterStatus(filterStatus === 'Active' ? 'all' : 'Active')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active</p>
              <p className="text-2xl font-black text-emerald-600">{statusCounts.Active}</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${filterStatus === 'Inactive' ? 'border-amber-500 shadow-md' : 'border-transparent'}`}
          onClick={() => setFilterStatus(filterStatus === 'Inactive' ? 'all' : 'Inactive')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <UserMinus className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inactive</p>
              <p className="text-2xl font-black text-amber-600">{statusCounts.Inactive}</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${filterStatus === 'Left' ? 'border-slate-500 shadow-md' : 'border-transparent'}`}
          onClick={() => setFilterStatus(filterStatus === 'Left' ? 'all' : 'Left')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <UserX className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Left</p>
              <p className="text-2xl font-black text-slate-600">{statusCounts.Left}</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${filterStatus === 'Terminated' ? 'border-red-500 shadow-md' : 'border-transparent'}`}
          onClick={() => setFilterStatus(filterStatus === 'Terminated' ? 'all' : 'Terminated')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
              <ShieldX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Terminated</p>
              <p className="text-2xl font-black text-red-600">{statusCounts.Terminated}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={`Search ${terms.fellows} by name or email...`} 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:min-w-[150px]">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterBatch} onValueChange={setFilterBatch}>
            <SelectTrigger><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {Array.from(new Set(fellowsList.map(f => f.batch).filter(Boolean))).sort().map(b => (
                <SelectItem key={b} value={b!}>Batch {b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:min-w-[150px]">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="In-school">In-school</SelectItem>
              <SelectItem value="After-school">After-school</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdmin && donorsList.length > 0 && (
          <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:min-w-[170px]">
            <HandHeart className="h-4 w-4 text-muted-foreground" />
            <Select value={filterDonor} onValueChange={setFilterDonor}>
              <SelectTrigger><SelectValue placeholder="Donor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Donors</SelectItem>
                {donorsList.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                <SelectItem value="none">No donor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
          {filteredFellows.length} {filteredFellows.length !== 1 ? terms.Fellows : terms.Fellow}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredFellows.map(f => {
          const fellowCentres = centresList.filter(c => c.fellowIds.includes(f._id) || c.fellowIds.includes(f.id));
          const types = Array.from(new Set(fellowCentres.map(c => c.type)));
          let fellowType = "Unassigned";
          if (types.length === 1) fellowType = types[0];
          else if (types.length > 1) fellowType = "Mixed";

          return (
          <Card key={f._id} className="animate-fade-in hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary-foreground">{f.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <CardTitle className="text-sm font-semibold">{f.name}</CardTitle>
                      {getStatusBadge(f.status || "Active")}
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 whitespace-nowrap">Batch {f.batch || "N/A"}</Badge>
                      {fellowType !== "Unassigned" && (
                        <Badge variant={fellowType === "In-school" ? "default" : fellowType === "After-school" ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5 py-0 whitespace-nowrap">
                          {fellowType}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{f.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin && !f.replacedByFellowId && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark Left & Replace" onClick={(e) => { e.stopPropagation(); openReplace(f); }}><Repeat className="h-3.5 w-3.5" /></Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(f); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  {isMEManager && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete(e, f._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                {(allDonorsByFellow[f._id] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {allDonorsByFellow[f._id].map(s => s.status === "Active" ? (
                      <Badge key={s._id} title={s.program || undefined} className="text-[10px] font-semibold py-0 h-5 gap-1 bg-amber-100 text-amber-800 border-none hover:bg-amber-200">
                        <HandHeart className="h-3 w-3" />{s.donorName}
                      </Badge>
                    ) : (
                      <Badge key={s._id} variant="outline" title={`${s.program ? s.program + " · " : ""}${s.status === "Transferred" ? "Moved to replacement" : "Ended"}`} className="text-[10px] font-normal py-0 h-5 gap-1 text-muted-foreground border-dashed">
                        <HandHeart className="h-3 w-3" />{s.donorName}
                        <span className="text-[9px] uppercase tracking-wide">{s.status === "Transferred" ? "· moved" : "· past"}</span>
                      </Badge>
                    ))}
                  </div>
                )}
                {(f.replacesFellowId || f.replacedByFellowId) && (
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {f.replacesFellowId && fellowById[f.replacesFellowId] && (
                      <button type="button" className="rounded-full border px-2 py-0.5 text-muted-foreground hover:bg-muted" onClick={() => { setFilterStatus("all"); setSearchQuery(fellowById[f.replacesFellowId!].name); }}>
                        Replacement for <strong className="text-foreground">{fellowById[f.replacesFellowId].name}</strong>
                      </button>
                    )}
                    {f.replacedByFellowId && fellowById[f.replacedByFellowId] && (
                      <button type="button" className="rounded-full border px-2 py-0.5 text-muted-foreground hover:bg-muted flex items-center gap-1" onClick={() => { setFilterStatus("all"); setSearchQuery(fellowById[f.replacedByFellowId!].name); }}>
                        Replaced by <ArrowRight className="h-2.5 w-2.5" /> <strong className="text-foreground">{fellowById[f.replacedByFellowId].name}</strong>
                      </button>
                    )}
                  </div>
                )}
                {f.leftDate && (
                  <p className="text-[10px] text-muted-foreground">Left on <strong className="text-foreground">{formatDateDMY(f.leftDate)}</strong>{f.leftReason ? ` · ${f.leftReason}` : ""}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {fellowCentres.map(centre => (
                    <Badge key={centre._id} variant="secondary" className="text-[10px] font-normal">{centre.name.includes(' - ') ? centre.name.split(" - ")[1] : centre.name}</Badge>
                  ))}
                </div>

                {(f.centreAssignedDate || f.centreEndDate) && (
                  <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold text-muted-foreground bg-primary/[0.04] p-2 rounded-xl border border-primary/10">
                    {f.centreAssignedDate && (
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3 text-primary" />
                        <span>Assigned: <strong className="text-foreground">{formatDateDMY(f.centreAssignedDate)}</strong></span>
                      </div>
                    )}
                    {f.centreAssignedDate && f.centreEndDate && <span className="text-muted-foreground/30">·</span>}
                    {f.centreEndDate ? (
                      <div className="flex items-center gap-1.5">
                        <span>End: <strong className="text-foreground">{formatDateDMY(f.centreEndDate)}</strong></span>
                      </div>
                    ) : (
                      f.centreAssignedDate && (
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-wider py-0 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                          Ongoing
                        </Badge>
                      )
                    )}
                  </div>
                )}

                {isSuperAdmin && f.programManagers && f.programManagers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {f.programManagers.map((pmName, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[9px] font-semibold py-0 h-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">PM: {pmName}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Sessions</p>
                  <p className="font-semibold">{f.sessionsCompleted}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Attendance Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress value={f.attendanceRate} className="h-2 flex-1" />
                    <span className="font-semibold text-xs">{f.attendanceRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      {/* Mark Left & Replace */}
      <Dialog open={!!replaceTarget} onOpenChange={(v) => { if (!v) setReplaceTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          {replaceTarget && (
            <>
              <div className="bg-primary p-6 text-white flex-shrink-0">
                <DialogTitle className="text-xl font-black tracking-tight">Replace {replaceTarget.name}</DialogTitle>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Marks them as Left and links the new {terms.fellow}</p>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="left-date" className="text-xs font-bold">Leaving date</Label>
                    <Input id="left-date" type="date" value={replaceForm.leftDate} onChange={e => setReplaceForm({ ...replaceForm, leftDate: e.target.value })} className="rounded-xl text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="join-date" className="text-xs font-bold">Replacement joins on</Label>
                    <Input id="join-date" type="date" value={replaceForm.joinDate} onChange={e => setReplaceForm({ ...replaceForm, joinDate: e.target.value })} className="rounded-xl text-xs" />
                    <p className="text-[10px] text-muted-foreground">Defaults to the leaving date</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="left-reason" className="text-xs font-bold">Reason for leaving (optional)</Label>
                  <Input id="left-reason" value={replaceForm.leftReason} onChange={e => setReplaceForm({ ...replaceForm, leftReason: e.target.value })} className="rounded-xl text-xs" />
                </div>

                <div className="space-y-2 border-t border-border/50 pt-3">
                  <Label className="text-xs font-bold">Replacement {terms.fellow}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["existing", "new"] as const).map(m => (
                      <Button key={m} type="button" variant={replaceForm.mode === m ? "default" : "outline"} size="sm" className="text-xs rounded-xl"
                        onClick={() => setReplaceForm({ ...replaceForm, mode: m })}>
                        {m === "existing" ? "Already in the app" : `Add a new ${terms.fellow}`}
                      </Button>
                    ))}
                  </div>
                  {replaceForm.mode === "existing" ? (
                    <Select value={replaceForm.replacementFellowId} onValueChange={v => setReplaceForm({ ...replaceForm, replacementFellowId: v })}>
                      <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder={`Choose ${terms.fellow}`} /></SelectTrigger>
                      <SelectContent>
                        {fellowsList
                          .filter(x => x._id !== replaceTarget._id && !x.replacesFellowId && (x.status || "Active") === "Active")
                          .map(x => <SelectItem key={x._id} value={x._id} className="text-xs">{x.name} · Batch {x.batch || "N/A"}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <Input placeholder="Full name" value={replaceForm.name} onChange={e => setReplaceForm({ ...replaceForm, name: e.target.value })} className="rounded-xl text-xs" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="email" placeholder="Email" value={replaceForm.email} onChange={e => setReplaceForm({ ...replaceForm, email: e.target.value })} className="rounded-xl text-xs" />
                        <Input placeholder="Phone" value={replaceForm.phone} onChange={e => setReplaceForm({ ...replaceForm, phone: e.target.value })} className="rounded-xl text-xs" />
                        <Input placeholder="Batch, e.g. 5.0" value={replaceForm.batch} onChange={e => setReplaceForm({ ...replaceForm, batch: e.target.value })} className="rounded-xl text-xs" />
                        <Input type="password" placeholder="Password" value={replaceForm.password} onChange={e => setReplaceForm({ ...replaceForm, password: e.target.value })} className="rounded-xl text-xs" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-border/50 pt-3 text-xs">
                  {/* Program managers don't see donors; donors still carry over by default */}
                  {canSeeDonors && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5" checked={replaceForm.carryDonors} onChange={e => setReplaceForm({ ...replaceForm, carryDonors: e.target.checked })} />
                    <span>
                      <strong>Carry over donors</strong>
                      <span className="block text-[10px] text-muted-foreground">
                        {(activeDonorsByFellow[replaceTarget._id] || []).map(s => s.donorName).join(", ") || "No active donors"}
                        {" "}move to the new {terms.fellow}. The history stays with {replaceTarget.name}.
                      </span>
                    </span>
                  </label>
                  )}
                  {canSeeDonors && replaceForm.mode === "existing" && (activeDonorsByFellow[replaceForm.replacementFellowId] || []).length > 0 && (
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" className="mt-0.5" checked={replaceForm.endReplacementDonors} onChange={e => setReplaceForm({ ...replaceForm, endReplacementDonors: e.target.checked })} />
                      <span>
                        <strong>End {fellowById[replaceForm.replacementFellowId]?.name}'s current donors</strong>
                        <span className="block text-[10px] text-muted-foreground">
                          {activeDonorsByFellow[replaceForm.replacementFellowId].map(s => s.donorName).join(", ")} will be marked Ended on the join date,
                          e.g. when a self-funded {terms.fellow} moves into this donor's seat
                        </span>
                      </span>
                    </label>
                  )}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5" checked={replaceForm.carryCentres} onChange={e => setReplaceForm({ ...replaceForm, carryCentres: e.target.checked })} />
                    <span>
                      <strong>Assign the same centres</strong>
                      <span className="block text-[10px] text-muted-foreground">Adds the new {terms.fellow} to {replaceTarget.name}'s centres</span>
                    </span>
                  </label>
                </div>
              </div>
              <div className="p-4 bg-muted/20 border-t flex items-center justify-end gap-3 flex-shrink-0">
                <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold text-xs">Cancel</Button></DialogClose>
                <Button onClick={handleReplace} disabled={replacing} className="rounded-xl font-black uppercase tracking-widest text-[10px] px-6 h-10">
                  {replacing ? "Saving..." : "Confirm Replacement"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FellowsPage;
