import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, MapPin, CalendarDays, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { centres } from "@/data/mockData";

const initialVisits = [
  { id: "v1", date: "2026-04-06", centre: "Jangpura", observer: "Arjun Patel", observations: "Students were highly engaged. Good use of instruments.", issues: "Classroom too small for group activities.", rating: "Good" },
  { id: "v2", date: "2026-04-03", centre: "Lajpat Nagar", observer: "Arjun Patel", observations: "Mixed participation. Some students disengaged during theory portion.", issues: "Fellow arrived 15 minutes late. No keyboard available.", rating: "Average" },
  { id: "v3", date: "2026-04-01", centre: "Nizamuddin", observer: "Arjun Patel", observations: "Excellent session. Strong rapport between fellow and students.", issues: "None", rating: "Excellent" },
];

const FieldVisitsPage = () => {
  const [visits, setVisits] = useState(initialVisits);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [centreId, setCentreId] = useState("");
  const [observations, setObservations] = useState("");
  const [issues, setIssues] = useState("");
  const [rating, setRating] = useState("Good");

  const handleAdd = () => {
    if (!centreId || !observations.trim()) {
      toast.error("Please fill in centre and observations");
      return;
    }
    const centre = centres.find(c => c.id === centreId);
    setVisits(prev => [...prev, {
      id: `v${Date.now()}`,
      date,
      centre: centre?.name.split(" - ")[1] || centre?.name || "",
      observer: "Current User",
      observations: observations.trim(),
      issues: issues.trim() || "None",
      rating,
    }]);
    setCentreId(""); setObservations(""); setIssues(""); setRating("Good");
    setOpen(false);
    toast.success("Field visit logged successfully");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Field Visits</h1>
          <p className="page-description">Log and review field observation visits</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Log Visit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Field Visit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Centre</Label>
                <Select value={centreId} onValueChange={setCentreId}>
                  <SelectTrigger><SelectValue placeholder="Select centre" /></SelectTrigger>
                  <SelectContent>
                    {centres.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
              <Button onClick={handleAdd}>Log Visit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {visits.map(v => (
          <Card key={v.id} className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{v.date}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{v.centre}</span>
                </div>
                <Badge variant={v.rating === "Excellent" ? "default" : v.rating === "Good" ? "secondary" : "outline"}>
                  {v.rating}
                </Badge>
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
