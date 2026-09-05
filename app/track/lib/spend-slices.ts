import type { CategorySpendSlice } from "@track/lib/expense-browse"

/** Shared category tones for the expense half-donut and calendar rings. */
export const SLICE_TONES = [
  "#F4F7FB",
  "#C5D0DE",
  "#8FA0B8",
  "#5CE1E6",
  "#7B8CFF",
  "#A78BFA",
  "#67E8F9",
]

export const MAX_SLICES = 6

export type ColoredSpendSlice = CategorySpendSlice & {
  color: string
  pct: number
}

export function collapseSpendSlices(
  raw: CategorySpendSlice[],
  total: number
): CategorySpendSlice[] {
  if (total <= 0 || raw.length === 0) return []
  const ranked = [...raw].sort((a, b) => b.total - a.total)
  if (ranked.length <= MAX_SLICES) return ranked
  return [
    ...ranked.slice(0, MAX_SLICES - 1),
    {
      categoryId: "other",
      name: "Other",
      total: ranked
        .slice(MAX_SLICES - 1)
        .reduce((sum, row) => sum + row.total, 0),
    },
  ]
}

export function colorMapForCategories(
  ranked: CategorySpendSlice[]
): Map<string, string> {
  const map = new Map<string, string>()
  ranked.forEach((row, index) => {
    map.set(row.categoryId, SLICE_TONES[index % SLICE_TONES.length])
  })
  map.set("other", SLICE_TONES[Math.min(MAX_SLICES - 1, SLICE_TONES.length - 1)])
  return map
}

export function colorSpendSlices(
  raw: CategorySpendSlice[],
  total: number,
  colorByCategory?: Map<string, string>
): ColoredSpendSlice[] {
  return collapseSpendSlices(raw, total).map((row, index) => ({
    ...row,
    color:
      colorByCategory?.get(row.categoryId) ??
      SLICE_TONES[index % SLICE_TONES.length],
    pct: Math.round((row.total / total) * 100),
  }))
}
