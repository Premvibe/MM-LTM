import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { MessageSquarePlus, Star, Trash2, Smartphone, Music, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Feedback = {
  _id: string;
  fellowId: { _id: string; name: string; email: string };
  date: string;
  sessionRating: number;
  appRating: number;
  comments: string;
};

const FeedbackPage = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [open, setOpen] = useState(false);
  const [sessionRating, setSessionRating] = useState(0);
  const [appRating, setAppRating] = useState(0);
  const [comments, setComments] = useState("");

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const params = user?.role === 'fellow' 
        ? `?role=fellow&email=${user.email}` 
        : user?.role === 'program_manager' 
          ? `?role=program_manager&email=${user.email}` 
          : '';
      const res = await api.get(`/feedback${params}`);
      setFeedbacks(res.data);
    } catch (error) {
      toast.error("Failed to load feedback");
    }
  };

  const handleSubmit = async () => {
    if (!sessionRating || !appRating || !comments.trim()) {
      toast.error("Please fill in all fields and provide ratings");
      return;
    }
    try {
      await api.post('/feedback', {
        fellowId: user?.id,
        sessionRating,
        appRating,
        comments: comments.trim()
      });
      toast.success("Feedback submitted successfully. Thank you!");
      setOpen(false);
      setSessionRating(0);
      setAppRating(0);
      setComments("");
      fetchFeedbacks();
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/feedback/${id}`);
      toast.success("Feedback deleted");
      fetchFeedbacks();
    } catch (error) {
      toast.error("Failed to delete feedback");
    }
  };

  const renderStars = (rating: number, setRating?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer transition-colors ${star <= rating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/30"}`}
            onClick={() => setRating && setRating(star)}
          />
        ))}
      </div>
    );
  };

  const avgApp = feedbacks.length ? (feedbacks.reduce((sum, f) => sum + f.appRating, 0) / feedbacks.length).toFixed(1) : "0.0";
  const avgSession = feedbacks.length ? (feedbacks.reduce((sum, f) => sum + f.sessionRating, 0) / feedbacks.length).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-foreground">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-[1000] tracking-tighter">Feedback & Insights</h1>
          <p className="text-muted-foreground font-black tracking-widest uppercase text-[10px] mt-2">Help us improve the sessions and the app</p>
        </div>

        {user?.role === 'fellow' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                <MessageSquarePlus className="h-4 w-4 mr-2" /> Share Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden sm:max-w-[500px]">
              <div className="bg-primary p-8 text-white">
                <DialogTitle className="text-2xl font-black tracking-tight">Share Your Experience</DialogTitle>
                <p className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">Your voice matters</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3 bg-muted/20 p-5 rounded-2xl border border-muted/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rate the Session Experience</p>
                  {renderStars(sessionRating, setSessionRating)}
                </div>
                <div className="space-y-3 bg-muted/20 p-5 rounded-2xl border border-muted/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rate the Connect App</p>
                  {renderStars(appRating, setAppRating)}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Additional Comments</p>
                  <Textarea 
                    placeholder="Tell us what went well, or what could be improved..." 
                    value={comments} 
                    onChange={e => setComments(e.target.value)}
                    className="rounded-2xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all min-h-[120px] resize-none"
                  />
                </div>
              </div>
              <div className="p-8 bg-muted/30 border-t flex justify-end gap-3">
                <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Cancel</Button></DialogClose>
                <Button onClick={handleSubmit} className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px]">Submit</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-white/60 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-orange-500/10"><Smartphone className="h-4 w-4 text-orange-500" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">App Rating</span>
              </div>
              <div className="flex items-end gap-2 mt-4">
                <span className="text-4xl font-[1000] tracking-tighter">{avgApp}</span>
                <span className="text-sm font-bold text-muted-foreground mb-1">/ 5.0</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white/60 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-blue-500/10"><Music className="h-4 w-4 text-blue-500" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Rating</span>
              </div>
              <div className="flex items-end gap-2 mt-4">
                <span className="text-4xl font-[1000] tracking-tighter">{avgSession}</span>
                <span className="text-sm font-bold text-muted-foreground mb-1">/ 5.0</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white/60 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10"><TrendingUp className="h-4 w-4 text-primary" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Responses</span>
              </div>
              <div className="flex items-end gap-2 mt-4">
                <span className="text-4xl font-[1000] tracking-tighter">{feedbacks.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feedbacks.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <MessageSquarePlus className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm font-bold text-muted-foreground">No feedback received yet.</p>
          </div>
        ) : (
          feedbacks.map((f) => (
            <Card key={f._id} className="border-none shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase">
                      {f.fellowId?.name?.substring(0, 2) || "??"}
                    </div>
                    <div>
                      <h4 className="font-black text-sm">{f.fellowId?.name || "Unknown"}</h4>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{new Date(f.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(f._id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center bg-muted/20 rounded-xl p-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`h-3 w-3 ${star <= f.sessionRating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-muted/20 rounded-xl p-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connect App</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`h-3 w-3 ${star <= f.appRating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">"{f.comments}"</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
