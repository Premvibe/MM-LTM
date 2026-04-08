import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { centreComparison } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const ReportsPage = () => (
  <div>
    <div className="page-header">
      <h1 className="page-title">Reports & Analytics</h1>
      <p className="page-description">Generate and export program reports</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[
        { title: "Centre-wise Report", desc: "Performance across all centres", icon: FileText },
        { title: "Fellow Performance", desc: "Individual fellow metrics", icon: FileText },
        { title: "Student Progress", desc: "Learning outcome trends", icon: FileText },
      ].map((r, i) => (
        <Card key={i} className="animate-fade-in">
          <CardContent className="p-5 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <r.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5 mr-1" />PDF</Button>
              <Button variant="outline" size="sm"><FileSpreadsheet className="h-3.5 w-3.5 mr-1" />Excel</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparative Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={centreComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="attendance" name="Attendance %" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="learning" name="Learning Score" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="quality" name="Quality Score" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

export default ReportsPage;
