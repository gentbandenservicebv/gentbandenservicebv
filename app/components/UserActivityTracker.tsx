"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STORAGE_KEY = "gent_banden_cookies_v2";

function TrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const prevPathRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const initialReferrerRef = useRef<string>("");

  useEffect(() => {
    if (typeof document !== "undefined") {
      initialReferrerRef.current = document.referrer || "";
    }
  }, []);

  useEffect(() => {
    // 1. Respect cookie consent if user explicitly declined
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (consent === "declined") {
        return;
      }
    } catch {
      // Ignore localStorage access restrictions
    }

    const fullPath = searchParams && searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Skip internal admin/api routes if needed or unwanted
    if (fullPath.startsWith("/api") || fullPath.startsWith("/_next")) {
      return;
    }

    const now = Date.now();
    const durationSpent = prevPathRef.current
      ? Math.max(0, Math.round((now - startTimeRef.current) / 1000))
      : 0;

    const prevPath = prevPathRef.current;
    prevPathRef.current = fullPath;
    startTimeRef.current = now;

    // Small delay to let document.title update after client-side navigation
    const timer = setTimeout(() => {
      const pageTitle = typeof document !== "undefined" ? document.title : "";
      const referrer = prevPath
        ? `${window.location.origin}${prevPath}`
        : initialReferrerRef.current;

      const payload = {
        path: fullPath,
        title: pageTitle,
        referrer,
        previousPath: prevPath || "",
        duration: durationSpent,
        isHeartbeat: false,
      };

      try {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Suppress network errors
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Track page unload or tab hidden to save reading duration
  useEffect(() => {
    const handleVisibilityOrLeave = () => {
      try {
        const consent = localStorage.getItem(STORAGE_KEY);
        if (consent === "declined") return;
      } catch {}

      if (!prevPathRef.current) return;

      const duration = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
      if (duration < 1) return;

      const payload = JSON.stringify({
        path: prevPathRef.current,
        duration,
        isHeartbeat: true,
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track", blob);
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleVisibilityOrLeave();
      } else if (document.visibilityState === "visible") {
        startTimeRef.current = Date.now();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleVisibilityOrLeave);

    // If user clicks accept on cookie banner, trigger immediate sync
    const handleConsentUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "accepted") {
        const fullPath = searchParams && searchParams.toString()
          ? `${pathname}?${searchParams.toString()}`
          : pathname;

        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: fullPath,
            title: document.title,
            referrer: initialReferrerRef.current,
            duration: 0,
            isHeartbeat: false,
          }),
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("cookie-consent-updated", handleConsentUpdated);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleVisibilityOrLeave);
      window.removeEventListener("cookie-consent-updated", handleConsentUpdated);
    };
  }, [pathname, searchParams]);

  return null;
}

export default function UserActivityTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerContent />
    </Suspense>
  );
}
