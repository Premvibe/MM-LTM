import { centres, fellows } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus, MapPin, Users } from "lucide-react";

const CentresPage = () => (
  <div>
    <div className="page-header flex items-center justify-between">
      <div>
        <h1 className="page-title">Centres</h1>
        <p className="page-description">Manage learning centres across the program</p>
      </div>
      <Button><Plus className="h-4 w-4 mr-2" />Add Centre</Button>
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

export default CentresPage;
