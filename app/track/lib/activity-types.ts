export type TrackActivityKind = "expense" | "income" | "transfer"

export type TrackActivityItem = {
  id: string
  kind: TrackActivityKind
  title: string
  amount: number
  currency: string
  occurredAt: string
  note: string | null
  categoryName?: string
  walletName?: string
  fromWallet?: string
  toWallet?: string
  /** Deposit account for income / card bill destination */
  toSourceId?: string
  /** Source account for transfers / card bills */
  fromSourceId?: string
  /** Present for transfer rows; card_bill pays down credit debt */
  transferPurpose?: "transfer" | "card_bill"
}
