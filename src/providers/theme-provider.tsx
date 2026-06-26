"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  [key: string]: any;
}) {
  const [theme, setThemeState] = React.useState<Theme>("dark");

  React.useEffect(() => {
    // Load theme from localStorage on mount first for zero-flicker speed
    const savedTheme = (localStorage.getItem("theme") as Theme) || defaultTheme;
    setThemeState(savedTheme);

    // Fetch persistent database settings in background
    async function syncDbTheme() {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings?.theme) {
            setThemeState(data.settings.theme);
          }
        }
      } catch (e) {
        console.error("Theme DB synchronization skipped:", e);
      }
    }
    syncDbTheme();
  }, [defaultTheme]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    localStorage.setItem("theme", theme);

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
