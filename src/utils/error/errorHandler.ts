// Handle errors if it's array ( fields error case )
export const handleErrorFields = (errorData: Record<string, any>) => {
  if (!errorData) return

  const errors: string[] = []
  for (const value of Object.values(errorData)) {
    if (Array.isArray(value)) {
      errors.push(...value.map(String))
      continue
    }

    if (value) {
      errors.push(String(value))
    }
  }

  return errors.join('\n')
}
