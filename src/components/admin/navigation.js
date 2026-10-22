import {
  LayoutDashboard,
  Globe,
  PanelsTopLeft,
  Images,
  Settings,
  Building2,
} from "lucide-react";
export const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Websites", href: "/dashboard/websites", icon: Globe },
  { label: "Branches", href: "/dashboard/tenants", icon: Building2 },
  { label: "Templates", href: "/dashboard/templates", icon: PanelsTopLeft },
  // { label: "Media Library", icon: Images },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];
export function pageLabel(path) {
  if (/^\/dashboard\/websites\/[^/]+\/pages$/.test(path)) return "Website pages";
  if (path === "/dashboard/tenants/new") return "Create branch";
  if (path === "/dashboard/profile") return "Your profile";
  if (path === "/dashboard/websites/new") return "Create website";
  if (/^\/dashboard\/websites\/[^/]+\/settings$/.test(path))
    return "Website settings";
  if (path.startsWith("/dashboard/sites/")) return "Website editor";
  return (
    navigation.find((item) => item.href === path)?.label || "Page not found"
  );
}
