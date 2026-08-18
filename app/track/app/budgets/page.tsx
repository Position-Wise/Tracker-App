import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TrackBudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Budgets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monthly limits per category — coming soon.
        </p>
      </div>
      <div className="track-panel px-6 py-14 text-center">
        <p className="text-sm text-muted-foreground">
          For now, use Home to see where your money goes.
        </p>
        <Button asChild className="mt-4 rounded-full" variant="outline">
          <Link href="/app">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}
