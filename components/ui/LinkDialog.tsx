"use client";

import { useState } from "react";

type LinkDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  url: string;
  onClose: () => void;
};

export default function LinkDialog({
  open,
  title = "Share link",
  description = "Copy this link and share it in any app.",
  url,
  onClose,
}: LinkDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!open) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{description}</p>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
          <p className="break-all">{url}</p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
