import { useState } from "react";
import { fellows as initialFellows, centres } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const FellowsPage = () => {
  const [fellowsList, setFellowsList] = useState(initialFellows);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in name and email");
      return;
    }
    const newFellow = {
      id: `f${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      centreIds: [] as string[],
      sessionsCompleted: 0,
      attendanceRate: 0,
    };
    setFellowsList(prev => [...prev, newFellow]);
    setName("");
    setEmail("");
    setPhone("");
    setOpen(false);
    toast.success("Fellow added successfully");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Fellows</h1>
          <p className="page-description">Manage program fellows and track performance</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Fellow</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Fellow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="fellow-name">Full Name</Label>
                <Input id="fellow-name" placeholder="e.g. Priya Gupta" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fellow-email">Email</Label>
                <Input id="fellow-email" type="email" placeholder="e.g. priya@manzil.org" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fellow-phone">Phone</Label>
                <Input id="fellow-phone" placeholder="e.g. +91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAdd}>Add Fellow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {fellowsList.map(f => (
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
};

export default FellowsPage;
