"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type TestResult = {
  name: string
  status: "PASS" | "FAIL"
  details?: unknown
}

export default function DebugClient() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)

  const runTests = useCallback(async () => {
    const testResults: TestResult[] = []

    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        testResults.push({ name: "Auth User", status: "FAIL" })
        setResults(testResults)
        setLoading(false)
        return
      }

      testResults.push({
        name: "Auth User",
        status: "PASS",
        details: user.id,
      })

      const { data: isOwner } = await supabase.rpc("is_owner")

      testResults.push({
        name: "is_owner()",
        status: isOwner ? "PASS" : "FAIL",
        details: isOwner,
      })

      const { data: membership } = await supabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle()

      const orgId = membership?.organization_id

      testResults.push({
        name: "User Org",
        status: orgId ? "PASS" : "FAIL",
        details: orgId,
      })

      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("id,organization_id,user_id,status")

      const wrongSubs = subs?.filter((s) => s.organization_id !== orgId)

      testResults.push({
        name: "Subscriptions RLS",
        status: wrongSubs?.length ? "FAIL" : "PASS",
        details: subs?.length,
      })

      const { data: broadcasts } = await supabase
        .from("admin_broadcasts")
        .select("id,organization_id")

      const wrongBroadcasts = broadcasts?.filter((b) => b.organization_id !== orgId)

      testResults.push({
        name: "Broadcasts RLS",
        status: wrongBroadcasts?.length ? "FAIL" : "PASS",
        details: broadcasts?.length,
      })

      const { data: usage } = await supabase
        .from("trade_usage")
        .select("id,organization_id")

      const wrongUsage = usage?.filter((u) => u.organization_id !== orgId)

      testResults.push({
        name: "Trade Usage RLS",
        status: wrongUsage?.length ? "FAIL" : "PASS",
        details: usage?.length,
      })

      const fakeOrg = "00000000-0000-0000-0000-000000000000"

      const { error: insertError } = await supabase.from("user_subscriptions").insert({
        user_id: user.id,
        organization_id: fakeOrg,
      })

      testResults.push({
        name: "Insert Wrong Org Block",
        status: insertError ? "PASS" : "FAIL",
        details: insertError?.message,
      })
    } catch (err) {
      testResults.push({
        name: "Unexpected Error",
        status: "FAIL",
        details: err,
      })
    }

    setResults(testResults)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void runTests()
    }, 0)
    return () => clearTimeout(timer)
  }, [runTests])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">RLS Test Dashboard (development only)</h1>

      {loading && <p>Running tests...</p>}

      {!loading && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded ${
                r.status === "PASS" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div className="font-semibold">
                {r.name} → {r.status}
              </div>
              {r.details != null ? (
                <pre className="text-xs mt-1">{JSON.stringify(r.details, null, 2)}</pre>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
