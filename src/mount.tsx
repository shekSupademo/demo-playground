import { type ComponentType, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { type AppProps, appLoaders } from "./apps/loaders";
import { loadVariant, variantOverride } from "./lib/variants";
import type { AppId } from "./registry";
import "./index.css";

export async function mount(id: AppId) {
  const [variant, { default: App }] = await Promise.all([
    variantOverride(window.location.search) ?? loadVariant(id),
    appLoaders[id]() as Promise<{ default: ComponentType<AppProps> }>,
  ]);
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <App variant={variant} />
    </StrictMode>,
  );
}
