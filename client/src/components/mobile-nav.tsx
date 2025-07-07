import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  HandHeart,
  Leaf,
  Share2,
  Megaphone,
  Home,
  LogOut,
  Menu,
  Briefcase,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems = [
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
    {
      label: "Pro Bono Work",
      href: "/pro-bono",
      icon: <Briefcase className="h-5 w-5" />,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
    setOpen(false);
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
    <>
      {/* Top bar */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2 bg-primary text-primary-foreground">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-bold text-primary">Animal Impact</h1>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
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
            
            <nav className="p-4">
              <div className="space-y-3">
                {navItems.map((item) => (
                  <div key={item.href}>
                    <Link href={item.href}>
                      <div
                        className={cn(
                          "flex items-center p-2 rounded-md hover:bg-indigo-50 text-gray-700 hover:text-primary cursor-pointer",
                          location === item.href && "bg-indigo-50 text-primary"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <div className="w-6">{item.icon}</div>
                        <span className="ml-2">{item.label}</span>
                      </div>
                    </Link>
                  </div>
                ))}
                
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
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Bottom navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-4">
          {navItems.slice(0, 4).map((item) => (
            <div key={item.href}>
              <Link href={item.href}>
                <div className={cn(
                  "flex flex-col items-center py-2 text-gray-500 hover:text-primary cursor-pointer",
                  location === item.href && "text-primary"
                )}>
                  {item.icon}
                  <span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
