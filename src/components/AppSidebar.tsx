import React from "react";
import {
  LayoutDashboard, Building2, Users, GraduationCap, CalendarDays,
  ClipboardCheck, Award, ShieldCheck, Bus, BarChart3, Bell, LogOut, Music, MessageSquarePlus, BookHeart, HandHeart
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useProgram } from "@/contexts/ProgramContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "fellow", "mne_officer"] },
  { title: "Centres", url: "/centres", icon: Building2, roles: ["admin"] },
  { title: "Fellows", url: "/fellows", icon: Users, roles: ["admin"] },
  { title: "Donors", url: "/donors", icon: HandHeart, roles: ["admin"] },
  { title: "Students", url: "/students", icon: GraduationCap, roles: ["admin", "fellow"] },
  { title: "Sessions", url: "/sessions", icon: CalendarDays, roles: ["admin", "fellow"] },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck, roles: ["admin", "fellow"] },
  { title: "Assessments", url: "/assessments", icon: Award, roles: ["admin", "fellow", "mne_officer"] },
  { title: "Quality", url: "/quality", icon: ShieldCheck, roles: ["admin", "mne_officer"] },
  { title: "Bus Visits", url: "/field-visits", icon: Bus, roles: ["admin", "fellow", "mne_officer"] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["admin", "mne_officer"] },
  { title: "Notifications", url: "/notifications", icon: Bell, roles: ["admin", "fellow", "mne_officer"] },
  { title: "Feedback", url: "/feedback", icon: MessageSquarePlus, roles: ["admin", "fellow"] },
  { title: "Change Story", url: "/change-stories", icon: BookHeart, roles: ["admin", "fellow", "mne_officer"] },
  { title: "Managers", url: "/admins", icon: ShieldCheck, roles: ["admin", "program_director", "program_lead", "m_e_manager"] },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();
  const { model, isMid, canSwitch, setModel, terms } = useProgram();

  // On phones the sidebar is an overlay; close it once the user navigates
  React.useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location.pathname, isMobile, setOpenMobile]);

  const filteredItems = navItems.filter(item => {
    if (!user) return false;
    // Managers are added and edited only in High touch (admin accounts live there)
    if (isMid && item.url === "/admins") return false;
    // Donors page is for admins and directors, not program managers
    if (item.url === "/donors" && user.role === "program_manager") return false;
    if (item.roles.includes(user.role)) return true;
    if (item.roles.includes("admin") && ["program_director", "program_lead", "program_manager", "m_e_manager"].includes(user.role)) {
      return true;
    }
    return false;
  });

  return (
    <Sidebar collapsible="icon" className="glass-sidebar shadow-2xl transition-all duration-500">
      <SidebarHeader className="p-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/30 transition-all duration-500 hover:scale-110 hover:rotate-3">
            <Music className="h-6 w-6 text-primary-foreground stroke-[2.5]" />
          </div>
          {!collapsed && (
            <div className="animate-slide-in">
              <p className="text-lg font-[900] text-sidebar-foreground leading-none tracking-tighter">Manzil Mystics</p>
              <p className="text-[10px] uppercase font-black text-accent tracking-[0.2em] mt-1.5">LTM · {terms.programName}</p>
            </div>
          )}
        </div>
        {canSwitch && !collapsed && (
          <div role="radiogroup" aria-label="Program model" className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {([["high", "High Touch"], ["mid", "Mid Touch"]] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={model === value}
                onClick={() => model !== value && setModel(value)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${model === value ? (value === "mid" ? "bg-violet-600 text-white shadow" : "bg-background text-foreground shadow") : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {canSwitch && collapsed && (
          <button
            type="button"
            title={`Switch to ${isMid ? "High Touch" : "Mid Touch"}`}
            onClick={() => setModel(isMid ? "high" : "mid")}
            className={`mt-3 h-7 w-full rounded-lg text-[10px] font-black ${isMid ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"}`}
          >
            {isMid ? "MID" : "HIGH"}
          </button>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 text-sidebar-foreground/30 text-[10px] font-bold uppercase tracking-[0.2em]">
            {!collapsed && "Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url} 
                    className={`px-3 py-6 rounded-xl transition-all duration-300 group ${location.pathname === item.url ? 'sidebar-item-active' : 'hover:bg-primary/5 hover:translate-x-1'}`}
                  >
                    <NavLink to={item.url} end activeClassName="text-primary">
                      <item.icon className={`h-5 w-5 transition-all duration-300 ${location.pathname === item.url ? 'scale-110 text-primary' : 'group-hover:scale-110 group-hover:text-primary'}`} />
                      {!collapsed && <span className={`font-bold text-sm ${location.pathname === item.url ? 'text-primary' : 'text-sidebar-foreground'}`}>{item.url === "/fellows" ? terms.Fellows : item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>


      <SidebarFooter className="p-3">
        {!collapsed && user && (
          <div className="mb-2 px-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {user.role === 'm_e_manager' ? 'M&E Manager' : user.role === 'fellow' ? terms.Fellow : user.role === 'program_manager' && user.programModel === 'mid' ? 'Program Manager · Mid Touch' : user.role.replace(/_/g, " ")}
            </p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
