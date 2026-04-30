"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  {
    href: "/prompt-chain/humor-flavors",
    label: "Manage Humor Flavors",
    icon: "🎭",
  },
  {
    href: "/prompt-chain/test-runner",
    label: "Run Flavor Tests",
    icon: "🧪",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`fixed left-0 top-0 h-screen border-r border-border bg-panel text-panel-foreground shadow-sm transition-all duration-300 ${
      isCollapsed ? "w-16" : "w-56"
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className={`p-4 border-b border-border ${isCollapsed ? "px-2" : ""}`}>
          <div className="flex items-center justify-between">
            <Link href="/prompt-chain" className={`flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition ${isCollapsed ? "justify-center" : ""}`}>
              <span>💡</span>
              {!isCollapsed && <span>Humor Chain</span>}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-md hover:bg-muted transition"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="text-sm">{isCollapsed ? "▶" : "◀"}</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-border space-y-2 ${isCollapsed ? "px-2" : ""}`}>
          <Link
            href="/prompt-chain"
            prefetch={false}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition ${
              isCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <span>🏠</span>
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
          <Link
            href="/logout"
            prefetch={false}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition ${
              isCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <span>🚪</span>
            {!isCollapsed && <span>Logout</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}

