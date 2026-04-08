import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, CalendarDays, AlertTriangle } from "lucide-react";

const mockVisits = [
  { id: "v1", date: "2026-04-06", centre: "Jangpura", observer: "Arjun Patel", observations: "Students were highly engaged. Good use of instruments.", issues: "Classroom too small for group activities.", rating: "Good" },
  { id: "v2", date: "2026-04-03", centre: "Lajpat Nagar", observer: "Arjun Patel", observations: "Mixed participation. Some students disengaged during theory portion.", issues: "Fellow arrived 15 minutes late. No keyboard available.", rating: "Average" },
  { id: "v3", date: "2026-04-01", centre: "Nizamuddin", observer: "Arjun Patel", observations: "Excellent session. Strong rapport between fellow and students.", issues: "None", rating: "Excellent" },
];

const FieldVisitsPage = () => (
  <div>
    <div className="page-header flex items-center justify-between">
      <div>
        <h1 className="page-title">Field Visits</h1>
        <p className="page-description">Log and review field observation visits</p>
      </div>
      <Button><Plus className="h-4 w-4 mr-2" />Log Visit</Button>
    </div>
    <div className="space-y-3">
      {mockVisits.map(v => (
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

export default FieldVisitsPage;
