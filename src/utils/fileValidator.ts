export const fileValidator = (values: any) => {
  const pattern = /\.(pdf|png|jpg|jpeg)$/i
  const fileValues = Array.from(values)
  fileValues.forEach((value) => {
    if (value instanceof File) {
      if (!pattern.test(value.name)) {
        return false
      }
    }
  })

  return true
}
