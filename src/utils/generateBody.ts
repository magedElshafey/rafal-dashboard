export default function generateBody(data: Record<string, any>, nullAble: boolean = false) {
  const formData = new FormData()
  for (const item in data) {
    if (Array.isArray(data[item]) && data[item].length > 0) {
      data[item].forEach((ele: any, i: number) => formData.append(item + `[${i}]`, ele))
    } else {
      const value = data[item]
      if (!nullAble) {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(item, data[item])
        }
      } else formData.append(item, data[item])
    }
  }
  return formData
}
