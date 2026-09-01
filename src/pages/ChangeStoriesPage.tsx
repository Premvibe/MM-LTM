import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ArrowLeft, Search, Building2, MapPin, BookHeart, Plus, CheckCircle2, Clock, AlertTriangle, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FileUpload, DriveFile } from "@/components/ui/file-upload";
import { FileGallery } from "@/components/ui/file-gallery";

type Centre = { _id: string; id: string; name: string; location: string; type: "In-school" | "After-school"; fellowIds: string[]; studentCount: number };
type Fellow = { _id: string; id: string; name: string; email: string };
type ChangeStory = {
  _id: string;
  centreId: string;
  fellowId: string;
  month: number;
  year: number;
  studentName: string;
  title: string;
  story: string;
  status: "pending" | "approved" | "revision_needed";
  reviewedBy: string;
  reviewComment: string;
  files?: Array<{ fileId: string; fileName: string; fileUrl: string; mimeType?: string; thumbnailLink?: string }>;
  createdAt?: string;
};

const formatDateDMY = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const months = [
  { value: "0", label: "January" }, { value: "1", label: "February" }, { value: "2", label: "March" },
  { value: "3", label: "April" }, { value: "4", label: "May" }, { value: "5", label: "June" },
  { value: "6", label: "July" }, { value: "7", label: "August" }, { value: "8", label: "September" },
  { value: "9", label: "October" }, { value: "10", label: "November" }, { value: "11", label: "December" },
];
const years = ["2024", "2025", "2026"];

