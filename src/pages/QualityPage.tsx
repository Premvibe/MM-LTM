import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { sessions, centres, fellows } from "@/data/mockData";

const initialQuality = [
  { id: "q1", session: "Rhythm & Beats Basics", centre: "Jangpura", fellow: "Priya Gupta", date: "2026-04-07", teaching: 4, engagement: 5, discipline: 4, score: 4.3 },
  { id: "q2", session: "Vocal Warm-ups & Pitch", centre: "Lajpat Nagar", fellow: "Amit Kumar", date: "2026-04-06", teaching: 3, engagement: 4, discipline: 3, score: 3.3 },
  { id: "q3", session: "Instrument Introduction", centre: "Nizamuddin", fellow: "Neha Singh", date: "2026-04-05", teaching: 5, engagement: 4, discipline: 5, score: 4.7 },
];

const QualityPage = () => {
  const [qualityList, setQualityList] = useState(initialQuality);
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [teaching, setTeaching] = useState("3");
  const [engagement, setEngagement] = useState("3");
  const [discipline, setDiscipline] = useState("3");

  const handleAdd = () => {
    if (!sessionId) {
      toast.error("Please select a session");
      return;
    }
    const s = sessions.find(x => x.id === sessionId);
    const t = parseInt(teaching), e = parseInt(engagement), d = parseInt(discipline);
    const score = Math.round(((t + e + d) / 3) * 10) / 10;
    setQualityList(prev => [...prev, {
      id: `q${Date.now()}`,
      session: s?.topic || "",
      centre: centres.find(c => c.id === s?.centreId)?.name.split(" - ")[1] || "",
      fellow: fellows.find(f => f.id === s?.fellowId)?.name || "",
      date: s?.date || "",
      teaching: t, engagement: e, discipline: d, score,
    }]);
    setSessionId(""); setTeaching("3"); setEngagement("3"); setDiscipline("3");
    setOpen(false);
    toast.success("Quality assessment added");
  };

  const scores = ["1", "2", "3", "4", "5"];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Quality Assessment</h1>
          <p className="page-description">Evaluate session quality and generate quality scores</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Assessment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Quality Assessment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Session</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.topic} ({s.date})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teaching Method (1-5)</Label>
                <Select value={teaching} onValueChange={setTeaching}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{scores.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Engagement (1-5)</Label>
                <Select value={engagement} onValueChange={setEngagement}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{scores.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discipline (1-5)</Label>
                <Select value={discipline} onValueChange={setDiscipline}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{scores.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAdd}>Submit Assessment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {qualityList.map(q => (
          <Card key={q.id} className="animate-fade-in">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-sm">{q.session}</p>
                  <p className="text-xs text-muted-foreground">{q.centre} • {q.fellow} • {q.date}</p>
                </div>
                <Badge variant={q.score >= 4 ? "default" : "secondary"} className="text-sm">
                  Quality Score: {q.score}/5
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[{ label: "Teaching Method", val: q.teaching }, { label: "Engagement", val: q.engagement }, { label: "Discipline", val: q.discipline }].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={item.val * 20} className="h-2 flex-1" />
                      <span className="text-xs font-medium">{item.val}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QualityPage;
