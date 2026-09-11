/** Client-side presentation data; no backend identity or read state is implied. */
export type MessageDetailsContent = {
  title: string
  body: string
  createdAt: string
  sender?: { name: string; role: string }
}
