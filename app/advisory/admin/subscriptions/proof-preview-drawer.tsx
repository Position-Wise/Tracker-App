"use client"
import PaymentProofPreview from "@advisory/components/subscription/payment-proof-preview"

type ProofPreviewDrawerProps = {
  paymentProof: string
  memberLabel: string
}

export default function ProofPreviewDrawer({
  paymentProof,
  memberLabel,
}: ProofPreviewDrawerProps) {
  return (
    <PaymentProofPreview
      paymentProof={paymentProof}
      memberLabel={`Submitted by ${memberLabel}`}
      thumbClassName="h-12 w-12"
    />
  )
}
