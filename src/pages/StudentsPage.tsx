import { useState } from "react";
import { students as initialStudents, centres } from "@/data/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type Student = { id: string; name: string; age: number; gender: "Male" | "Female"; centreId: string; attendancePercent: number; lastAssessmentScore: number };

const StudentsPage = () => {
  const [studentsList, setStudentsList] = useState<Student[]>(initialStudents);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Student | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [centreId, setCentreId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => { setName(""); setAge(""); setGender("Male"); setCentreId(""); setEditItem(null); };

  const openEdit = (s: Student) => {
    setEditItem(s); setName(s.name); setAge(String(s.age)); setGender(s.gender); setCentreId(s.centreId); setOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !age || !centreId) { toast.error("Please fill in all fields"); return; }
    if (editItem) {
      setStudentsList(prev => prev.map(s => s.id === editItem.id ? { ...s, name: name.trim(), age: parseInt(age), gender, centreId } : s));
      toast.success("Student updated successfully");
    } else {
      setStudentsList(prev => [...prev, { id: `s${Date.now()}`, name: name.trim(), age: parseInt(age), gender, centreId, attendancePercent: 0, lastAssessmentScore: 0 }]);
      toast.success("Student added successfully");
    }
    resetForm(); setOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setStudentsList(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
    toast.success("Student deleted");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-description">Track enrolled students and their progress</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Student" : "Add New Student"}</DialogTitle>
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
              <Button onClick={handleSubmit}>{editItem ? "Save Changes" : "Add Student"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Student?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <TableHead className="w-20">Actions</TableHead>
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
                  <Badge variant={s.lastAssessmentScore >= 4 ? "default" : "secondary"}>{s.lastAssessmentScore}/5</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
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
