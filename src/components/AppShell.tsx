"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((current) => !current)}
      />
      <div
        className={`ml-16 min-w-0 flex-1 transition-[margin] duration-300 ${
          isSidebarCollapsed ? "md:ml-16" : "md:ml-56"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
