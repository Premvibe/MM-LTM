import React, { useEffect, useMemo, useState } from "react";
import api, { apiErrorMessage, isAuthError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandHeart, Plus, Pencil, Trash2, Search, Filter, Users, Building2, Layers, Mail, Phone, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTerms } from "@/contexts/ProgramContext";

const DONOR_TYPES = ["Corporate CSR", "Foundation", "Individual", "Government", "Internal", "Other"] as const;

type Donor = {
  _id: string;
  name: string;
  type: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: "Active" | "Inactive";
  notes?: string;
  activeFellowCount: number;
  fundedFellowCount?: number; // Active + Ended
  totalFellowCount: number;
  programs: string[];
};

type DetailSponsorship = {
  _id: string;
  fellowId: string;
  program?: string;
  startDate?: string;
  endDate?: string;
  status: "Active" | "Ended" | "Transferred";
  notes?: string;
  fellow: { _id: string; name: string; batch?: string; status?: string; replacesFellowId?: string; replacedByFellowId?: string } | null;
};

// "Mix" (from the donor sheet) means the fellows work in both in-school and after-school centres
const programLabel = (p: string) => (p.trim().toLowerCase() === "mix" ? "Mix (In-school + After-school)" : p);

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

const sponsorshipBadge = (status: string) => {
  const styles: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700",
    Transferred: "bg-sky-100 text-sky-700",
    Ended: "bg-slate-100 text-slate-600",
  };
  return (
    <Badge className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-none ${styles[status] || styles.Ended}`}>
      {status}
    </Badge>
  );
};

const emptyForm = { name: "", type: "Corporate CSR", contactPerson: "", contactEmail: "", contactPhone: "", status: "Active", notes: "" };

const DonorsPage = () => {
  const terms = useTerms();
  const { isSuperAdmin } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [fundedNow, setFundedNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Donor | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [detail, setDetail] = useState<(Donor & { sponsorships: DetailSponsorship[] }) | null>(null);

  const fetchData = async () => {
    try {
      const [donorsRes, activeRes] = await Promise.all([api.get("/donors"), api.get("/sponsorships?status=Active")]);
      setDonors(donorsRes.data);
      setFundedNow(new Set(activeRes.data.map((s: { fellowId: string }) => s.fellowId)).size);
    } catch (error) {
      if (!isAuthError(error)) toast.error(apiErrorMessage(error, "Failed to load donors"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return donors.filter(d =>
      (filterType === "all" || d.type === filterType) &&
      (d.name.toLowerCase().includes(q) || (d.contactPerson || "").toLowerCase().includes(q))
    );
  }, [donors, search, filterType]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (d: Donor) => {
    setEditItem(d);
    setForm({
      name: d.name, type: d.type, contactPerson: d.contactPerson || "", contactEmail: d.contactEmail || "",
      contactPhone: d.contactPhone || "", status: d.status, notes: d.notes || "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Please enter the donor's name"); return; }
    try {
      if (editItem) {
        await api.put(`/donors/${editItem._id}`, form);
        toast.success("Donor updated");
      } else {
        await api.post("/donors", form);
        toast.success("Donor added");
      }
      setFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to save donor"));
    }
  };

  const handleDelete = async (d: Donor) => {
    if (!window.confirm(`Delete ${d.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/donors/${d._id}`);
      toast.success("Donor deleted");
      fetchData();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete donor"));
    }
  };

  const openDetail = async (d: Donor) => {
    try {
      const res = await api.get(`/donors/${d._id}`);
      setDetail({ ...d, ...res.data });
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load donor details"));
    }
  };

  // Group the detail view by program, active fellows first
  const detailGroups = useMemo(() => {
    if (!detail) return [];
    const order = { Active: 0, Transferred: 1, Ended: 2 } as Record<string, number>;
    const groups: Record<string, DetailSponsorship[]> = {};
    detail.sponsorships.forEach(s => { (groups[s.program || "General"] ||= []).push(s); });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([program, rows]) => [program, rows.sort((a, b) => order[a.status] - order[b.status] || (a.fellow?.name || "").localeCompare(b.fellow?.name || ""))] as const);
  }, [detail]);

  const fellowNameById = useMemo(() => {
    const m: Record<string, string> = {};
    detail?.sponsorships.forEach(s => { if (s.fellow) m[s.fellow._id] = s.fellow.name; });
    return m;
  }, [detail]);

  const stats = [
    { label: "Donors", value: donors.length, icon: HandHeart, tone: "text-primary bg-primary/10" },
    { label: "Active Donors", value: donors.filter(d => d.status === "Active").length, icon: Building2, tone: "text-emerald-600 bg-emerald-100" },
    { label: `${terms.Fellows} Funded Now`, value: fundedNow, icon: Users, tone: "text-sky-600 bg-sky-100" },
    { label: "Programs", value: donors.reduce((n, d) => n + d.programs.length, 0), icon: Layers, tone: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Donors</h1>
          <p className="page-description">CSR partners, foundations and other funders, and the {terms.fellows} they support</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Donor</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.tone.split(" ")[1]}`}>
                <s.icon className={`h-5 w-5 ${s.tone.split(" ")[0]}`} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-black ${s.tone.split(" ")[0]}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search donors by name or contact..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:min-w-[170px]">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DONOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
          {donors.length === 0 ? `No donors yet. Add your first donor to start linking ${terms.fellows}.` : "No donors match your search."}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => (
            <Card key={d._id} className="animate-fade-in hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(d)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <HandHeart className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">{d.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0">{d.type}</Badge>
                        {d.status === "Inactive" && (
                          <Badge className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border-none">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(d); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    {isSuperAdmin && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={e => { e.stopPropagation(); handleDelete(d); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.programs.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {d.programs.map(p => <Badge key={p} variant="secondary" className="text-[10px] font-normal">{programLabel(p)}</Badge>)}
                  </div>
                )}
                {(d.contactPerson || d.contactEmail) && (
                  <p className="text-xs text-muted-foreground truncate">{[d.contactPerson, d.contactEmail].filter(Boolean).join(" · ")}</p>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">{terms.Fellows} funded</p>
                    <p className="font-semibold">
                      {d.fundedFellowCount ?? d.activeFellowCount}
                      {(d.fundedFellowCount ?? 0) > d.activeFellowCount && (
                        <span className="ml-1 text-[11px] font-normal text-muted-foreground">({d.activeFellowCount} active)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">All-time {terms.fellows}</p>
                    <p className="font-semibold">{d.totalFellowCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / edit donor */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <div className="bg-primary p-6 text-white flex-shrink-0">
            <DialogTitle className="text-xl font-black tracking-tight">{editItem ? "Edit Donor" : "Add New Donor"}</DialogTitle>
            <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Funder Profile & Contact</p>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="space-y-1.5">
              <Label htmlFor="donor-name" className="text-xs font-bold">Donor Name</Label>
              <Input id="donor-name" placeholder="e.g. InfoEdge" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{DONOR_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active" className="text-xs">Active</SelectItem>
                    <SelectItem value="Inactive" className="text-xs">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5 border-t border-border/50 pt-3">
              <Label htmlFor="donor-contact" className="text-xs font-bold">Contact Person</Label>
              <Input id="donor-contact" placeholder="e.g. CSR Manager's name" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="rounded-xl text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="donor-email" className="text-xs font-bold">Email</Label>
                <Input id="donor-email" type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="rounded-xl text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="donor-phone" className="text-xs font-bold">Phone</Label>
                <Input id="donor-phone" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="rounded-xl text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="donor-notes" className="text-xs font-bold">Notes</Label>
              <Textarea id="donor-notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="rounded-xl text-xs" />
            </div>
          </div>
          <div className="p-4 bg-muted/20 border-t flex items-center justify-end gap-3 flex-shrink-0">
            <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold text-xs">Cancel</Button></DialogClose>
            <Button onClick={handleSave} className="rounded-xl font-black uppercase tracking-widest text-[10px] px-6 h-10">{editItem ? "Save Changes" : "Add Donor"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Donor detail: every fellow this donor has funded */}
      <Dialog open={!!detail} onOpenChange={v => { if (!v) setDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          {detail && (
            <>
              <div className="bg-primary p-6 text-white flex-shrink-0">
                <DialogTitle className="text-xl font-black tracking-tight">{detail.name}</DialogTitle>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                  {(() => {
                    const fellowsWith = (st: string) => new Set(detail.sponsorships.filter(s => s.status === st).map(s => String(s.fellowId)));
                    const activeIds = fellowsWith("Active");
                    const endedIds = fellowsWith("Ended");
                    const active = activeIds.size;
                    const ended = [...endedIds].filter(id => !activeIds.has(id)).length;
                    const funded = active + ended;
                    return `${detail.type} · ${funded} ${funded !== 1 ? terms.fellows : terms.fellow} funded (${active} active · ${ended} ended)`;
                  })()}
                </p>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {(detail.contactPerson || detail.contactEmail || detail.contactPhone) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {detail.contactPerson && <span className="flex items-center gap-1"><User className="h-3 w-3" />{detail.contactPerson}</span>}
                    {detail.contactEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{detail.contactEmail}</span>}
                    {detail.contactPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{detail.contactPhone}</span>}
                  </div>
                )}
                {detail.notes && <p className="text-xs bg-muted/40 rounded-xl p-3">{detail.notes}</p>}

                {detailGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No {terms.fellows} linked yet. Link {terms.fellows} from the {terms.Fellows} page (edit a {terms.fellow} → Donors).</p>
                ) : detailGroups.map(([program, rows]) => (
                  <div key={program}>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                      {programLabel(program)} · {rows.filter(r => r.status === "Active").length} active
                    </h3>
                    <div className="border rounded-xl divide-y">
                      {rows.map(s => (
                        <div key={s._id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 text-xs ${s.status !== "Active" ? "opacity-70" : ""}`}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{s.fellow?.name || `(deleted ${terms.fellow})`}</span>
                              {s.fellow?.batch && <Badge variant="outline" className="text-[9px] h-4 px-1 py-0">Batch {s.fellow.batch}</Badge>}
                              {sponsorshipBadge(s.status)}
                            </div>
                            {s.fellow?.replacesFellowId && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">Replacement for {fellowNameById[s.fellow.replacesFellowId] || `a ${terms.fellow} who left`}</p>
                            )}
                            {s.fellow?.replacedByFellowId && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                Replaced by <ArrowRight className="h-2.5 w-2.5" /> {fellowNameById[s.fellow.replacedByFellowId] || `another ${terms.fellow}`}
                              </p>
                            )}
                          </div>
                          {(s.startDate || s.endDate) && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatDate(s.startDate) || "…"} – {formatDate(s.endDate) || "ongoing"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonorsPage;
