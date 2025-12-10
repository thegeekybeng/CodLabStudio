"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      // Check if EUA has been accepted (required for all users)
      const euaAccepted = sessionStorage.getItem("euaAccepted") === "true";
      
      if (!euaAccepted) {
        router.push("/eua");
        return;
      }

      // Check if in guest mode
      const isGuestMode = localStorage.getItem("guestMode") === "true";
      if (isGuestMode) {
        // Check if onboarding completed
        const onboardingCompleted = sessionStorage.getItem("onboardingCompleted") === "true";
        if (!onboardingCompleted) {
          router.push("/onboarding");
          return;
        }
        router.push("/dashboard");
        return;
      }

      // Check for authenticated user (admin)
      try {
        await authApi.getCurrentUser();
        router.push("/dashboard");
      } catch {
        // Admin login still available
        router.push("/login");
      }
    };

    checkAccess();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </main>
  );
}
