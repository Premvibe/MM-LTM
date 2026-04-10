import { useState } from "react";
import { centres as initialCentres, fellows } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Building2, Plus, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

const CentresPage = () => {
  const [centres, setCentres] = useState(initialCentres);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"In-school" | "After-school">("In-school");

  const handleAdd = () => {
    if (!name.trim() || !location.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    const newCentre = {
      id: `c${Date.now()}`,
      name: name.trim(),
      location: location.trim(),
      type,
      fellowIds: [] as string[],
      studentCount: 0,
    };
    setCentres(prev => [...prev, newCentre]);
    setName("");
    setLocation("");
    setType("In-school");
    setOpen(false);
    toast.success("Centre added successfully");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Centres</h1>
          <p className="page-description">Manage learning centres across the program</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Centre</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Centre</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Centre Name</Label>
                <Input id="name" placeholder="e.g. Govt. School - Saket" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Saket, New Delhi" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v: "In-school" | "After-school") => setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-school">In-school</SelectItem>
                    <SelectItem value="After-school">After-school</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAdd}>Add Centre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {centres.map(c => (
          <Card key={c.id} className="animate-fade-in hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{c.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{c.location}
                    </div>
                  </div>
                </div>
                <Badge variant={c.type === "In-school" ? "default" : "secondary"}>{c.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{c.studentCount} students</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {c.fellowIds.map(fid => fellows.find(f => f.id === fid)?.name).filter(Boolean).join(", ")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CentresPage;
