"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = Exclude<Theme, "system">;
type Attribute = "class" | `data-${string}` | Array<"class" | `data-${string}`>;

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: Attribute;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  disableTransitionOnChange?: boolean;
  forcedTheme?: Theme | ResolvedTheme;
  storageKey?: string;
  themes?: ResolvedTheme[];
  value?: Partial<Record<ResolvedTheme, string>>;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  forcedTheme?: Theme | ResolvedTheme;
  resolvedTheme?: ResolvedTheme;
  systemTheme?: ResolvedTheme;
  themes: Theme[];
};

const ThemeContext = React.createContext<ThemeProviderState | null>(null);
const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const DEFAULT_THEMES: ResolvedTheme[] = ["light", "dark"];

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function getStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  try {
    const storedTheme = window.localStorage.getItem(storageKey);

    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      return storedTheme;
    }
  } catch {
    // Ignore storage access failures and fall back to defaultTheme.
  }

  return defaultTheme;
}

function disableTransitions(): () => void {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}",
    ),
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    window.setTimeout(() => {
      document.head.removeChild(style);
    }, 1);
  };
}

function applyTheme({
  attribute,
  disableTransitionOnChange,
  enableColorScheme,
  resolvedTheme,
  themes,
  value,
}: {
  attribute: Attribute;
  disableTransitionOnChange: boolean;
  enableColorScheme: boolean;
  resolvedTheme: ResolvedTheme;
  themes: ResolvedTheme[];
  value?: Partial<Record<ResolvedTheme, string>>;
}) {
  const root = document.documentElement;
  const attributes = Array.isArray(attribute) ? attribute : [attribute];
  const cleanup = disableTransitionOnChange ? disableTransitions() : undefined;
  const classValues = themes.map((theme) => value?.[theme] ?? theme);
  const resolvedValue = value?.[resolvedTheme] ?? resolvedTheme;

  for (const currentAttribute of attributes) {
    if (currentAttribute === "class") {
      root.classList.remove(...classValues);
      root.classList.add(resolvedValue);
      continue;
    }

    root.setAttribute(currentAttribute, resolvedValue);
  }

  if (enableColorScheme) {
    root.style.colorScheme = resolvedTheme;
  }

  cleanup?.();
}

export function ThemeProvider({
  attribute = "data-theme",
  children,
  defaultTheme = "system",
  disableTransitionOnChange = false,
  enableColorScheme = true,
  enableSystem = true,
  forcedTheme,
  storageKey = "theme",
  themes = DEFAULT_THEMES,
  value,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() =>
    getStoredTheme(storageKey, defaultTheme),
  );
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() => getSystemTheme());

  const resolvedTheme = forcedTheme
    ? forcedTheme === "system"
      ? systemTheme
      : forcedTheme
    : theme === "system"
      ? systemTheme
      : theme;

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", onChange);

    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (forcedTheme) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Ignore storage access failures and keep the in-memory theme value.
    }
  }, [forcedTheme, storageKey, theme]);

  React.useEffect(() => {
    applyTheme({
      attribute,
      disableTransitionOnChange,
      enableColorScheme,
      resolvedTheme,
      themes,
      value,
    });
  }, [
    attribute,
    disableTransitionOnChange,
    enableColorScheme,
    resolvedTheme,
    themes,
    value,
  ]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const contextValue = React.useMemo<ThemeProviderState>(
    () => ({
      theme: forcedTheme ?? theme,
      setTheme,
      forcedTheme,
      resolvedTheme,
      systemTheme: enableSystem ? systemTheme : undefined,
      themes: enableSystem ? [...themes, "system"] : themes,
    }),
    [enableSystem, forcedTheme, resolvedTheme, setTheme, systemTheme, theme, themes],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
