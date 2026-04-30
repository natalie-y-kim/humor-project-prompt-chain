"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const THEMES = [
  { value: "system", label: "System", icon: "🖥️" },
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const currentTheme = mounted ? theme : "system";
  const currentThemeData = THEMES.find((t) => t.value === currentTheme) || THEMES[0];

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex((t) => t.value === currentTheme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex].value);
  };

  return (
    <button
      onClick={cycleTheme}
      className="btn btn-secondary"
      aria-label={`Switch to ${THEMES[(THEMES.findIndex((t) => t.value === currentTheme) + 1) % THEMES.length].label} theme`}
      title={`Current theme: ${currentThemeData.label}`}
    >
      <span className="mr-2">{currentThemeData.icon}</span>
      {currentThemeData.label}
    </button>
  );
}
