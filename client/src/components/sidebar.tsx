import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  HandHeart,
  Leaf,
  Share2,
  Megaphone,
  Home,
  LogOut,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "Charitable Donations",
      href: "/donations",
      icon: <HandHeart className="h-5 w-5" />,
    },
    {
      label: "Vegan Conversions",
      href: "/vegan-conversions",
      icon: <Leaf className="h-5 w-5" />,
    },
    {
      label: "Media Shared",
      href: "/media-shared",
      icon: <Share2 className="h-5 w-5" />,
    },
    {
      label: "Online Campaigns",
      href: "/campaigns",
      icon: <Megaphone className="h-5 w-5" />,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className="hidden md:flex md:w-64 bg-white shadow-lg flex-shrink-0 flex-col h-screen">
      <div className="p-4 border-b flex items-center">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-primary">Animal Impact</h1>
        </div>
      </div>

      <div className="p-4 border-b">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.username}</p>
          </div>
        </div>
      </div>

      <nav className="p-4 flex-grow">
        <div className="space-y-1">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex items-center p-2 rounded-md hover:bg-indigo-50 text-gray-700 hover:text-primary cursor-pointer",
                    location === item.href && "bg-indigo-50 text-primary"
                  )}
                >
                  <div className="w-6">{item.icon}</div>
                  <span className="ml-2">{item.label}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-2" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
