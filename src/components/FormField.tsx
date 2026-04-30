"use client";

import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
  description?: string;
}

export function FormField({ label, htmlFor, children, className = "", description }: FormFieldProps) {
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}