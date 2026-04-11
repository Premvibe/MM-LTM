import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, MapPin, CalendarDays, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { centres } from "@/data/mockData";

type Visit = { id: string; date: string; centre: string; observer: string; observations: string; issues: string; rating: string };

const initialVisits: Visit[] = [
  { id: "v1", date: "2026-04-06", centre: "Jangpura", observer: "Arjun Patel", observations: "Students were highly engaged. Good use of instruments.", issues: "Classroom too small for group activities.", rating: "Good" },
  { id: "v2", date: "2026-04-03", centre: "Lajpat Nagar", observer: "Arjun Patel", observations: "Mixed participation. Some students disengaged during theory portion.", issues: "Fellow arrived 15 minutes late. No keyboard available.", rating: "Average" },
  { id: "v3", date: "2026-04-01", centre: "Nizamuddin", observer: "Arjun Patel", observations: "Excellent session. Strong rapport between fellow and students.", issues: "None", rating: "Excellent" },
];

const FieldVisitsPage = () => {
  const [visits, setVisits] = useState(initialVisits);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Visit | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [centreId, setCentreId] = useState("");
  const [observations, setObservations] = useState("");
  const [issues, setIssues] = useState("");
  const [rating, setRating] = useState("Good");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => { setCentreId(""); setObservations(""); setIssues(""); setRating("Good"); setDate(new Date().toISOString().split("T")[0]); setEditItem(null); };

  const openEdit = (v: Visit) => {
    setEditItem(v); setObservations(v.observations); setIssues(v.issues === "None" ? "" : v.issues); setRating(v.rating); setDate(v.date); setOpen(true);
  };

  const handleSubmit = () => {
    if (editItem) {
      if (!observations.trim()) { toast.error("Please fill in observations"); return; }
      setVisits(prev => prev.map(v => v.id === editItem.id ? { ...v, date, observations: observations.trim(), issues: issues.trim() || "None", rating } : v));
      toast.success("Visit updated successfully");
    } else {
      if (!centreId || !observations.trim()) { toast.error("Please fill in centre and observations"); return; }
      const centre = centres.find(c => c.id === centreId);
      setVisits(prev => [...prev, { id: `v${Date.now()}`, date, centre: centre?.name.split(" - ")[1] || centre?.name || "", observer: "Current User", observations: observations.trim(), issues: issues.trim() || "None", rating }]);
      toast.success("Field visit logged successfully");
    }
    resetForm(); setOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setVisits(prev => prev.filter(v => v.id !== deleteId));
    setDeleteId(null);
    toast.success("Visit deleted");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Field Visits</h1>
          <p className="page-description">Log and review field observation visits</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Log Visit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Visit" : "Log Field Visit"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              {!editItem && (
                <div className="space-y-2">
                  <Label>Centre</Label>
                  <Select value={centreId} onValueChange={setCentreId}>
                    <SelectTrigger><SelectValue placeholder="Select centre" /></SelectTrigger>
                    <SelectContent>{centres.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Observations</Label>
                <Textarea placeholder="Describe your observations..." value={observations} onChange={e => setObservations(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Issues (if any)</Label>
                <Textarea placeholder="Note any issues..." value={issues} onChange={e => setIssues(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit}>{editItem ? "Save Changes" : "Log Visit"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Visit?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {visits.map(v => (
          <Card key={v.id} className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{v.date}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{v.centre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={v.rating === "Excellent" ? "default" : v.rating === "Good" ? "secondary" : "outline"}>{v.rating}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <p className="text-sm mb-2">{v.observations}</p>
              {v.issues !== "None" && (
                <div className="flex items-start gap-2 text-sm text-warning bg-warning/10 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{v.issues}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FieldVisitsPage;
