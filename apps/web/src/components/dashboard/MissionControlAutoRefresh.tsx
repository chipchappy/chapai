"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MissionControlAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Guild Dashboard - ChapAI";

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
