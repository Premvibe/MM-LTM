import { useState } from "react";
import { students as initialStudents, centres } from "@/data/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const StudentsPage = () => {
  const [studentsList, setStudentsList] = useState(initialStudents);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [centreId, setCentreId] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !age || !centreId) {
      toast.error("Please fill in all fields");
      return;
    }
    setStudentsList(prev => [...prev, {
      id: `s${Date.now()}`,
      name: name.trim(),
      age: parseInt(age),
      gender,
      centreId,
      attendancePercent: 0,
      lastAssessmentScore: 0,
    }]);
    setName(""); setAge(""); setGender("Male"); setCentreId("");
    setOpen(false);
    toast.success("Student added successfully");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-description">Track enrolled students and their progress</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="e.g. Ravi Kumar" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" placeholder="e.g. 12" min={5} max={25} value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(v: "Male" | "Female") => setGender(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAdd}>Add Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            {studentsList.map(s => (
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
};

export default StudentsPage;
