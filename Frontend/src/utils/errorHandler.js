import { getSavedLanguage } from "./authLanguage";

/**
 * Centralized Error & Alert Formatter
 */

// Generic fallback message — the ONLY translated error. The language is the
// single selection saved by Login/Signup (localStorage "language"); every
// other message is returned verbatim from the API/error exactly as before.
const GENERIC_ERROR_MESSAGES = {
  en: "An unexpected error occurred. Please try again or contact support.",
  hi: "एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें या सहायता से संपर्क करें।",
  gu: "અનપેક્ષિત ભૂલ આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો અથવા સપોર્ટનો સંપર્ક કરો.",
};

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

  return GENERIC_ERROR_MESSAGES[getSavedLanguage()] || GENERIC_ERROR_MESSAGES.en;
}

export function formatValidationErrors(errors) {
  if (!errors || Object.keys(errors).length === 0) return [];
  return Object.entries(errors).map(([field, msg]) => ({
    field,
    message: msg,
  }));
}
