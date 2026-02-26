export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(cents: number): string {
  return (cents / 100).toFixed(2) + ' €'
}

export function calculateServiceFee(priceEuros: number): {
  vlasnik: number
  skupiKomisija: number
  stripeFee: number
  total: number
} {
  const skupiKomisija = priceEuros * 0.05
  const stripeFee = priceEuros * 0.015 + 0.25
  const total = priceEuros + skupiKomisija + stripeFee

  return {
    vlasnik: priceEuros,
    skupiKomisija: Math.round(skupiKomisija * 100) / 100,
    stripeFee: Math.round(stripeFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}
