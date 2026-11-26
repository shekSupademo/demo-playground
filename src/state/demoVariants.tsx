import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type DemoVariants,
  decodeVariants,
  variantUrl,
} from "../lib/demoVariants";
import { loadSharedVariants, saveSharedVariants } from "../lib/sharedVariants";
import { useToast } from "./toast";

const DemoVariantsContext = createContext<{
  variants: DemoVariants;
  saveVariants: (next: DemoVariants) => void;
} | null>(null);

function previewVariants() {
  const shared = new URLSearchParams(window.location.search).get("variants");
  return shared === null ? null : decodeVariants(shared);
}

export function DemoVariantsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [preview] = useState(previewVariants);
  const [variants, setVariants] = useState<DemoVariants | null>(preview);

  useEffect(() => {
    if (!preview) loadSharedVariants().then(setVariants);
  }, [preview]);

  async function saveVariants(next: DemoVariants) {
    setVariants(next);
    if (preview) {
      window.history.replaceState(
        window.history.state,
        "",
        variantUrl(next, window.location.hash),
      );
      return;
    }
    if (!(await saveSharedVariants(next)))
      toast("Couldn't share this change. It applies to this tab only.");
  }

  // Hold the app until the shared variants load so visitors never see the wrong version flash.
  if (!variants) return null;
  return (
    <DemoVariantsContext.Provider value={{ variants, saveVariants }}>
      {children}
    </DemoVariantsContext.Provider>
  );
}

export function useDemoVariants() {
  const context = useContext(DemoVariantsContext);
  if (!context) throw new Error("DemoVariantsProvider is missing");
  return context;
}
