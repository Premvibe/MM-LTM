import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Undo2, Reply, Send, CheckCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

const NotificationsPage = () => {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fellowsList, setFellowsList] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [targetRecipient, setTargetRecipient] = useState("all_fellows");
  const [isCreating, setIsCreating] = useState(false);

  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const fetchNotifications = async () => {
    try {
      const roleParam = user?.role === 'fellow' 
        ? `?role=fellow` 
        : user?.role === 'program_manager' 
          ? `?role=program_manager&email=${user.email}` 
          : `?role=${user?.role}`;
      const [notifsRes, fellowsRes, adminsRes] = await Promise.all([
        api.get(`/notifications${roleParam}`),
        api.get(`/fellows${roleParam}`),
        user?.role === 'admin' ? api.get(`/admins`) : Promise.resolve({ data: [] })
      ]);
      setNotifications(notifsRes.data);
      setFellowsList(fellowsRes.data);
      setAdminsList(adminsRes.data.filter((a: any) => a.role === 'program_manager'));
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const roleParam = user?.role === 'fellow' 
        ? `?role=fellow` 
        : user?.role === 'program_manager' 
          ? `?role=program_manager&email=${user.email}` 
          : `?role=${user?.role}`;
      await api.put(`/notifications/mark-all-read${roleParam}`);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success("All messages marked as read");
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleRead = async (id: string, currentlyRead: boolean) => {
    try {
      const endpoint = currentlyRead ? "unread" : "read";
      await api.put(`/notifications/${id}/${endpoint}`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: !currentlyRead } : n));
      if (!currentlyRead) toast.success("Marked as read");
      else toast.success("Marked as unread");
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    setIsSending(true);
    try {
      await api.post("/notifications", {
        type: "info",
        title: "Admin Feedback",
        message: replyMessage.trim(),
        date: new Date().toISOString(),
        recipientRole: "fellow",
        recipientId: replyingTo.relatedEntityId
      });
      toast.success("Reply sent to fellow");
      setReplyingTo(null);
      setReplyMessage("");
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNotification = async () => {
    if (!newTitle.trim() || !newMessage.trim()) return;
    setIsCreating(true);
    try {
      let recipientRole = "fellow";
      let recipientId: string | null = null;
      
      if (targetRecipient === "all_fellows") {
        recipientRole = "fellow";
      } else if (targetRecipient === "all_program_managers") {
        recipientRole = "program_manager";
      } else if (adminsList.find(a => a._id === targetRecipient)) {
        recipientRole = "program_manager";
        recipientId = targetRecipient;
      } else {
        recipientRole = "fellow";
        recipientId = targetRecipient;
      }

      await api.post("/notifications", {
        type: "info",
        title: newTitle.trim(),
        message: newMessage.trim(),
        date: new Date().toISOString(),
        recipientRole,
        recipientId
      });
      toast.success("Notification sent successfully");
      setIsNewDialogOpen(false);
      setNewTitle("");
      setNewMessage("");
      setTargetRecipient("all_fellows");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to send notification");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <div className="h-[200px] w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
  <div>
    <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="page-title">Notifications</h1>
        <p className="page-description">Alerts and updates for the program</p>
      </div>
      <div className="flex items-center gap-3">
        {notifications.some(n => !n.read) && (
          <Button variant="outline" onClick={markAllAsRead} className="rounded-2xl px-6 border-primary/20 text-primary hover:bg-primary/5">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
        {user?.role === 'admin' && (
          <Button onClick={() => setIsNewDialogOpen(true)} className="rounded-2xl px-6 shadow-lg shadow-primary/20">
            <Send className="h-4 w-4 mr-2" />
            Send Announcement
          </Button>
        )}
      </div>
    </div>
    <div className="space-y-3">
      {notifications.map(n => {
        const Icon = iconMap[n.type as keyof typeof iconMap] || Info;
        return (
          <Card 
            key={n._id} 
            className={`animate-fade-in transition-all duration-300 ${!n.read ? "border-l-4 border-l-primary hover:bg-secondary/5" : "opacity-70"}`}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div 
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:scale-110 transition-transform ${colorMap[n.type as keyof typeof colorMap]}`}
                onClick={() => toggleRead(n._id, n.read)}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 cursor-pointer hover:bg-black/5 p-2 rounded-xl transition-colors -m-2" onClick={() => setSelectedNotification(n)}>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-bold text-sm ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                    {!n.read && <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">New</Badge>}
                    {user?.role === 'admin' && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground border-muted-foreground/30">
                        {n.recipientRole === 'admin' 
                          ? 'To: Admin' 
                          : n.recipientRole === 'program_manager'
                            ? n.recipientId 
                              ? `To: ${adminsList.find(a => a._id === n.recipientId)?.name || 'Unknown Manager'}`
                              : 'To: All Program Managers'
                            : n.recipientId 
                              ? `To: ${fellowsList.find(f => f._id === n.recipientId)?.name || 'Unknown Fellow'}` 
                              : 'To: All Fellows'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {new Date(n.date).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    <div className="flex items-center gap-1">
                      {n.read && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => toggleRead(n._id, true)}>
                          <Undo2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {user?.role === 'admin' && n.relatedEntityId && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); setReplyingTo(n); }}>
                          <Reply className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <p className={`text-sm mt-1 mb-1 line-clamp-2 ${!n.read ? "text-muted-foreground font-medium" : "text-muted-foreground/60"}`}>{n.message}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {notifications.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-bold text-lg">All caught up!</p>
            <p className="text-sm text-muted-foreground">You don't have any new notifications.</p>
          </CardContent>
        </Card>
      )}
    </div>

    <Dialog open={!!selectedNotification} onOpenChange={(v) => !v && setSelectedNotification(null)}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedNotification?.type === 'warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
            {selectedNotification?.type === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
            {selectedNotification?.type === 'info' && <Info className="h-5 w-5 text-info" />}
            {selectedNotification?.type === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
            {selectedNotification?.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 text-foreground">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedNotification?.message}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-4 border-t border-muted">
            Received: {selectedNotification?.date && new Date(selectedNotification.date).toLocaleString()}
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-xl">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!replyingTo} onOpenChange={(v) => !v && setReplyingTo(null)}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Reply className="h-5 w-5 text-primary" />
            Reply to Fellow
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted/50 rounded-2xl text-xs border border-muted">
            <p className="font-bold text-muted-foreground uppercase tracking-tighter mb-1">Context</p>
            <p className="italic">"{replyingTo?.message}"</p>
          </div>
          <div className="space-y-2">
            <Label>Your Message</Label>
            <Textarea 
              placeholder="Type your message to the fellow here..." 
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="min-h-[120px] rounded-2xl resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl">Cancel</Button>
          </DialogClose>
          <Button 
            className="rounded-xl px-8" 
            onClick={handleReply}
            disabled={!replyMessage.trim() || isSending}
          >
            {isSending ? <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send Reply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send New Notification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Recipient</Label>
            <Select value={targetRecipient} onValueChange={setTargetRecipient}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select recipient" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_fellows">All Fellows</SelectItem>
                <SelectItem value="all_program_managers">All Program Managers</SelectItem>
                {fellowsList.map(f => <SelectItem key={f._id} value={f._id}>{f.name} (Fellow)</SelectItem>)}
                {adminsList.map(a => <SelectItem key={a._id} value={a._id}>{a.name} (Program Manager)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              placeholder="e.g. Important Update" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea 
              placeholder="Type your message here..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[120px] rounded-2xl resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl">Cancel</Button>
          </DialogClose>
          <Button 
            className="rounded-xl px-8" 
            onClick={handleSendNotification}
            disabled={!newTitle.trim() || !newMessage.trim() || isCreating}
          >
            {isCreating ? <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Broadcast Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
  );
};

export default NotificationsPage;
