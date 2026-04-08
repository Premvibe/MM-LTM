import { fellows, centres } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const FellowsPage = () => (
  <div>
    <div className="page-header flex items-center justify-between">
      <div>
        <h1 className="page-title">Fellows</h1>
        <p className="page-description">Manage program fellows and track performance</p>
      </div>
      <Button><Plus className="h-4 w-4 mr-2" />Add Fellow</Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {fellows.map(f => (
        <Card key={f.id} className="animate-fade-in hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">{f.name.charAt(0)}</span>
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{f.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{f.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {f.centreIds.map(cid => {
                const centre = centres.find(c => c.id === cid);
                return centre ? <Badge key={cid} variant="secondary" className="text-xs">{centre.name.split(" - ")[1] || centre.name}</Badge> : null;
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Sessions</p>
                <p className="font-semibold">{f.sessionsCompleted}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Attendance Rate</p>
                <div className="flex items-center gap-2">
                  <Progress value={f.attendanceRate} className="h-2 flex-1" />
                  <span className="font-semibold text-xs">{f.attendanceRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default FellowsPage;
