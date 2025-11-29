import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Factory,
  Settings,
  Package,
  ShoppingCart,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// ✅ Menü öğeleri
interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: any; // Lucide icon tipi
}

const menuItems: MenuItem[] = [
  { id: 0, name: "Dashboard", path: "/", icon: LayoutDashboard },
  { id: 1, name: "Yeni Üretim", path: "/yeni-uretim", icon: Factory },
  { id: 2, name: "Üretim", path: "/uretim", icon: Factory },
  { id: 3, name: "Makine", path: "/makine", icon: Settings },
  { id: 4, name: "Stoklar", path: "/stoklar", icon: Package },
  { id: 5, name: "Siparişler", path: "/siparisler", icon: ShoppingCart },
  { id: 6, name: "Finansal Özet", path: "/finansal", icon: DollarSign },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border bg-gradient-to-b from-[#0A1128] to-[#0D1533]">
      <SidebarContent>
        <SidebarGroup className="pt-6">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-full mx-3 transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-glow"
                            : "text-sidebar-foreground hover:bg-sidebar-border hover:shadow-[0_0_10px_rgba(93,199,243,0.2)]"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {open && <span>{item.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
