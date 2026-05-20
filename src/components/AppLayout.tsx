import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { Bell, User as UserIcon, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/notifications/unread-count?role=${user.role}`);
        setUnreadCount(res.data.count);
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 md:h-24 flex items-center justify-between border-b border-gray-100 bg-white/70 backdrop-blur-2xl px-4 md:px-10 shrink-0 z-10 sticky top-0 shadow-[0_1px_15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 md:gap-6">
              <SidebarTrigger className="hover:bg-primary/5 transition-all h-10 w-10 md:h-12 md:w-12 rounded-2xl" />
              <div className="flex flex-col">
                <span className="text-lg md:text-2xl font-[900] text-foreground tracking-tighter leading-none hidden sm:inline">
                  Learning Through Music
                </span>
                <span className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mt-1.5 hidden sm:inline">
                  M&E System — Manzil Mystics
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <Button variant="ghost" size="icon" onClick={() => navigate("/notifications")} className="relative h-10 w-10 md:h-12 md:w-12 bg-gray-50 border border-gray-100 rounded-2xl transition-all hover:bg-white hover:shadow-lg active:scale-95 group">
                <Bell className="h-5 w-5 text-gray-600 group-hover:text-primary transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-lg bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white animate-in zoom-in">
                    {unreadCount}
                  </span>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/40 p-[1.5px] shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-500 cursor-pointer group">
                    <div className="h-full w-full rounded-[0.9rem] bg-white flex items-center justify-center ring-2 ring-white/50 group-hover:ring-primary/20 transition-all">
                      <span className="text-sm font-black text-primary uppercase">
                        {user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-3 rounded-3xl shadow-2xl border-none glass-card-premium mt-2" align="end">
                  <DropdownMenuLabel className="p-4 pt-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-black leading-none text-foreground">{user?.name}</p>
                      <p className="text-[10px] font-bold leading-none text-muted-foreground uppercase tracking-widest mt-1">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100/50 my-2" />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/5 group transition-all">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm">Edit Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/5 group transition-all">
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                      <Settings className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm">Preferences</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100/50 my-2" />
                  <DropdownMenuItem onClick={logout} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-destructive/10 group transition-all text-destructive">
                    <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive group-hover:text-white transition-all">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
