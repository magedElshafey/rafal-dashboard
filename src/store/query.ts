import { create } from 'zustand'

interface Actions {
  setQuery: (data: { [key: string]: any }) => void
  removeQuery: (name: string) => void
  clearQuery: () => void
}
interface State {
  query: { [key: string]: any }
}

export const useQueryStore = create<State & Actions>((set) => ({
  query: {},
  setQuery(query) {
    const isPageOnly = Object.keys(query).every((e) => e === 'page')
    if (!isPageOnly) query.page = 1
    set((state) => {
      return { ...state, query: { ...state.query, ...query } }
    })
  },
  removeQuery(name: string) {
    set((state) => {
      const newState = { ...state }
      delete newState.query[name]
      return newState
    })
  },
  clearQuery() {
    set((state) => {
      return { ...state, query: {} }
    })
  },
}))
