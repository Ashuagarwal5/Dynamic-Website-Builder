import {
  LayoutDashboard,
  Globe,
  PanelsTopLeft,
  Images,
  Settings,
} from "lucide-react";
export const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Websites", href: "/dashboard/websites", icon: Globe },
  { label: "Templates", icon: PanelsTopLeft },
  { label: "Media Library", icon: Images },
  { label: "Settings", icon: Settings },
];
export function pageLabel(path) {
  if (path === "/dashboard/websites/new") return "Create website";
  if (/^\/dashboard\/websites\/[^/]+\/settings$/.test(path))
    return "Website settings";
  if (path.startsWith("/dashboard/sites/")) return "Website editor";
  return (
    navigation.find((item) => item.href === path)?.label || "Page not found"
  );
}