const statusConfig = {
  pending: { label: "Pending Review", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  approved: { label: "Approved", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  revision_needed: { label: "Revision Needed", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
};

const ChangeStoriesPage = () => {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCentreId = searchParams.get("centre");
  const setSelectedCentreId = (id: string | null) => {
    if (id) setSearchParams({ centre: id });
    else setSearchParams({});
  };

  const [centres, setCentres] = useState<Centre[]>([]);
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [stories, setStories] = useState<ChangeStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<ChangeStory | null>(null);
  const [title, setTitle] = useState("");
  const [studentName, setStudentName] = useState("");
  const [storyText, setStoryText] = useState("");
  const [storyFiles, setStoryFiles] = useState<DriveFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewingStory, setReviewingStory] = useState<ChangeStory | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  // View state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState<ChangeStory | null>(null);

  const getRoleParams = () => {
    if (user?.role === "fellow") return `?role=fellow&email=${user.email}`;
    if (user?.role === "program_manager") return `?role=program_manager&email=${user.email}`;
    return "";
  };

  const fetchData = async () => {
    try {
      const params = getRoleParams();
      const paramsQuery = user?.role === "fellow"
        ? `?role=fellow&email=${user.email}`
        : user?.role === "program_manager"
          ? `?role=program_manager&email=${user.email}`
          : "";
      const [storiesRes, centresRes, fellowsRes] = await Promise.all([
        api.get(`/change-stories${params}`),
        api.get(`/centres${paramsQuery}`),
        api.get(`/fellows${paramsQuery}`),
      ]);
      setStories(storiesRes.data);
      setCentres(centresRes.data);
      setFellows(fellowsRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedCentre = useMemo(() => centres.find(c => (c._id || c.id) === selectedCentreId), [centres, selectedCentreId]);

  const centreStory = useMemo(() => {
    if (!selectedCentreId) return null;
    return stories.find(s =>
      s.centreId === selectedCentreId &&
      s.month === parseInt(filterMonth) &&
      s.year === parseInt(filterYear)
    ) || null;
  }, [stories, selectedCentreId, filterMonth, filterYear]);

  const resetForm = () => {
    setTitle("");
    setStudentName("");
    setStoryText("");
    setStoryFiles([]);
    setEditingStory(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !storyText.trim()) {
      toast.error("Title and Story are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        centreId: selectedCentreId,
        fellowId: user?.id || (user as any)?._id || "",
        month: parseInt(filterMonth),
        year: parseInt(filterYear),
        studentName,
        title,
        story: storyText,
        files: storyFiles
      };
      if (editingStory) {
        await api.put(`/change-stories/${editingStory._id}`, payload);
        toast.success("Change story updated");
      } else {
        await api.post("/change-stories", payload);
        toast.success("Change story submitted");
      }
      setFormOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save story");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this change story?")) return;
    try {
      await api.delete(`/change-stories/${id}`);
      toast.success("Story deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleReview = async (status: "approved" | "revision_needed") => {
    if (!reviewingStory) return;
    try {
      await api.put(`/change-stories/${reviewingStory._id}`, {
        status,
        reviewedBy: user?.name || user?.email || "Admin",
        reviewComment,
      });
      toast.success(status === "approved" ? "Story approved!" : "Revision requested");
      setReviewOpen(false);
      setReviewingStory(null);
      setReviewComment("");
      fetchData();
    } catch {
      toast.error("Failed to update review");
    }
  };

  const openEdit = (story: ChangeStory) => {
    setEditingStory(story);
    setTitle(story.title);
    setStudentName(story.studentName);
    setStoryText(story.story);
    setStoryFiles(story.files || []);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ───────── MAIN: Centre grid ─────────
  if (!selectedCentreId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Change Stories</h1>
            <p className="page-description uppercase tracking-[0.2em] text-[10px]">Monthly impact stories from each centre</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 bg-white/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-lg">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/5 text-primary">
              <BookHeart className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Period</span>
            </div>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[120px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {months.map(m => <SelectItem key={m.value} value={m.value} className="rounded-lg text-xs font-medium">{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[85px] h-9 rounded-xl bg-white/60 border-none shadow-sm text-xs font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                {years.map(y => <SelectItem key={y} value={y} className="rounded-lg text-xs font-medium">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
          <Input
            placeholder="Search centres..."
            className="pl-10 h-10 rounded-xl border-none shadow-sm bg-white/60 font-bold text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {centres
            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(centre => {
              const cId = centre._id || centre.id;
              const story = stories.find(s => s.centreId === cId && s.month === parseInt(filterMonth) && s.year === parseInt(filterYear));
              const sc = story ? statusConfig[story.status] : null;

              return (
                <Card
                  key={cId}
                  className="glass-card-premium border-none hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => setSelectedCentreId(cId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-black tracking-tight">{centre.name}</CardTitle>
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <MapPin className="h-3 w-3" />{centre.location}
                          </div>
                        </div>
                      </div>
                      <Badge variant={centre.type === "In-school" ? "default" : "secondary"} className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest h-fit">{centre.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border-t border-primary/5 pt-4">
                      {story ? (
                        <div className="flex items-center gap-2">
                          {sc && <sc.icon className="h-4 w-4" />}
                          <Badge className={`${sc?.color} border rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest`}>{sc?.label}</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground ml-auto truncate max-w-[120px]">{story.title}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground/60">
                          <BookHeart className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">No story this month</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    );
  }

  // ───────── INNER: Centre detail view ─────────
  const centreStories = stories.filter(s => s.centreId === selectedCentreId && s.month === parseInt(filterMonth) && s.year === parseInt(filterYear));
  const isFellow = user?.role === "fellow";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCentreId(null)} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm border border-transparent hover:border-primary/20 hover:text-primary transition-all shrink-0">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-3xl font-[950] tracking-tighter text-foreground">{selectedCentre?.name}</h1>
            <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] flex items-center gap-2 mt-1">
              Change Story · {months.find(m => m.value === filterMonth)?.label} {filterYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="h-11 rounded-xl border-none shadow-lg bg-white font-bold text-xs w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="h-11 rounded-xl border-none shadow-lg bg-white font-bold text-xs w-[90px]"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Story content list */}
      {centreStories.length > 0 ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            {(isFellow || isAdmin) && (
              <Button className="rounded-xl h-10 px-5 font-black uppercase tracking-widest text-[10px] shadow-sm" onClick={() => { resetForm(); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Another Story
              </Button>
            )}
          </div>
          {centreStories.map(story => {
            const fellowName = fellows.find(f => f._id === story.fellowId || f.id === story.fellowId)?.name;
            const sc = statusConfig[story.status];
            return (
              <Card key={story._id} className="border-none shadow-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                  {/* Story header */}
                  <div className="p-8 border-b border-muted/50">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${sc.color} border rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1`}>
                            <sc.icon className="h-3 w-3" />{sc.label}
                          </Badge>
                          {story.createdAt && (
                            <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-muted-foreground/10 rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                              Submitted: {formatDateDMY(story.createdAt)}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-2xl font-[950] tracking-tight">{story.title}</h2>
                        {story.studentName && (
                          <p className="text-sm font-bold text-muted-foreground">Student: <span className="text-foreground">{story.studentName}</span></p>
                        )}
                        {fellowName && (
                          <p className="text-xs font-bold text-muted-foreground">By: {fellowName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(isFellow || isAdmin) && (story.status !== "approved") && (
                          <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs" onClick={() => openEdit(story)}>
                            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(story._id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                          </Button>
                        )}
                        {isAdmin && story.status === "pending" && (
                          <Button size="sm" className="rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={() => { setReviewingStory(story); setReviewComment(""); setReviewOpen(true); }}>
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Story body */}
                  <div className="p-8 space-y-6">
                    <div className="prose prose-sm max-w-none text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                      {story.story}
                    </div>

                    {story.files && story.files.length > 0 && (
                      <FileGallery files={story.files} title="Media & Attachments" />
                    )}
                  </div>

                  {/* Review info */}
                  {story.reviewedBy && (
                    <div className="px-8 pb-8">
                      <div className="bg-muted/30 rounded-xl p-4 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Review by {story.reviewedBy}</p>
                        {story.reviewComment && <p className="text-sm font-medium text-muted-foreground italic">"{story.reviewComment}"</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-none shadow-sm bg-white/40 rounded-[2rem] p-20 text-center border-2 border-dashed">
          <BookHeart className="h-16 w-16 text-muted-foreground mx-auto opacity-10 mb-4" />
          <p className="text-sm font-bold text-muted-foreground">No change story for {months.find(m => m.value === filterMonth)?.label} {filterYear}</p>
          {(isFellow || isAdmin) && (
            <Button className="mt-4 rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px] shadow-md" onClick={() => { resetForm(); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Change Story
            </Button>
          )}
        </Card>
      )}

      {/* ───────── Write/Edit Dialog ───────── */}
      <Dialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-lg">
          <div className="bg-primary p-6 md:p-8 text-white">
            <DialogTitle className="text-2xl font-black tracking-tight">{editingStory ? "Edit Change Story" : "Write Change Story"}</DialogTitle>
            <DialogDescription className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">{selectedCentre?.name} · {months.find(m => m.value === filterMonth)?.label} {filterYear}</DialogDescription>
          </div>
          <div className="p-6 md:p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Story Title *</Label>
              <Input placeholder="e.g. Ravi's Musical Breakthrough" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Student Name (optional)</Label>
              <Input placeholder="Name of the student this story is about" value={studentName} onChange={e => setStudentName(e.target.value)} className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Change Story *</Label>
              <Textarea placeholder="Write the change story here..." value={storyText} onChange={e => setStoryText(e.target.value)} className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all min-h-[180px] resize-y" />
            </div>
            <FileUpload
              files={storyFiles}
              onFilesChange={setStoryFiles}
              centreId={selectedCentreId || undefined}
              centreName={selectedCentre?.name}
              context="ChangeStories"
              monthYear={`${months.find(m => m.value === filterMonth)?.label} ${filterYear}`}
              label="Attach Photos / Videos / Documents"
              maxFiles={5}
            />
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-3">
            <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Cancel</Button></DialogClose>
            <Button className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px]" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingStory ? "Update Story" : "Submit Story"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────── Review Dialog ───────── */}
      <Dialog open={reviewOpen} onOpenChange={(v) => { setReviewOpen(v); if (!v) { setReviewingStory(null); setReviewComment(""); } }}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-lg">
          <div className="bg-primary p-6 md:p-8 text-white">
            <DialogTitle className="text-2xl font-black tracking-tight">Review Change Story</DialogTitle>
            <DialogDescription className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">{reviewingStory?.title}</DialogDescription>
          </div>
          <div className="p-6 md:p-8 space-y-5">
            <div className="bg-muted/30 rounded-xl p-4 max-h-[200px] overflow-y-auto">
              <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{reviewingStory?.story}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Review Comment (optional)</Label>
              <Textarea placeholder="Add feedback or comments..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="rounded-xl border-muted-foreground/10 bg-muted/30 focus:bg-white transition-all min-h-[80px] resize-y" />
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-3">
            <DialogClose asChild><Button variant="ghost" className="rounded-xl font-bold">Cancel</Button></DialogClose>
            <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleReview("revision_needed")}>
              Request Revision
            </Button>
            <Button className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] bg-success hover:bg-success/90 text-white" onClick={() => handleReview("approved")}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChangeStoriesPage;
