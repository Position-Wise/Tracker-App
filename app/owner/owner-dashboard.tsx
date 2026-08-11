"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  assignUserToOrganization,
  createOrganization,
  promoteUserToOrgAdmin,
} from "./actions"

type Organization = {
  id: string
  name: string
  slug: string
  subdomain: string
  created_at: string | null
}

type UserRow = {
  id: string
  full_name: string | null
  avatar_url: string | null
  organization_id: string | null
  organization_name: string | null
}

type TabKey = "organizations" | "users"

interface OwnerDashboardProps {
  organizations: Organization[]
  users: UserRow[]
}

export default function OwnerDashboard({
  organizations: initialOrganizations,
  users: initialUsers,
}: OwnerDashboardProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("organizations")
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [users, setUsers] = useState(initialUsers)
  const [selectedOrganizationByUser, setSelectedOrganizationByUser] = useState<
    Record<string, string>
  >({})
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  const [orgMessage, setOrgMessage] = useState<string | null>(null)
  const [userMessage, setUserMessage] = useState<string | null>(null)
  const [isCreatingOrg, startCreateTransition] = useTransition()
  const [isAssigning, startAssignTransition] = useTransition()
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null)

  useEffect(() => {
    setOrganizations(initialOrganizations)
  }, [initialOrganizations])

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const organizationOptions = useMemo(
    () => organizations.map((org) => ({ id: org.id, name: org.name })),
    [organizations]
  )
  const membersByOrganizationId = useMemo(() => {
    const grouped = new Map<string, UserRow[]>()
    users.forEach((user) => {
      if (!user.organization_id) return
      const existing = grouped.get(user.organization_id) ?? []
      existing.push(user)
      grouped.set(user.organization_id, existing)
    })
    return grouped
  }, [users])

  function formatDate(value: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
  }

  function handlePromote(userId: string, organizationId: string) {
    setUserMessage(null)
    setPromotingUserId(userId)
    startAssignTransition(async () => {
      const formData = new FormData()
      formData.set("userId", userId)
      formData.set("organizationId", organizationId)
      const result = await promoteUserToOrgAdmin(formData)
      if (!result.ok) {
        setUserMessage(result.error)
        setPromotingUserId(null)
        return
      }
      setUserMessage("User promoted to org admin.")
      setPromotingUserId(null)
      router.refresh()
    })
  }

  function userDisplayName(user: UserRow) {
    const name = user.full_name?.trim()
    return name || "Unnamed user"
  }

  function handleCreateOrganization(formData: FormData) {
    setOrgMessage(null)
    startCreateTransition(async () => {
      const result = await createOrganization(formData)
      if (!result.ok) {
        setOrgMessage(result.error)
        return
      }
      setOrgMessage("Organization created.")
      formRef.current?.reset()
      router.refresh()
    })
  }

  function handleAssign(userId: string) {
    const organizationId = selectedOrganizationByUser[userId]
    if (!organizationId) return

    setUserMessage(null)
    setAssigningUserId(userId)

    startAssignTransition(async () => {
      const formData = new FormData()
      formData.set("userId", userId)
      formData.set("organizationId", organizationId)

      const result = await assignUserToOrganization(formData)
      if (!result.ok) {
        setUserMessage(result.error)
        setAssigningUserId(null)
        return
      }

      const selectedOrgName =
        organizations.find((organization) => organization.id === organizationId)?.name ?? null
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                organization_id: organizationId,
                organization_name: selectedOrgName,
              }
            : user
        )
      )
      setSelectedOrganizationByUser((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
      setUserMessage("User assigned successfully.")
      setAssigningUserId(null)
    })
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Owner Dashboard</h1>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm ${
            activeTab === "organizations"
              ? "bg-foreground text-background"
              : "border border-border"
          }`}
          onClick={() => setActiveTab("organizations")}
        >
          Organizations
        </button>
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm ${
            activeTab === "users" ? "bg-foreground text-background" : "border border-border"
          }`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
      </div>

      {activeTab === "organizations" ? (
        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-medium">Create Organization</h2>
            <form
              id="create-organization-form"
              ref={formRef}
              action={handleCreateOrganization}
              className="mt-4 space-y-3"
            >
              <input
                name="name"
                placeholder="Name"
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                required
              />
              <input
                name="slug"
                placeholder="Slug"
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                required
              />
              <input
                name="subdomain"
                placeholder="Subdomain"
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                required
              />
              <button
                type="submit"
                className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
                disabled={isCreatingOrg}
              >
                {isCreatingOrg ? "Creating..." : "Create Organization"}
              </button>
            </form>
            {orgMessage ? <p className="mt-3 text-sm text-muted-foreground">{orgMessage}</p> : null}
          </div>

          <div>
            <h2 className="text-lg font-medium">Organizations</h2>
            <div className="mt-4 space-y-3">
              {organizations.length ? (
                organizations.map((org) => (
                  <article key={org.id} className="rounded-md border border-border p-4 text-sm">
                    <p className="font-medium">{org.name}</p>
                    <p className="text-muted-foreground">slug: {org.slug}</p>
                    <p className="text-muted-foreground">subdomain: {org.subdomain}</p>
                    <p className="text-muted-foreground">
                      created: {formatDate(org.created_at)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        onClick={() => router.push(`/dashboard?org=${org.id}`)}
                      >
                        Open user dashboard
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        onClick={() => router.push(`/admin-select?org=${org.id}`)}
                      >
                        Open admin dashboard
                      </button>
                    </div>
                    <div className="mt-3">
                      <p className="mb-2 text-xs text-muted-foreground">Users</p>
                      {(() => {
                        const members = membersByOrganizationId.get(org.id) ?? []
                        const visibleMembers = members.slice(0, 6)
                        const remainingCount = Math.max(0, members.length - visibleMembers.length)

                        if (!members.length) {
                          return (
                            <p className="text-xs text-muted-foreground">
                              No users in this organization.
                            </p>
                          )
                        }

                        return (
                          <div className="flex items-center gap-1">
                            {visibleMembers.map((member) =>
                              member.avatar_url ? (
                                <Image
                                  key={member.id}
                                  src={member.avatar_url}
                                  alt={userDisplayName(member)}
                                  width={28}
                                  height={28}
                                  sizes="28px"
                                  className="h-7 w-7 rounded-full border border-border object-cover"
                                />
                              ) : (
                                <div
                                  key={member.id}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-[10px]"
                                  title={userDisplayName(member)}
                                >
                                  {userDisplayName(member).slice(0, 1).toUpperCase()}
                                </div>
                              )
                            )}
                            {remainingCount ? (
                              <span className="ml-1 text-xs text-muted-foreground">
                                +{remainingCount}
                              </span>
                            ) : null}
                          </div>
                        )
                      })()}
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No organizations found.</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Users</h2>
          {userMessage ? <p className="mt-3 text-sm text-muted-foreground">{userMessage}</p> : null}

          <div className="mt-4 space-y-3">
            {users.length ? (
              users.map((user) => {
                const selectedOrg = selectedOrganizationByUser[user.id] ?? ""
                const currentlyAssigning = assigningUserId === user.id && isAssigning
                const hasOrganization = Boolean(user.organization_id)

                return (
                  <article
                    key={user.id}
                    className="flex flex-col gap-3 rounded-md border border-border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={userDisplayName(user)}
                          width={40}
                          height={40}
                          sizes="40px"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-xs">
                          N/A
                        </div>
                      )}
                      <p className="font-medium">{userDisplayName(user)}</p>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {hasOrganization
                          ? `Org: ${user.organization_name ?? "Assigned"}`
                          : "No organization"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <select
                        className="rounded-md border border-border bg-background px-3 py-2"
                        value={selectedOrg || user.organization_id || ""}
                        onChange={(event) =>
                          setSelectedOrganizationByUser((prev) => ({
                            ...prev,
                            [user.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select organization</option>
                        {organizationOptions.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
                        disabled={
                          !selectedOrg ||
                          currentlyAssigning ||
                          (hasOrganization && selectedOrg === user.organization_id)
                        }
                        onClick={() => handleAssign(user.id)}
                      >
                        {currentlyAssigning
                          ? "Saving..."
                          : hasOrganization
                            ? "Change organization"
                            : "Assign"}
                      </button>
                    </div>
                    {hasOrganization && user.organization_id ? (
                      <button
                        type="button"
                        className="rounded-md border border-border px-3 py-2 text-xs disabled:opacity-60"
                        disabled={promotingUserId === user.id}
                        onClick={() => handlePromote(user.id, user.organization_id!)}
                      >
                        {promotingUserId === user.id ? "Promoting..." : "Promote to org admin"}
                      </button>
                    ) : null}
                  </article>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">No users found.</p>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
