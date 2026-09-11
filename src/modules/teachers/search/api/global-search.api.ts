import { mockGlobalSearchResults } from '../mocks/global-search.mock'

export async function searchGlobally(query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  await new Promise((resolve) => {
    window.setTimeout(resolve, 500)
  })

  if (!normalizedQuery) return []

  return mockGlobalSearchResults.filter((item) => {
    return (
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.subtitle?.toLowerCase().includes(normalizedQuery) ||
      item.type.toLowerCase().includes(normalizedQuery)
    )
  })
}
