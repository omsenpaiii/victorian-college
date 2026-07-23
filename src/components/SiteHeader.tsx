"use client";

import { useEffect, useState } from "react";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";

type HeaderUser = {
  name: string;
  email: string;
  initials: string;
  dashboardHref: string;
};

export function SiteHeader() {
  const [user, setUser] = useState<HeaderUser | null>(null);

  useEffect(() => {
    const readUser = async () => {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = (await response.json()) as { user?: HeaderUser | null };
      setUser(data.user ?? null);
    };

    void readUser();
  }, []);

  return <SiteHeaderClient user={user} />;
}
