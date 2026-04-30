"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ breadcrumbs, title, description, actions, className = "" }: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between ${className}`}>
      <div>
        {breadcrumbs && (
          <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((item, index) => (
              <span key={index} className="flex items-center gap-2">
                {item.href ? (
                  <Link href={item.href} className="transition hover:text-panel-foreground">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-panel-foreground">{item.label}</span>
                )}
                {index < breadcrumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="mt-3 text-3xl font-semibold text-panel-foreground">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <ThemeToggle />
        {actions}
      </div>
    </header>
  );
}