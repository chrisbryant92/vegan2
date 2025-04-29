import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if logged in
    if (user) {
      navigate("/");
    } else {
      navigate("/auth");
    }
  }, [user, navigate]);

  return null; // This page just redirects, no need to render anything
}
