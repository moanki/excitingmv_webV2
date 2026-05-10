"use client";

import type { ReactNode } from "react";

type PartnerModalButtonProps = {
  children: ReactNode;
  className?: string;
};

export function PartnerModalButton({ children, className }: PartnerModalButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event("open-partner-modal"))}
    >
      {children}
    </button>
  );
}
