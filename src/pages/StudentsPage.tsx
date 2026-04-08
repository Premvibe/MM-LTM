import { students, centres } from "@/data/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const StudentsPage = () => (
  <div>
    <div className="page-header flex items-center justify-between">
      <div>
        <h1 className="page-title">Students</h1>
        <p className="page-description">Track enrolled students and their progress</p>
      </div>
      <Button><Plus className="h-4 w-4 mr-2" />Add Student</Button>
    </div>
    <div className="bg-card rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Centre</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Learning Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(s => (
            <TableRow key={s.id} className="animate-fade-in">
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.age}</TableCell>
              <TableCell><Badge variant="secondary">{s.gender}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{centres.find(c => c.id === s.centreId)?.name.split(" - ")[1] || ""}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress value={s.attendancePercent} className="h-2 flex-1" />
                  <span className="text-xs font-medium w-8">{s.attendancePercent}%</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={s.lastAssessmentScore >= 4 ? "default" : "secondary"}>
                  {s.lastAssessmentScore}/5
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

export default StudentsPage;
