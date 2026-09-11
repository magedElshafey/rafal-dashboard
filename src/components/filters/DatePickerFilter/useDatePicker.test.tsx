import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useDatePicker from './useDatePicker'

const queryMocks = vi.hoisted(() => ({
  forwardAddQuery: vi.fn(),
  forwardDeleteQuery: vi.fn(),
  forwardReplaceQueries: vi.fn(),
  forwardQuery: {} as Record<string, string>,
}))
vi.mock('@/store/queryContext/useQueryContext', () => ({ useQuery: () => queryMocks }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

describe('range DatePickerFilter URL commits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryMocks.forwardQuery = {}
  })
  it('keeps an incomplete draft local and commits a complete range atomically', () => {
    const { result } = renderHook(() =>
      useDatePicker({ name: 'range', mode: 'range', queryName: { start: 'date_from', end: 'date_to' } })
    )
    act(() => result.current.handleSelect({ from: new Date(2026, 7, 1), to: undefined }))
    expect(queryMocks.forwardReplaceQueries).not.toHaveBeenCalled()
    act(() => result.current.handleSelect({ from: undefined, to: new Date(2026, 7, 31) }))
    expect(queryMocks.forwardReplaceQueries).not.toHaveBeenCalled()
    act(() => result.current.handleSelect({ from: new Date(2026, 7, 1), to: new Date(2026, 7, 31) }))
    expect(queryMocks.forwardReplaceQueries).toHaveBeenCalledWith(['date_from', 'date_to'], {
      date_from: '2026-08-01',
      date_to: '2026-08-31',
    })
  })
  it('does not navigate when the completed range is already active', () => {
    queryMocks.forwardQuery = { date_from: '2026-08-01', date_to: '2026-08-31' }
    const { result } = renderHook(() =>
      useDatePicker({ name: 'range', mode: 'range', queryName: { start: 'date_from', end: 'date_to' } })
    )
    act(() => result.current.handleSelect({ from: new Date(2026, 7, 1), to: new Date(2026, 7, 31) }))
    expect(queryMocks.forwardReplaceQueries).not.toHaveBeenCalled()
  })
  it('clears both range names atomically', () => {
    const { result } = renderHook(() =>
      useDatePicker({ name: 'range', mode: 'range', queryName: { start: 'date_from', end: 'date_to' } })
    )
    act(() => result.current.removeQueryFilter())
    expect(queryMocks.forwardReplaceQueries).toHaveBeenCalledWith(['date_from', 'date_to'], {})
  })
})
