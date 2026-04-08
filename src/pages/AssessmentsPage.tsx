import { students } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const parameters = ["Rhythm", "Pitch", "Confidence", "Participation"];

const mockAssessments = students.slice(0, 4).map(s => ({
  student: s.name,
  baseline: parameters.map(() => Math.floor(Math.random() * 3) + 1),
  midline: parameters.map(() => Math.floor(Math.random() * 2) + 2),
  endline: parameters.map(() => Math.floor(Math.random() * 2) + 3),
}));

const ScoreCell = ({ score }: { score: number }) => {
  const colors = ["", "bg-destructive/10 text-destructive", "bg-warning/10 text-warning", "bg-accent/10 text-accent", "bg-info/10 text-info", "bg-success/10 text-success"];
  return <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold ${colors[score]}`}>{score}</span>;
};

const AssessmentsPage = () => (
  <div>
    <div className="page-header">
      <h1 className="page-title">Assessments</h1>
      <p className="page-description">Track student learning outcomes across assessment phases</p>
    </div>
    <Tabs defaultValue="baseline">
      <TabsList className="mb-4">
        <TabsTrigger value="baseline">Baseline</TabsTrigger>
        <TabsTrigger value="midline">Midline</TabsTrigger>
        <TabsTrigger value="endline">Endline</TabsTrigger>
      </TabsList>
      {(["baseline", "midline", "endline"] as const).map(phase => (
        <TabsContent key={phase} value={phase}>
          <div className="space-y-3">
            {mockAssessments.map((a, i) => (
              <Card key={i} className="animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <p className="font-medium text-sm min-w-[140px]">{a.student}</p>
                    <div className="flex flex-wrap gap-4">
                      {parameters.map((p, j) => (
                        <div key={p} className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">{p}</p>
                          <ScoreCell score={a[phase][j]} />
                        </div>
                      ))}
                    </div>
                    <div className="ml-auto">
                      <Badge variant="secondary">
                        Avg: {(a[phase].reduce((x, y) => x + y, 0) / a[phase].length).toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  </div>
);

export default AssessmentsPage;
