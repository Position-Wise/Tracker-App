"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCachedCurrentUserAccess } from "@/lib/cached-access";
import {
  toPaymentProofStorageRef,
  validatePaymentProofFile,
} from "@advisory/lib/payment-proof-storage";

const ROUTES_TO_REVALIDATE = [
  "/subscribe",
  "/waiting",
  "/dashboard",
  "/tips",
  "/profile",
  "/admin",
  "/admin/users",
  "/admin/subscriptions",
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function submitSubscriptionRequest(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const access = await getCachedCurrentUserAccess();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }
  const organizationId = access.organizationId;
  if (!organizationId) {
    return { error: "No organization is linked to your account." };
  }

  const planIdRaw = formData.get("planId");
  const planId = isNonEmptyString(planIdRaw) ? planIdRaw.trim() : "";

  if (!planId) {
    return { error: "Please select a plan." };
  }

  const fileInput = formData.get("payment_proof");
  const proofFile = fileInput instanceof File ? fileInput : null;
  const hasNewProofFile = Boolean(proofFile && proofFile.size > 0);
  const reuseExistingProof =
    ((formData.get("reuseExistingProof") as string | null) ?? "").trim().toLowerCase() ===
    "true";

  let paymentProofRef: string | null = null;

  if (hasNewProofFile && proofFile) {
    const validationError = validatePaymentProofFile(proofFile);
    if (validationError) {
      return { error: validationError };
    }

    const fileExt = proofFile.name.split(".").pop() || "png";
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, proofFile, {
        contentType: proofFile.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    paymentProofRef = toPaymentProofStorageRef(filePath);
  } else if (reuseExistingProof) {
    const { data: existingSubmission } = await supabase
      .from("user_subscriptions")
      .select("payment_proof")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    const existingProofRef = (existingSubmission?.payment_proof ?? "").trim();
    if (!existingProofRef) {
      return { error: "No existing payment proof found. Please upload a screenshot." };
    }

    paymentProofRef = existingProofRef;
  } else {
    return { error: "Payment proof required" };
  }

  const submissionPayload = {
    user_id: user.id,
    organization_id: organizationId,
    subscription_plan_id: planId,
    payment_proof: paymentProofRef,
    status: "pending",
    submitted_at: new Date().toISOString(),
  };

  const { error: dbError } = await supabase
    .from("user_subscriptions")
    .upsert(submissionPayload, { onConflict: "user_id,organization_id" });

  if (dbError) {
    console.error("Subscription DB error:", dbError);
    return { error: dbError.message };
  }

  ROUTES_TO_REVALIDATE.forEach((path) => revalidatePath(path));

  return { error: null };
}
