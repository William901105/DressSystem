import "server-only";

function supabaseOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
      return url.origin;
    }
  } catch {
    return null;
  }
  return null;
}

export function supabaseKey(value: string | undefined, prefix: string) {
  const key = value?.trim();
  return key && key.startsWith(prefix) && key.length > prefix.length ? key : null;
}

export function authenticationSettings() {
  const url = supabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = supabaseKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, "sb_publishable_");
  const invalid = [
    ...(!url ? ["NEXT_PUBLIC_SUPABASE_URL"] : []),
    ...(!publishableKey ? ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] : []),
  ];
  return { config: url && publishableKey ? { url, publishableKey } : null, invalid };
}
