import { CategoriesManager } from "@track/components/categories-manager"
import { ensureTrackProfile, listCategories } from "@track/lib/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function TrackCategoriesPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  await ensureTrackProfile(supabase, user.id)
  const categories = await listCategories(supabase, user.id)

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defaults are ready on first use. Add your own when you need them.
        </p>
      </div>
      <CategoriesManager categories={categories} />
    </div>
  )
}
