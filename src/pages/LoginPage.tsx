import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message || "Invalid email or password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast({ title: "Request Sent", description: "A password reset request has been sent to the Admin." });
      setIsForgotPassword(false);
    } catch {
      toast({ title: "Error", description: "Failed to send reset request", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background p-6">
      <div className="w-full max-w-[450px] animate-fade-in">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primary/60 shadow-2xl shadow-primary/30 mb-6 transition-transform hover:scale-105 duration-500">
            <Music className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter mb-2">Manzil Mystics</h1>
          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-primary/30"></span>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.3em]">Learning Through Music</p>
            <span className="h-px w-8 bg-primary/30"></span>
          </div>
        </div>

        <Card className="glass-card overflow-hidden rounded-[2rem] border-white/40 shadow-2xl">
          <CardHeader className="pt-10 pb-6 px-10">
            <CardTitle className="text-2xl font-black tracking-tight">{isForgotPassword ? "Reset Password" : "Welcome Back"}</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              {isForgotPassword ? "Enter your email to send a password reset request to the Admin" : "Please enter your credentials to access the M&E System"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10">
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="name@manzil.org" 
                    className="h-12 bg-white/50 border-white/50 focus:bg-white transition-all rounded-xl"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]" disabled={loading}>
                    {loading ? "Sending Request..." : "Send Request to Admin"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setIsForgotPassword(false)} className="w-full h-12 text-xs font-bold rounded-xl" disabled={loading}>
                    Back to Login
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@manzil.org" 
                    className="h-12 bg-white/50 border-white/50 focus:bg-white transition-all rounded-xl"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1 mb-1">
                    <Label htmlFor="password" title="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Secure Password</Label>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline bg-transparent border-none p-0 cursor-pointer">
                      Forgot Password?
                    </button>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-12 bg-white/50 border-white/50 focus:bg-white transition-all rounded-xl"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]" disabled={loading}>
                  {loading ? "Verifying Identity..." : "Sign In to Dashboard"}
                </Button>
              </form>
            )}



          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
          &copy; 2026 Manzil Mystics Foundation • All Rights Reserved
        </p>
      </div>
    </div>

  );
};

export default LoginPage;
