"use server"

import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { getCurrentUserAccessState } from "@advisory/lib/subscription-access"

export async function checkCurrentUserAccess() {
  const [routeAccess, state] = await Promise.all([
    getCurrentUserAccess(),
    getCurrentUserAccessState(),
  ])
  return {
    ...routeAccess,
    accessState: state.accessState,
  }
}
