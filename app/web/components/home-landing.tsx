import { HomeLandingView } from "@web/components/home-landing-view"
import { resolveTrackPlatformRedirectUrl } from "@track/lib/resolve-track-platform-url"

export async function HomeLanding() {
  const [trackHomeUrl, trackSignUpUrl] = await Promise.all([
    resolveTrackPlatformRedirectUrl("/"),
    resolveTrackPlatformRedirectUrl("/sign-up"),
  ])

  return (
    <HomeLandingView
      trackHomeUrl={trackHomeUrl}
      trackSignUpUrl={trackSignUpUrl}
    />
  )
}
