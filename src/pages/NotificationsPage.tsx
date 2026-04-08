import { notifications } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

const iconMap = {
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
};

const colorMap = {
  warning: "text-warning bg-warning/10",
  error: "text-destructive bg-destructive/10",
  info: "text-info bg-info/10",
  success: "text-success bg-success/10",
};

const NotificationsPage = () => (
  <div>
    <div className="page-header">
      <h1 className="page-title">Notifications</h1>
      <p className="page-description">Alerts and updates for the program</p>
    </div>
    <div className="space-y-3">
      {notifications.map(n => {
        const Icon = iconMap[n.type];
        return (
          <Card key={n.id} className={`animate-fade-in ${!n.read ? "border-l-4 border-l-primary" : ""}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[n.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{n.title}</p>
                  {!n.read && <Badge variant="default" className="text-[10px] px-1.5 py-0">New</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.date}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
);

export default NotificationsPage;
