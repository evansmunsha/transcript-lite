"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallButtonProps = {
  className?: string;
  label?: string;
};

const isStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone;

const INSTALL_FLAG_KEY = "transcript-lite-installed";

export default function InstallButton({
  className = "",
  label = "Download app",
}: InstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      setShowHelp(false);
      try {
        window.localStorage.setItem(INSTALL_FLAG_KEY, "true");
      } catch {
        // ignore storage errors
      }
    };

    let alreadyInstalled = false;
    try {
      alreadyInstalled = window.localStorage.getItem(INSTALL_FLAG_KEY) === "true";
    } catch {
      alreadyInstalled = false;
    }

    if (isStandaloneMode()) {
      setVisible(false);
      try {
        window.localStorage.setItem(INSTALL_FLAG_KEY, "true");
      } catch {
        // ignore storage errors
      }
      return;
    }

    setVisible(!alreadyInstalled);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleClick = async () => {
    if (!deferredPrompt) {
      setShowHelp((prev) => !prev);
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
      setShowHelp(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 sm:sticky sm:top-0 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-3 pb-3 pt-2 sm:px-6 sm:py-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.18)] backdrop-blur sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-semibold text-white shadow-md">
                TL
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Install Transcript Lite
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Works offline and keeps transcripts saved on this device.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <button
                type="button"
                onClick={handleClick}
                className="w-full rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-slate-800 sm:w-auto"
                aria-label="Install Transcript Lite"
              >
                {label}
              </button>
              {showHelp ? (
                <p className="max-w-xs text-[11px] text-slate-500 sm:text-right">
                  Chrome/Edge: menu → Install app. iPhone: Share → Add to Home
                  Screen.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
