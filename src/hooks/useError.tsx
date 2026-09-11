const useError = () => {
  const handleErrorFromApi = (formRef: any, errors: any) => {
    Object.entries(errors?.response?.data.errors).forEach((entry) => {
      const [key, errorMsg] = entry as [string, string[]]
      formRef?.current?.setError(key, { message: errorMsg?.[0] })
    })
  }

  return { handleErrorFromApi }
}

export default useError
