import { createContext, useContext, useState, type ReactNode } from "react";
import { decodeVariants, defaultVariants, encodeVariants, variantUrl, type DemoVariants } from "../lib/demoVariants";

const STORAGE_KEY = "northbeam-demo-variants";
const DemoVariantsContext = createContext<{
  variants: DemoVariants;
  saveVariants: (next: DemoVariants) => void;
} | null>(null);

function loadVariants() {
  const shared = new URLSearchParams(window.location.search).get("variants");
  if (shared !== null) return decodeVariants(shared);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? defaultVariants : decodeVariants(saved);
  } catch {
    return defaultVariants;
  }
}

export function DemoVariantsProvider({ children }: { children: ReactNode }) {
  const [variants, setVariants] = useState(loadVariants);

  function saveVariants(next: DemoVariants) {
    setVariants(next);
    let useUrl = new URLSearchParams(window.location.search).has("variants");
    try {
      localStorage.setItem(STORAGE_KEY, encodeVariants(next));
    } catch {
      useUrl = true;
    }
    if (useUrl) {
      window.history.replaceState(window.history.state, "", variantUrl(next, window.location.hash));
    }
  }

  return <DemoVariantsContext.Provider value={{ variants, saveVariants }}>{children}</DemoVariantsContext.Provider>;
}

export function useDemoVariants() {
  const context = useContext(DemoVariantsContext);
  if (!context) throw new Error("DemoVariantsProvider is missing");
  return context;
}
