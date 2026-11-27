import { type AppId, appIds, type Variant } from "../registry";

const isVariant = (value: unknown): value is Variant =>
  value === "baseline" || value === "variant";

// The publishable key is public by design; supabase/demo_apps.sql's row-level security is what limits writes.
function supabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return url && key
    ? { tableUrl: `${url}/rest/v1/demo_apps`, headers: { apikey: key } }
    : null;
}

export function variantOverride(search: string): Variant | null {
  const value = new URLSearchParams(search).get("variant");
  return isVariant(value) ? value : null;
}

// Fails to baseline so a paused or unreachable store never shows a test the variant by accident.
export async function loadVariant(id: AppId): Promise<Variant> {
  const config = supabase();
  if (!config) return "baseline";
  try {
    const response = await fetch(
      `${config.tableUrl}?id=eq.${id}&select=variant`,
      {
        headers: config.headers,
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!response.ok) return "baseline";
    const rows = (await response.json()) as { variant: unknown }[];
    return isVariant(rows[0]?.variant) ? rows[0].variant : "baseline";
  } catch {
    return "baseline";
  }
}

export async function loadAllVariants(): Promise<Record<
  AppId,
  Variant
> | null> {
  const config = supabase();
  if (!config) return null;
  try {
    const response = await fetch(`${config.tableUrl}?select=id,variant`, {
      headers: config.headers,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const rows = (await response.json()) as { id: string; variant: unknown }[];
    const saved = new Map(rows.map((row) => [row.id, row.variant]));
    return Object.fromEntries(
      appIds.map((id) => {
        const value = saved.get(id);
        return [id, isVariant(value) ? value : "baseline"];
      }),
    ) as Record<AppId, Variant>;
  } catch {
    return null;
  }
}

export async function saveVariants(
  ids: AppId[],
  variant: Variant,
): Promise<boolean> {
  const config = supabase();
  if (!config) return false;
  try {
    const response = await fetch(
      `${config.tableUrl}?id=in.(${ids.join(",")})`,
      {
        method: "PATCH",
        headers: {
          ...config.headers,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ variant }),
      },
    );
    return (
      response.ok &&
      ((await response.json()) as unknown[]).length === ids.length
    );
  } catch {
    return false;
  }
}
