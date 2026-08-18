"use client"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useState } from "react"
import { createOrgPlan } from "./actions"
import { Input } from "@/components/ui/input"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"

export function AddPlanDrawer() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [planType, setPlanType] = useState<"trader" | "investor" | "both">("both")
  const [price, setPrice] = useState("")

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="w-full">Add New Plan</Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add New Plan</DrawerTitle>
          <DrawerDescription>
            Create and configure a new subscription plan.
          </DrawerDescription>
        </DrawerHeader>

        <form action={createOrgPlan} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted-foreground">
              Plan Name
            </label>
            <Input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pro Plan"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase text-muted-foreground">
              Description
            </label>
            <Input
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase text-muted-foreground">
              Plan Type
            </label>
            <select
              name="planType"
              value={planType}
              onChange={(e) =>
                setPlanType(e.target.value as "trader" | "investor" | "both")
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="both">Trader & Investor</option>
              <option value="trader">Trader Only</option>
              <option value="investor">Investor Only</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase text-muted-foreground">
              Price
            </label>
            <Input
              name="price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 999"
            />
          </div>

          <LoadingSubmitButton type="submit" size="sm" pendingText="Creating...">
            Create Plan
          </LoadingSubmitButton>
        </form>
      </DrawerContent>
    </Drawer>
  )
}