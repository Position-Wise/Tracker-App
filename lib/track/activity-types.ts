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
}
