import { isReservedSubdomain } from "@/lib/reserved-subdomains"
import { createSupabaseServerClient, type SupabaseServerClient } from "@/lib/supabase/server"

type ResolvedOrganization = {
  id: string
  name: string | null
  subdomain: string | null
}

export async function resolveOrg(
  subdomain: string | null | undefined,
  providedSupabase?: SupabaseServerClient
) {
  const normalized = (subdomain ?? "").trim().toLowerCase()
  if (!normalized || isReservedSubdomain(normalized)) return null

  const supabase = providedSupabase ?? (await createSupabaseServerClient())
  const { data } = await supabase
    .from("organizations")
    .select("id, name, subdomain")
    .eq("subdomain", normalized)
    .maybeSingle()

  return (data as ResolvedOrganization | null) ?? null
}
