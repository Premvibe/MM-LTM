import { useState } from "react";
import { sessions as initialSessions, centres, fellows } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, CalendarDays, Clock, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Session = { id: string; date: string; centreId: string; fellowId: string; topic: string; duration: number; activities: string[]; studentsPresent: number };

const SessionsPage = () => {
  const [sessionsList, setSessionsList] = useState<Session[]>(initialSessions);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Session | null>(null);
  const [topic, setTopic] = useState("");
  const [centreId, setCentreId] = useState("");
  const [fellowId, setFellowId] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => { setTopic(""); setCentreId(""); setFellowId(""); setDuration(""); setDate(new Date().toISOString().split("T")[0]); setEditItem(null); };

  const openEdit = (s: Session) => {
    setEditItem(s); setTopic(s.topic); setCentreId(s.centreId); setFellowId(s.fellowId); setDuration(String(s.duration)); setDate(s.date); setOpen(true);
  };

  const handleSubmit = () => {
    if (!topic.trim() || !centreId || !fellowId || !duration) { toast.error("Please fill in all fields"); return; }
    if (editItem) {
      setSessionsList(prev => prev.map(s => s.id === editItem.id ? { ...s, date, centreId, fellowId, topic: topic.trim(), duration: parseInt(duration) } : s));
      toast.success("Session updated successfully");
    } else {
      setSessionsList(prev => [...prev, { id: `ss${Date.now()}`, date, centreId, fellowId, topic: topic.trim(), duration: parseInt(duration), activities: [], studentsPresent: 0 }]);
      toast.success("Session logged successfully");
    }
    resetForm(); setOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setSessionsList(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
    toast.success("Session deleted");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="page-description">Track and manage session logs</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Log Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Session" : "Log New Session"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input placeholder="e.g. Rhythm & Beats Basics" value={topic} onChange={e => setTopic(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Centre</Label>
                <Select value={centreId} onValueChange={setCentreId}>
                  <SelectTrigger><SelectValue placeholder="Select centre" /></SelectTrigger>
                  <SelectContent>{centres.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fellow</Label>
                <Select value={fellowId} onValueChange={setFellowId}>
                  <SelectTrigger><SelectValue placeholder="Select fellow" /></SelectTrigger>
                  <SelectContent>{fellows.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input type="number" placeholder="e.g. 60" min={15} max={180} value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit}>{editItem ? "Save Changes" : "Log Session"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Session?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {sessionsList.map(s => (
          <Card key={s.id} className="animate-fade-in hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{s.topic}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{s.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration} min</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.studentsPresent} present</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{centres.find(c => c.id === s.centreId)?.name.split(" - ")[1]}</Badge>
                  <Badge variant="outline">{fellows.find(f => f.id === s.fellowId)?.name}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              {s.activities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {s.activities.map((a, i) => (
                    <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SessionsPage;
