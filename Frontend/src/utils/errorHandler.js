/**
 * Centralized Error & Alert Formatter
 */

export function parseApiError(error) {
  if (typeof error === "string") return error;

  if (typeof error?.response?.data?.detail === "string") {
    return error.response.data.detail;
  }

  if (Array.isArray(error?.response?.data?.detail)) {
    const messages = error.response.data.detail
      .map((item) => item.msg || item.message)
      .filter(Boolean);
    if (messages.length > 0) return messages.join(", ");
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  if (error?.message) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again or contact support.";
}

export function formatValidationErrors(errors) {
  if (!errors || Object.keys(errors).length === 0) return [];
  return Object.entries(errors).map(([field, msg]) => ({
    field,
    message: msg,
  }));
}
