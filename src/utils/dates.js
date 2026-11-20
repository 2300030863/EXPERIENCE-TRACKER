import { format } from 'date-fns'

/**
 * Date-only helpers. The API sends dates as plain 'YYYY-MM-DD' strings.
 * `new Date('2026-11-20')` is parsed as UTC midnight, which shows the PREVIOUS day in
 * time zones behind UTC (the Americas). These helpers always build a local date instead.
 */
export const parseLocalDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value))
  if (!match) {
    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export const toDateInputValue = (value) => {
  const d = parseLocalDate(value)
  return d ? format(d, 'yyyy-MM-dd') : ''
}

export const todayString = () => format(new Date(), 'yyyy-MM-dd')

export const formatDisplayDate = (value, pattern = 'MMM dd, yyyy') => {
  const d = parseLocalDate(value)
  return d ? format(d, pattern) : 'N/A'
}

/** True when a 'YYYY-MM-DD' date is before today (string compare is safe for ISO dates). */
export const isBeforeToday = (value) => {
  const v = toDateInputValue(value)
  return Boolean(v) && v < todayString()
}
