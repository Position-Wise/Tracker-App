"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type PaymentProofPreviewProps = {
  paymentProof: string
  memberLabel: string
  thumbClassName?: string
}

export default function PaymentProofPreview({
  paymentProof,
  memberLabel,
  thumbClassName = "h-16 w-16",
}: PaymentProofPreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex rounded-md border border-border transition-opacity hover:opacity-90"
        >
          <Image
            src={paymentProof}
            alt={`${memberLabel} payment proof`}
            width={96}
            height={96}
            sizes="96px"
            loading="lazy"
            className={`${thumbClassName} rounded-md object-cover`}
          />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment proof</DialogTitle>
          <DialogDescription>{memberLabel}</DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-6">
          <Image
            src={paymentProof}
            alt={`${memberLabel} payment proof full preview`}
            width={1200}
            height={1600}
            sizes="(max-width: 768px) 90vw, 900px"
            className="mx-auto max-h-[70vh] w-auto rounded-md border border-border"
          />
        </div>
        <DialogFooter>
          <Button asChild size="sm" variant="outline">
            <a href={paymentProof} target="_blank" rel="noreferrer">
              Open in new tab
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
