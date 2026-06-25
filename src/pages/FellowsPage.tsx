import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Fellow = { _id: string; id: string; name: string; email: string; phone: string; batch?: string; centreIds: string[]; sessionsCompleted: number; attendanceRate: number };
type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };

const FellowsPage = () => {
  const { user } = useAuth();
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
  const [centresList, setCentresList] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Fellow | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [batch, setBatch] = useState("4.0");
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredFellows = useMemo(() => {
    return fellowsList.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBatch = filterBatch === "all" || f.batch === filterBatch;
      
      const fellowCentres = centresList.filter(c => c.fellowIds.includes(f._id) || c.fellowIds.includes(f.id));
      const matchesType = filterType === "all" || fellowCentres.some(c => c.type === filterType);
      
      return matchesSearch && matchesBatch && matchesType;
    });
  }, [fellowsList, centresList, searchQuery, filterBatch, filterType]);

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
  };

  const resetForm = () => { setName(""); setEmail(""); setPhone(""); setBatch("4.0"); setPassword(""); setEditItem(null); };

  const openEdit = (f: Fellow) => {
    setEditItem(f); setName(f.name); setEmail(f.email); setPhone(f.phone); setBatch(f.batch || "4.0"); setPassword(""); setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) { toast.error("Please fill in name, email, and phone"); return; }
    if (!editItem && !password.trim()) { toast.error("Password is required for new fellows"); return; }
    
    const fellowData: any = { name: name.trim(), email: email.trim(), phone: phone.trim(), batch };
    if (password.trim()) {
      fellowData.password = password.trim();
    }

    try {
      if (editItem) {
        await api.put(`/fellows/${editItem._id}`, fellowData);
        toast.success("Fellow updated successfully");
      } else {
        await api.post("/fellows", { ...fellowData, centreIds: [], sessionsCompleted: 0, attendanceRate: 100 });
        toast.success("Fellow added successfully");
      }
      fetchData();
      resetForm(); 
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save fellow");
    }
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Fellows</h1>
          <p className="page-description">Manage program fellows and track performance</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Fellow</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Fellow" : "Add New Fellow"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="fellow-name">Full Name</Label>
                <Input id="fellow-name" placeholder="e.g. Priya Gupta" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fellow-email">Email</Label>
                <Input id="fellow-email" type="email" placeholder="e.g. priya@manzil.org" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fellow-phone">Phone</Label>
                <Input id="fellow-phone" placeholder="e.g. +91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fellow-batch">Batch Version</Label>
                <Input id="fellow-batch" placeholder="e.g. 4.0" value={batch} onChange={e => setBatch(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fellow-password">Password {editItem && <span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">(Leave blank to keep unchanged)</span>}</Label>
                <Input id="fellow-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit}>{editItem ? "Save Changes" : "Add Fellow"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search fellows by name or email..." 
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
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
          {filteredFellows.length} Fellow{filteredFellows.length !== 1 ? 's' : ''}
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)}><Pencil className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {fellowCentres.map(centre => (
                  <Badge key={centre._id} variant="secondary" className="text-[10px] font-normal">{centre.name.includes(' - ') ? centre.name.split(" - ")[1] : centre.name}</Badge>
                ))}
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
    </div>
  );
};

export default FellowsPage;
