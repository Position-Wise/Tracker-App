import { cache } from "react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserAccess as resolveCurrentUserAccess } from "@/lib/current-user-route-access"
import {
  deriveCurrentUserAccessState,
  fetchCurrentUserSubscription,
  getEmptyCurrentUserAccessState,
  resolveCurrentUserAdminState,
  type AccessQueryClient,
} from "@/lib/current-user-access"
import { createPaymentProofSignedUrl } from "@/lib/payment-proof-storage"

export const getCachedSupabaseServerClient = cache(createSupabaseServerClient)

export const getCachedCurrentUserAccess = cache(async (orgId?: string | null) => {
  const supabase = await getCachedSupabaseServerClient()
  return resolveCurrentUserAccess(
    supabase,
    orgId ? { orgId } : undefined
  )
})

export const getCachedCurrentUserAccessState = cache(async (orgId?: string | null) => {
  const supabase = await getCachedSupabaseServerClient()
  const access = await getCachedCurrentUserAccess(orgId ?? null)

  if (!access.user) {
    return getEmptyCurrentUserAccessState(null)
  }

  const organizationId = access.organizationId
  const [{ isAdmin, role, source }, subscriptionRaw] = await Promise.all([
    resolveCurrentUserAdminState(supabase as unknown as AccessQueryClient, access.user.id),
    fetchCurrentUserSubscription(
      supabase as unknown as AccessQueryClient,
      access.user.id,
      organizationId
    ),
  ])

  let subscription = subscriptionRaw
  if (subscription?.payment_proof) {
    const signedUrl = await createPaymentProofSignedUrl(subscription.payment_proof)
    subscription = {
      ...subscription,
      payment_proof: signedUrl ?? subscription.payment_proof,
    }
  }

  return deriveCurrentUserAccessState({
    user: access.user,
    role,
    isAdmin,
    adminResolutionSource: source,
    subscription,
  })
})
