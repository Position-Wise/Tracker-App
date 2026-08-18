import { publishBroadcast } from "../actions"
import { fetchAdminBroadcasts, fetchAdminProfiles, fetchBroadcastFeedbackSummary } from "../queries"
import BroadcastFormFields from "../_components/broadcast-form-fields"
import AdminBroadcastList from "./admin-broadcast-list"
import BroadcastFeedbackLiveRefresh from "./broadcast-feedback-live-refresh"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"

export const dynamic = "force-dynamic"

export default async function AdminBroadcastPage() {
  const [broadcasts, profiles] = await Promise.all([
    fetchAdminBroadcasts(30),
    fetchAdminProfiles(),
  ])
  const feedbackSummary = await fetchBroadcastFeedbackSummary(
    broadcasts.map((broadcast) => broadcast.id)
  )
  const userOptions = profiles.map((profile) => ({
    id: profile.id,
    label:
      profile.full_name?.trim() ||
      profile.email?.trim() ||
      `User ${profile.id.slice(0, 8)}`,
  }))

  const broadcastIds = broadcasts.map((broadcast) => broadcast.id)

  return (
    <section className="space-y-6">
      <BroadcastFeedbackLiveRefresh broadcastIds={broadcastIds} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Publish Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={publishBroadcast} className="space-y-4">
            <BroadcastFormFields userOptions={userOptions} />

            <LoadingSubmitButton type="submit" size="sm" pendingText="Publishing...">
              Publish broadcast
            </LoadingSubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Recent Broadcasts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AdminBroadcastList
            broadcasts={broadcasts}
            initialFeedbackSummary={feedbackSummary}
            userOptions={userOptions}
          />
        </CardContent>
      </Card>
    </section>
  )
}
