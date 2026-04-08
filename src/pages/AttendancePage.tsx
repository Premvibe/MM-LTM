import { students, centres } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const AttendancePage = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-description">Mark student attendance for today's session</p>
        </div>
        <Button disabled={selected.length === 0}>Save Attendance ({selected.length})</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mark Attendance — {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => toggle(s.id)}>
                <div className="flex items-center gap-3">
                  <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{centres.find(c => c.id === s.centreId)?.name.split(" - ")[1]}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{s.attendancePercent}% overall</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
