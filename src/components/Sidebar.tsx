"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

const navItems: NavItem[] = [
  {
    href: "/prompt-chain/humor-flavors",
    label: "Manage Humor Flavors",
    icon: "HF",
  },
  {
    href: "/prompt-chain/test-runner",
    label: "Run Flavor Tests",
    icon: "TR",
  },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-16 border-r border-border bg-panel text-panel-foreground shadow-sm transition-[width] duration-300 ${
        isCollapsed ? "md:w-16" : "md:w-56"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className={`border-b border-border p-4 px-2 ${isCollapsed ? "md:px-2" : "md:px-4"}`}>
          <div className="flex items-center justify-between">
            <Link
              href="/prompt-chain"
              className={`flex items-center gap-2 text-lg font-semibold transition hover:opacity-80 ${
                isCollapsed ? "justify-center" : "justify-center md:justify-start"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-xs font-semibold text-muted-foreground">
                HC
              </span>
              {!isCollapsed && <span className="hidden md:inline">Humor Chain</span>}
            </Link>
            <button
              onClick={onToggle}
              className="hidden rounded-md p-1 transition hover:bg-muted md:block"
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
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                } ${
                  isCollapsed
                    ? "justify-center px-2"
                    : "justify-center px-2 md:justify-start md:px-4"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold ${
                    isActive
                      ? "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span className="hidden md:inline">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`space-y-2 border-t border-border p-4 px-2 ${isCollapsed ? "md:px-2" : "md:px-4"}`}>
          <Link
            href="/prompt-chain"
            prefetch={false}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition ${
              isCollapsed
                ? "justify-center px-2"
                : "justify-center px-2 md:justify-start md:px-4"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-[11px] font-semibold text-muted-foreground">
              DB
            </span>
            {!isCollapsed && <span className="hidden md:inline">Dashboard</span>}
          </Link>
          <Link
            href="/logout"
            prefetch={false}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition ${
              isCollapsed
                ? "justify-center px-2"
                : "justify-center px-2 md:justify-start md:px-4"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-[11px] font-semibold text-muted-foreground">
              LO
            </span>
            {!isCollapsed && <span className="hidden md:inline">Logout</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}
