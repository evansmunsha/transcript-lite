"use client";

import { useEffect, useState } from "react";

type AdSlotProps = {
  slot: string;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({ slot, className }: AdSlotProps) {
  const [isOnline, setIsOnline] = useState(true);
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return;
    }
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
    }
    try {
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn("AdSense push failed", error);
    }
  }, [isOnline, slot]);

  if (!clientId || !slot) {
    return null;
  }

  if (!isOnline) {
    return (
      <div
        className={`rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ${className ?? ""}`}
      >
        Ads unavailable offline.
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white px-4 py-3 ${className ?? ""}`}
      aria-label="Advertisement"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
