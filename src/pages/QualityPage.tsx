import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const mockQuality = [
  { id: "q1", session: "Rhythm & Beats Basics", centre: "Jangpura", fellow: "Priya Gupta", date: "2026-04-07", teaching: 4, engagement: 5, discipline: 4, score: 4.3 },
  { id: "q2", session: "Vocal Warm-ups & Pitch", centre: "Lajpat Nagar", fellow: "Amit Kumar", date: "2026-04-06", teaching: 3, engagement: 4, discipline: 3, score: 3.3 },
  { id: "q3", session: "Instrument Introduction", centre: "Nizamuddin", fellow: "Neha Singh", date: "2026-04-05", teaching: 5, engagement: 4, discipline: 5, score: 4.7 },
];

const QualityPage = () => (
  <div>
    <div className="page-header flex items-center justify-between">
      <div>
        <h1 className="page-title">Quality Assessment</h1>
        <p className="page-description">Evaluate session quality and generate quality scores</p>
      </div>
      <Button><Plus className="h-4 w-4 mr-2" />New Assessment</Button>
    </div>
    <div className="space-y-3">
      {mockQuality.map(q => (
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

export default QualityPage;
