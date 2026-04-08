import {
  LayoutDashboard, Building2, Users, GraduationCap, CalendarDays,
  ClipboardCheck, Award, ShieldCheck, MapPin, BarChart3, Bell, LogOut, Music
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
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
  { title: "Students", url: "/students", icon: GraduationCap, roles: ["admin", "fellow"] },
  { title: "Sessions", url: "/sessions", icon: CalendarDays, roles: ["admin", "fellow"] },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck, roles: ["admin", "fellow"] },
  { title: "Assessments", url: "/assessments", icon: Award, roles: ["admin", "fellow", "mne_officer"] },
  { title: "Quality", url: "/quality", icon: ShieldCheck, roles: ["admin", "mne_officer"] },
  { title: "Field Visits", url: "/field-visits", icon: MapPin, roles: ["admin", "mne_officer"] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["admin", "mne_officer"] },
  { title: "Notifications", url: "/notifications", icon: Bell, roles: ["admin", "fellow", "mne_officer"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Music className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-slide-in">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight">Manzil Mystics</p>
              <p className="text-xs text-sidebar-foreground/70">LTM Program</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role.replace("_", " ")}</p>
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
