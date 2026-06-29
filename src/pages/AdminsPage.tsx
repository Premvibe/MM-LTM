import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ShieldCheck, Plus, Pencil, Trash2, Search, Users, Mail, UserCheck, Building2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Admin = {
  _id: string;
  name: string;
  email: string;
  role: "program_director" | "program_lead" | "program_manager";
  assignedFellowIds?: string[];
  assignedCentreIds?: string[];
};

type Fellow = {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  batch?: string;
  centreIds?: string[];
};

type Centre = {
  _id: string;
  id?: string;
  name: string;
  type?: string;
  fellowIds?: string[];
};

const AdminsPage = () => {
  const { user, isSuperAdmin, isMEManager } = useAuth();
  const [adminsList, setAdminsList] = useState<Admin[]>([]);
  const [fellowsList, setFellowsList] = useState<Fellow[]>([]);
  const [centresList, setCentresList] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Admin | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"program_director" | "program_lead" | "program_manager">("program_manager");
  const [selectedFellowIds, setSelectedFellowIds] = useState<string[]>([]);
  const [selectedCentreIds, setSelectedCentreIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminsRes, fellowsRes, centresRes] = await Promise.all([
        api.get("/admins"),
        api.get("/fellows"),
        api.get("/centres")
      ]);
      setAdminsList(adminsRes.data);
      setFellowsList(fellowsRes.data);
      setCentresList(centresRes.data);
    } catch (error) {
      toast.error("Failed to load administration data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("program_manager");
    setSelectedFellowIds([]);
    setSelectedCentreIds([]);
    setEditItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setOpen(true);
  };

  const handleOpenEdit = (admin: Admin) => {
    setEditItem(admin);
    setName(admin.name);
    setEmail(admin.email);
    setPassword("");
    setRole(admin.role);
    setSelectedFellowIds(admin.assignedFellowIds || []);
    setSelectedCentreIds(admin.assignedCentreIds || []);
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (role === "program_manager" && selectedFellowIds.length === 0 && selectedCentreIds.length === 0) {
      toast.error("Please assign at least one Fellow or Centre for Program Managers.");
      return;
    }
    if (!editItem && !password.trim()) {
      toast.error("Password is required when creating a new administrator account.");
      return;
    }

    try {
      const payload: any = {
        name,
        email,
        role,
        assignedFellowIds: role === "program_manager" ? selectedFellowIds : [],
        assignedCentreIds: role === "program_manager" ? selectedCentreIds : []
      };

      if (password) {
        payload.password = password;
      }

      if (editItem) {
        await api.put(`/admins/${editItem._id}`, payload);
        toast.success("Manager details successfully updated!");
      } else {
        await api.post("/admins", payload);
        toast.success("Manager account successfully created!");
      }
      setOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save administrator");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this account?")) return;
    try {
      await api.delete(`/admins/${id}`);
      toast.success("Account successfully deleted.");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete administrator");
    }
  };

  // Helper: get centre IDs assigned to a fellow (using centre.fellowIds as source of truth)
  const getCentreIdsForFellow = (fellowId: string): string[] => {
    const fellow = fellowsList.find(f => f._id === fellowId || f.id === fellowId);
    if (!fellow) return [];
    return centresList
      .filter(c => c.fellowIds?.includes(fellow._id) || c.fellowIds?.includes(fellow.id))
      .map(c => c._id || c.id || "");
  };

  const handleToggleFellow = (fellowId: string) => {
    const isChecking = !selectedFellowIds.includes(fellowId);
    if (isChecking) {
      const newSelectedFellows = [...selectedFellowIds, fellowId];
      setSelectedFellowIds(newSelectedFellows);
      // Auto-select this fellow's centres
      const fellowCentreIds = getCentreIdsForFellow(fellowId);
      setSelectedCentreIds(prev => {
        const next = [...prev];
        fellowCentreIds.forEach(cid => {
          if (!next.includes(cid)) next.push(cid);
        });
        return next;
      });
    } else {
      const newSelectedFellows = selectedFellowIds.filter(id => id !== fellowId);
      setSelectedFellowIds(newSelectedFellows);
      // Auto-deselect centres that no remaining selected fellow needs
      const removedFellowCentreIds = getCentreIdsForFellow(fellowId);
      const stillNeededCentreIds = new Set<string>();
      newSelectedFellows.forEach(fid => {
        getCentreIdsForFellow(fid).forEach(cid => stillNeededCentreIds.add(cid));
      });
      setSelectedCentreIds(prev =>
        prev.filter(cid => !removedFellowCentreIds.includes(cid) || stillNeededCentreIds.has(cid))
      );
    }
  };

  const handleSelectAllFellows = () => {
    const allFellowIds = fellowsList.map(f => f._id || f.id);
    setSelectedFellowIds(allFellowIds);
    // Auto-select all centres that belong to any fellow
    const allCentreIds = new Set<string>();
    allFellowIds.forEach(fid => {
      getCentreIdsForFellow(fid).forEach(cid => allCentreIds.add(cid));
    });
    setSelectedCentreIds(prev => {
      const next = [...prev];
      allCentreIds.forEach(cid => {
        if (!next.includes(cid)) next.push(cid);
      });
      return next;
    });
  };

  const handleClearAllFellows = () => {
    setSelectedFellowIds([]);
    setSelectedCentreIds([]);
  };

  const handleToggleCentre = (centreId: string) => {
    setSelectedCentreIds(prev => 
      prev.includes(centreId) ? prev.filter(id => id !== centreId) : [...prev, centreId]
    );
  };

  const handleSelectAllCentres = () => {
    setSelectedCentreIds(centresList.map(c => c._id || c.id || ""));
  };

  const handleClearAllCentres = () => {
    setSelectedCentreIds([]);
  };

  const getRoleLabel = (roleVal: string) => {
    switch (roleVal) {
      case "m_e_manager":
        return "M&E Manager";
      case "program_director":
        return "Program Director";
      case "program_lead":
        return "Program Lead";
      case "program_manager":
        return "Program Manager";
      default:
        return roleVal;
    }
  };

  const getRoleBadgeVariant = (roleVal: string) => {
    switch (roleVal) {
      case "m_e_manager":
      case "program_director":
        return "default";
      case "program_lead":
        return "secondary";
      default:
        return "outline";
    }
  };

  const filteredAdmins = adminsList.filter(admin => 
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
          <ShieldCheck className="h-8 w-8 stroke-[2]" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Access Restricted</h2>
        <p className="text-sm font-medium text-muted-foreground max-w-sm text-center">
          Admin list management is only accessible to Program Directors and Program Leads.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            Managers & Admins Management
          </h1>
          <p className="page-description font-medium">Manage hierarchical RBAC permissions and delegate fellows & centres to managers</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAdd} className="rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4 mr-2" />Add Administrator / Manager
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-lg">
            <form onSubmit={handleSave}>
              <div className="bg-primary p-8 text-white">
                <DialogTitle className="text-2xl font-black tracking-tight">
                  {editItem ? "Edit Credentials & Scope" : "Create Account & Scope"}
                </DialogTitle>
                <p className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">
                  Hierarchy and data isolation control
                </p>
              </div>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <Input 
                    placeholder="e.g. Priyanshu Sharma" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11 text-xs font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <Input 
                    type="email"
                    placeholder="e.g. sharma@manzilmystics.org" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11 text-xs font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Password {editItem && <span className="text-muted-foreground/60">(leave blank to keep current)</span>}
                  </Label>
                  <Input 
                    type="password"
                    placeholder={editItem ? "••••••••" : "Enter account password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required={!editItem}
                    className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11 text-xs font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">System Privilege / Role</Label>
                  <Select 
                    value={role} 
                    onValueChange={(val: any) => setRole(val)}
                  >
                    <SelectTrigger className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11 text-xs font-bold">
                      <SelectValue placeholder="Select Privileged Role..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                      <SelectItem value="m_e_manager" className="rounded-lg text-xs font-bold text-primary">M&E Manager (Super Admin +)</SelectItem>
                      <SelectItem value="program_director" className="rounded-lg text-xs font-bold">Program Director (Super Admin)</SelectItem>
                      <SelectItem value="program_lead" className="rounded-lg text-xs font-bold">Program Lead (Super Admin)</SelectItem>
                      <SelectItem value="program_manager" className="rounded-lg text-xs font-bold">Program Manager (Admin - Scoped)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === "program_manager" && (
                  <div className="space-y-5 pt-2 border-t border-muted">
                    {/* Fellows Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                          Delegate Assigned Fellows <span className="text-red-500">*</span>
                          {selectedFellowIds.length > 0 && (
                            <span className="ml-2 text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                              {selectedFellowIds.length} selected
                            </span>
                          )}
                        </Label>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleSelectAllFellows} 
                            className="h-6 text-[8px] font-black uppercase text-primary tracking-widest"
                          >
                            Select All
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleClearAllFellows} 
                            className="h-6 text-[8px] font-black uppercase text-red-500 tracking-widest"
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                      
                      <div className="max-h-[200px] overflow-y-auto p-2 bg-muted/20 border border-muted rounded-2xl space-y-3">
                        {(() => {
                          const grouped: Record<string, Fellow[]> = {};
                          fellowsList.forEach(fellow => {
                            const batchKey = fellow.batch || 'Other';
                            if (!grouped[batchKey]) grouped[batchKey] = [];
                            grouped[batchKey].push(fellow);
                          });
                          const sortedBatches = Object.entries(grouped).sort((a, b) => {
                            const aNum = parseFloat(a[0]);
                            const bNum = parseFloat(b[0]);
                            if (isNaN(aNum) && isNaN(bNum)) return 0;
                            if (isNaN(aNum)) return 1;
                            if (isNaN(bNum)) return -1;
                            return aNum - bNum;
                          });
                          return sortedBatches.map(([batch, fellows]) => (
                            <div key={batch} className="space-y-1.5">
                              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 bg-muted/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                                Batch {batch} Fellows
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {fellows.map(fellow => {
                                  const isChecked = selectedFellowIds.includes(fellow._id);
                                  const fellowCentres = centresList.filter(c =>
                                    c.fellowIds?.includes(fellow._id) || c.fellowIds?.includes(fellow.id)
                                  );
                                  const hasInSchool = fellowCentres.some(c => c.type === "In-school");
                                  const hasAfterSchool = fellowCentres.some(c => c.type === "After-school");
                                  return (
                                    <div
                                      key={fellow._id}
                                      onClick={() => handleToggleFellow(fellow._id)}
                                      className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer select-none ${isChecked ? 'bg-primary/5 border-primary/20 text-primary font-bold' : 'bg-white border-muted hover:border-primary/20 text-foreground'}`}
                                    >
                                      <div className={`h-4 w-4 shrink-0 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-primary border-primary text-white scale-105 shadow-sm shadow-primary/20' : 'border-primary/40 bg-white'}`}>
                                        {isChecked && <Check className="h-2.5 w-2.5 stroke-[3.5]" />}
                                      </div>
                                      <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
                                        <span className="text-xs truncate">{fellow.name}</span>
                                        <div className="flex gap-1 shrink-0">
                                          {hasInSchool && (
                                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                              In-School
                                            </span>
                                          )}
                                          {hasAfterSchool && (
                                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                              After-School
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Centres Selection */}
                    <div className="space-y-2 pt-2 border-t border-muted/50">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                          Delegate Assigned Centres <span className="text-red-500">*</span>
                          {selectedCentreIds.length > 0 && (
                            <span className="ml-2 text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              {selectedCentreIds.length} selected
                            </span>
                          )}
                        </Label>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleSelectAllCentres} 
                            className="h-6 text-[8px] font-black uppercase text-primary tracking-widest"
                          >
                            Select All
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleClearAllCentres} 
                            className="h-6 text-[8px] font-black uppercase text-red-500 tracking-widest"
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-2 bg-muted/20 border border-muted rounded-2xl">
                        {centresList.map(centre => {
                          const centreId = centre._id || centre.id || "";
                          const isChecked = selectedCentreIds.includes(centreId);
                          return (
                            <div 
                              key={centreId}
                              onClick={() => handleToggleCentre(centreId)}
                              className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer select-none ${isChecked ? 'bg-primary/5 border-primary/20 text-primary font-bold' : 'bg-white border-muted hover:border-primary/20 text-foreground'}`}
                            >
                              <div className={`h-4 w-4 shrink-0 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-primary border-primary text-white scale-105 shadow-sm shadow-primary/20' : 'border-primary/40 bg-white'}`}>
                                {isChecked && <Check className="h-2.5 w-2.5 stroke-[3.5]" />}
                              </div>
                              <span className="text-xs truncate">{centre.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="bg-muted/30 p-6 border-t gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" className="rounded-xl h-11 font-bold text-xs uppercase tracking-wider">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-wider">
                  {editItem ? "Save Changes" : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
          <Input 
            placeholder="Search accounts by name or email..." 
            className="pl-10 h-11 rounded-2xl border-none shadow-sm bg-white/60 font-bold text-xs" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdmins.map((admin) => (
            <Card key={admin._id} className="border-none shadow-xl rounded-[2.5rem] bg-white/50 backdrop-blur-md hover:shadow-2xl hover:translate-y-[-2px] transition-all duration-300 overflow-hidden flex flex-col justify-between">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                      <UserCheck className="h-5 w-5 stroke-[2]" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black tracking-tight">{admin.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-muted-foreground/80">
                        <Mail className="h-3 w-3 text-primary/50" />
                        <span>{admin.email}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(admin.role)} className="rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest">
                    {getRoleLabel(admin.role)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {admin.role === "program_manager" ? (
                  <div className="space-y-4 border-t border-primary/5 pt-4">
                    {/* Fellows Display */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-primary/70" />
                          Assigned Fellows
                        </span>
                        <Badge variant="outline" className="text-[8px] font-black px-1.5 py-0 bg-primary/5 text-primary/70 border-primary/10">
                          {(admin.assignedFellowIds || []).length} assigned
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-[75px] overflow-y-auto p-1.5 bg-muted/20 border border-muted/50 rounded-xl">
                        {(admin.assignedFellowIds || []).length === 0 ? (
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest pl-1">No fellows assigned</span>
                        ) : (
                          admin.assignedFellowIds?.map(fid => {
                            const fellow = fellowsList.find(f => f._id === fid || f.id === fid);
                            return fellow ? (
                              <Badge key={fid} variant="secondary" className="text-[8px] font-bold uppercase py-0.5 px-2 bg-primary/10 text-primary border-none hover:bg-primary/20">
                                {fellow.name}
                              </Badge>
                            ) : null;
                          })
                        )}
                      </div>
                    </div>

                    {/* Centres Display */}
                    <div className="space-y-2 pt-2 border-t border-muted/30">
                      <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-primary/70" />
                          Assigned Centres
                        </span>
                        <Badge variant="outline" className="text-[8px] font-black px-1.5 py-0 bg-primary/5 text-primary/70 border-primary/10">
                          {(admin.assignedCentreIds || []).length} assigned
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-[75px] overflow-y-auto p-1.5 bg-muted/20 border border-muted/50 rounded-xl">
                        {(admin.assignedCentreIds || []).length === 0 ? (
                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-1">No centres explicitly assigned</span>
                        ) : (
                          admin.assignedCentreIds?.map(cid => {
                            const centre = centresList.find(c => c._id === cid || c.id === cid);
                            return centre ? (
                              <Badge key={cid} variant="secondary" className="text-[8px] font-bold uppercase py-0.5 px-2 bg-emerald-100 text-emerald-800 border-none hover:bg-emerald-200">
                                {centre.name}
                              </Badge>
                            ) : null;
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 border-t border-primary/5 pt-4">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 rounded-xl p-2 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 stroke-[2]" />
                      Super Administrator: Full unrestricted database view
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 border-t border-primary/5 pt-4">
                  <Button 
                    onClick={() => handleOpenEdit(admin)} 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-primary/10 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all"
                  >
                    <Pencil className="h-3 w-3 mr-1" />Edit Privileges
                  </Button>
                  {isMEManager && (
                    <Button 
                      onClick={() => handleDelete(admin._id)} 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />Delete Account
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminsPage;
