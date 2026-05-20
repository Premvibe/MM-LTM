import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Shield, Camera, Save, LogOut, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

const ProfilePage = () => {
  const { user, logout, updateProfile, isAdmin } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role] = useState(user?.role || "");
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    
    try {
      setIsSaving(true);
      const res = await api.put("/auth/update-profile", {
        id: user?.id,
        name,
        email,
        phone,
        ...(password ? { password, oldPassword } : {})
      });
      updateProfile(res.data);
      setOldPassword("");
      setPassword("");
      setConfirmPassword("");
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestUpdate = async () => {
    try {
      setIsSaving(true);
      await api.post("/auth/request-profile-update", {
        fellowId: user?.id,
        requestedChanges: { name, email, phone }
      });
      toast.success("Profile update request sent to admin!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title text-2xl md:text-4xl">My Profile</h1>
        <p className="page-description text-sm md:text-lg">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <Card className="md:col-span-1 glass-card-premium border-none shadow-2xl">
          <CardContent className="pt-10 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-3xl bg-gradient-to-tr from-primary to-primary/40 p-1 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                <div className="h-full w-full rounded-[1.4rem] bg-white flex items-center justify-center text-3xl md:text-4xl font-black text-primary">
                  {name.charAt(0).toUpperCase()}
                </div>
              </div>
              <button className="absolute bottom-1 right-1 h-10 w-10 bg-white rounded-xl shadow-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-primary/10">
                <Camera className="h-5 w-5" />
              </button>
            </div>
            <h2 className="mt-6 text-xl font-black tracking-tight">{name}</h2>
            <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1">{role}</p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />
            <Button variant="ghost" onClick={logout} className="w-full text-destructive hover:bg-destructive/10 font-bold gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 glass-card-premium border-none shadow-2xl">
          <CardHeader className="border-b border-gray-100/50 pb-6">
            <CardTitle className="text-xl font-black">Personal Information</CardTitle>
            <CardDescription className="font-medium text-muted-foreground/70 text-sm">Update your personal details and how others see you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Full Name</Label>
                <div className="relative group">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isAdmin ? "text-muted-foreground group-focus-within:text-primary transition-colors" : "text-muted-foreground"}`} />
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    readOnly={!isAdmin}
                    className={`pl-12 h-12 md:h-14 bg-gray-50/50 border-gray-100 rounded-2xl text-sm md:text-base font-semibold ${!isAdmin ? "opacity-60 cursor-not-allowed" : "focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isAdmin ? "text-muted-foreground group-focus-within:text-primary transition-colors" : "text-muted-foreground"}`} />
                  <Input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!isAdmin} 
                    className={`pl-12 h-12 md:h-14 bg-gray-50/50 border-gray-100 rounded-2xl text-sm md:text-base font-semibold ${!isAdmin ? "opacity-60 cursor-not-allowed" : "focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Phone Number</Label>
                <div className="relative group">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isAdmin ? "text-muted-foreground group-focus-within:text-primary transition-colors" : "text-muted-foreground"}`} />
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    readOnly={!isAdmin}
                    className={`pl-12 h-12 md:h-14 bg-gray-50/50 border-gray-100 rounded-2xl text-sm md:text-base font-semibold ${!isAdmin ? "opacity-60 cursor-not-allowed" : "focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"}`}
                  />
                </div>
              </div>

              {!isAdmin && (
                <div className="pt-2 pb-4">
                  <Button onClick={handleRequestUpdate} disabled={isSaving} variant="outline" className="w-full h-12 rounded-xl text-primary font-bold border-primary/20 hover:bg-primary/5">
                    Request Admin to Update Profile Details
                  </Button>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-gray-100/50">
                  <h3 className="text-sm font-black tracking-tight text-foreground">Change Password</h3>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Current Password</Label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        type="password"
                        placeholder="Required if changing password"
                        value={oldPassword} 
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="pl-12 h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-semibold"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">New Password</Label>
                      <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          type="password"
                          placeholder="New password"
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 h-12 md:h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm md:text-base font-semibold"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Confirm New Password</Label>
                      <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          type="password"
                          placeholder="Re-enter new password"
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-12 h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Role / Designation</Label>
                <div className="relative opacity-60">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    value={role} 
                    readOnly 
                    className="pl-12 h-14 bg-gray-50/50 border-gray-100 rounded-2xl cursor-not-allowed capitalize text-base font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto h-12 md:h-14 px-8 md:px-10 rounded-2xl shadow-xl shadow-primary/20 gap-2 font-black text-sm md:text-base transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Save className="h-5 w-5" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
