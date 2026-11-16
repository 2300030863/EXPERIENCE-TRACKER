/**
 * Extract or format error code from various error response formats
 * @param {*} error - The error object, string, or status code
 * @param {string|number} defaultCode - Fallback code
 * @returns {string} - Formatted error code (e.g. "Error Code: 403")
 */
export const getErrorCode = (error, defaultCode = '500') => {
  if (!error) return `Error Code: ${defaultCode}`

  if (typeof error === 'number') {
    return `Error Code: ${error}`
  }

  if (typeof error === 'string') {
    const trimmed = error.trim()
    if (/^Error Code:/i.test(trimmed)) return trimmed
    if (/^[0-9]{3}$/.test(trimmed)) return `Error Code: ${trimmed}`
    if (/^ERR_/i.test(trimmed)) return `Error Code: ${trimmed}`
  }

  const status = error?.response?.status || error?.status
  const code = error?.response?.data?.code || error?.response?.data?.errorCode || error?.code

  if (code) return `Error Code: ${code}`
  if (status) return `Error Code: ${status}`

  return `Error Code: ${defaultCode}`
}

/**
 * Utility function to format error display - always shows error code
 * @param {*} error - The error object from API response
 * @param {string} defaultMessage - Fallback error code
 * @returns {string} - Error code string safe for frontend display
 */
export const getErrorMessage = (error, defaultMessage = '500') => {
  return getErrorCode(error, defaultMessage)
}

/**
 * Safely display toast error with error code format
 * @param {*} error - The error object
 * @param {string} defaultCode - Fallback code
 */
export const showErrorToast = (error, defaultCode = '500') => {
  const codeStr = getErrorCode(error, defaultCode)
  import('react-hot-toast').then(({ default: toast }) => {
    toast.error(codeStr)
  })
}

