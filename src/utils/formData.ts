export const printFormData = (formData: FormData) => {
  const entries: Record<string, string> = {}

  for (const [key, value] of formData.entries()) {
    entries[key] = value.toString()
  }

  console.table(entries)
}
