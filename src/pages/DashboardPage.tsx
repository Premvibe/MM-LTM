import { useAuth } from "@/contexts/AuthContext";
import { Building2, Users, GraduationCap, CalendarDays, TrendingUp, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { centres, fellows, students, sessions, attendanceTrend, centreComparison } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const StatCard = ({ title, value, icon: Icon, subtitle, color }: { title: string; value: string | number; icon: React.ElementType; subtitle?: string; color: string }) => (
  <div className="stat-card animate-fade-in">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const totalStudents = students.length;
  const avgAttendance = Math.round(students.reduce((a, s) => a + s.attendancePercent, 0) / totalStudents);
  const avgLearning = (students.reduce((a, s) => a + s.lastAssessmentScore, 0) / totalStudents).toFixed(1);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="page-description">Here's an overview of the LTM program performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Centres" value={centres.length} icon={Building2} subtitle={`${centres.filter(c => c.type === "In-school").length} In-school`} color="bg-primary/10 text-primary" />
        <StatCard title="Fellows" value={fellows.length} icon={Users} subtitle="Active" color="bg-info/10 text-info" />
        <StatCard title="Students" value={totalStudents} icon={GraduationCap} subtitle="Enrolled" color="bg-success/10 text-success" />
        <StatCard title="Sessions" value={sessions.length} icon={CalendarDays} subtitle="This month" color="bg-accent/10 text-accent" />
        <StatCard title="Attendance" value={`${avgAttendance}%`} icon={TrendingUp} subtitle="Average" color="bg-warning/10 text-warning" />
        <StatCard title="Learning Score" value={avgLearning} icon={ShieldCheck} subtitle="Out of 5" color="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[70, 100]} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Centre Comparison — Attendance %</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={centreComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Centre Quality Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={centreComparison}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Radar name="Learning" dataKey="learning" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              <Radar name="Quality" dataKey="quality" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
