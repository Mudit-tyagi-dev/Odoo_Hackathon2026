/**
 * Centralized Error & Alert Formatter
 */

export function parseApiError(error) {
  if (typeof error === "string") return error;

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
