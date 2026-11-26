import {
  type DemoVariants,
  defaultVariants,
  parseVariants,
} from "./demoVariants";

// The publishable key is public by design; supabase/demo_variants.sql's row-level security is what limits writes.
function supabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return url && key
    ? {
        rowUrl: `${url}/rest/v1/demo_variants?id=eq.1`,
        headers: { apikey: key },
      }
    : null;
}

export async function loadSharedVariants(): Promise<DemoVariants> {
  const config = supabase();
  if (!config) return defaultVariants;
  try {
    const response = await fetch(`${config.rowUrl}&select=variants`, {
      headers: config.headers,
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return defaultVariants;
    const rows = (await response.json()) as { variants: unknown }[];
    return parseVariants(rows[0]?.variants) ?? defaultVariants;
  } catch {
    return defaultVariants;
  }
}

export async function saveSharedVariants(
  variants: DemoVariants,
): Promise<boolean> {
  const config = supabase();
  if (!config) return false;
  try {
    const response = await fetch(config.rowUrl, {
      method: "PATCH",
      headers: {
        ...config.headers,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ variants }),
    });
    return response.ok && ((await response.json()) as unknown[]).length === 1;
  } catch {
    return false;
  }
}
