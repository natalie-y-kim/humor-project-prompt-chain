"use client";

import { ReactNode } from "react";

interface AlertBannerProps {
  type: "success" | "error" | "info" | "warning";
  children: ReactNode;
  className?: string;
}

export function AlertBanner({ type, children, className = "" }: AlertBannerProps) {
  return (
    <div className={`alert alert-${type} ${className}`}>
      {children}
    </div>
  );
}
