import { sessions, centres, fellows } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, Clock, Users } from "lucide-react";

const SessionsPage = () => (
  <div>
    <div className="page-header flex items-center justify-between">
      <div>
        <h1 className="page-title">Sessions</h1>
        <p className="page-description">Track and manage session logs</p>
      </div>
      <Button><Plus className="h-4 w-4 mr-2" />Log Session</Button>
    </div>
    <div className="space-y-3">
      {sessions.map(s => (
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
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{centres.find(c => c.id === s.centreId)?.name.split(" - ")[1]}</Badge>
                <Badge variant="outline">{fellows.find(f => f.id === s.fellowId)?.name}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {s.activities.map((a, i) => (
                <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{a}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default SessionsPage;
