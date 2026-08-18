import type { AccessState, SubscriptionStatus } from "@advisory/lib/subscription-status"

export type MeAuthProfile = {
  role: string | null
  plan: string | null
  status: SubscriptionStatus
  accessState: AccessState
  isAdmin: boolean
  isOwner: boolean
} | null
