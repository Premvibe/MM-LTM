import { useState } from "react";
import { centres as initialCentres, fellows } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Building2, Plus, MapPin, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Centre = { id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };

const CentresPage = () => {
  const [centres, setCentres] = useState<Centre[]>(initialCentres);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Centre | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"In-school" | "After-school">("In-school");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => { setName(""); setLocation(""); setType("In-school"); setEditItem(null); };

  const openEdit = (c: Centre) => {
    setEditItem(c); setName(c.name); setLocation(c.location); setType(c.type); setOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !location.trim()) { toast.error("Please fill in all fields"); return; }
    if (editItem) {
      setCentres(prev => prev.map(c => c.id === editItem.id ? { ...c, name: name.trim(), location: location.trim(), type } : c));
      toast.success("Centre updated successfully");
    } else {
      setCentres(prev => [...prev, { id: `c${Date.now()}`, name: name.trim(), location: location.trim(), type, fellowIds: [], studentCount: 0 }]);
      toast.success("Centre added successfully");
    }
    resetForm(); setOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setCentres(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast.success("Centre deleted");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Centres</h1>
          <p className="page-description">Manage learning centres across the program</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Centre</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Centre" : "Add New Centre"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
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
                <Select value={type} onValueChange={(v: "In-school" | "After-school") => setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-school">In-school</SelectItem>
                    <SelectItem value="After-school">After-school</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit}>{editItem ? "Save Changes" : "Add Centre"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Centre?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {centres.map(c => (
          <Card key={c.id} className="animate-fade-in hover:shadow-md transition-shadow">
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <Badge variant={c.type === "In-school" ? "default" : "secondary"} className="w-fit mt-1">{c.type}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{c.studentCount} students</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {c.fellowIds.map(fid => fellows.find(f => f.id === fid)?.name).filter(Boolean).join(", ")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CentresPage;
