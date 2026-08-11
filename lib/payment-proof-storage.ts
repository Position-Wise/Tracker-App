import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"

export const PAYMENT_PROOFS_BUCKET = "payment-proofs"
const STORAGE_REF_PREFIX = `${PAYMENT_PROOFS_BUCKET}:`

const MAX_PAYMENT_PROOF_BYTES = 5 * 1024 * 1024
const ALLOWED_PAYMENT_PROOF_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

export function validatePaymentProofFile(file: File): string | null {
  if (file.size <= 0) {
    return "Payment proof file is empty."
  }
  if (file.size > MAX_PAYMENT_PROOF_BYTES) {
    return "Payment proof must be 5 MB or smaller."
  }
  const mime = file.type.trim().toLowerCase()
  if (!ALLOWED_PAYMENT_PROOF_TYPES.has(mime)) {
    return "Payment proof must be a JPEG, PNG, or WebP image."
  }
  return null
}

export function toPaymentProofStorageRef(filePath: string): string {
  const normalized = filePath.trim().replace(/^\/+/, "")
  return `${STORAGE_REF_PREFIX}${normalized}`
}

export function parsePaymentProofStoragePath(stored: string | null | undefined): string | null {
  if (!stored) return null
  const trimmed = stored.trim()
  if (!trimmed) return null

  if (trimmed.startsWith(STORAGE_REF_PREFIX)) {
    const path = trimmed.slice(STORAGE_REF_PREFIX.length).trim()
    return path || null
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const marker = `/storage/v1/object/public/${PAYMENT_PROOFS_BUCKET}/`
    const publicIndex = trimmed.indexOf(marker)
    if (publicIndex >= 0) {
      const path = decodeURIComponent(trimmed.slice(publicIndex + marker.length).split("?")[0] ?? "")
      return path.trim() || null
    }

    const signedMarker = `/storage/v1/object/sign/${PAYMENT_PROOFS_BUCKET}/`
    const signedIndex = trimmed.indexOf(signedMarker)
    if (signedIndex >= 0) {
      const path = decodeURIComponent(trimmed.slice(signedIndex + signedMarker.length).split("?")[0] ?? "")
      return path.trim() || null
    }
  }

  return null
}

export function isPaymentProofStorageRef(stored: string | null | undefined): boolean {
  return Boolean(parsePaymentProofStoragePath(stored))
}

export async function createPaymentProofSignedUrl(
  stored: string | null | undefined,
  expiresInSeconds = 3600
): Promise<string | null> {
  const path = parsePaymentProofStoragePath(stored)
  if (!path) {
    const trimmed = (stored ?? "").trim()
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed
    }
    return null
  }

  const serviceRole = createSupabaseServiceRoleClient()
  const supabase = serviceRole ?? (await createSupabaseServerClient())
  const { data, error } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data?.signedUrl) {
    console.error("Payment proof signed URL failed:", error)
    return null
  }

  return data.signedUrl
}

export async function resolvePaymentProofUrlsForRecords<
  T extends { payment_proof?: string | null },
>(records: T[]): Promise<T[]> {
  return Promise.all(
    records.map(async (record) => {
      const paymentProof = record.payment_proof ?? null
      if (!paymentProof) return record

      const signedUrl = await createPaymentProofSignedUrl(paymentProof)
      return {
        ...record,
        payment_proof: signedUrl ?? paymentProof,
      }
    })
  )
}
