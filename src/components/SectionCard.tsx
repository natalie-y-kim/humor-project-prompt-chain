"use client";

import { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}

export function SectionCard({
  title,
  description,
  children,
  className = "",
  titleClassName = "",
}: SectionCardProps) {
  return (
    <section className={`card ${className}`}>
      {title && <h2 className={`card-title ${titleClassName}`}>{title}</h2>}
      {description && <p className="card-description">{description}</p>}
      {children}
    </section>
  );
}
