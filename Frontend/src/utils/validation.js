/**
 * DealFlow360 Enterprise Custom Validation Engine
 * Features heavy checking, format verification, and strict business constraint rules.
 */

// Indian GSTIN regex: 2 digits state code + 10 chars PAN + 1 entity code + 1 Z + 1 check digit
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// E.164 International / 10-digit Indian phone regex
export const PHONE_REGEX = /^(\+91[\-\s]?)?[6789]\d{9}$|^(\+\d{1,3}[\-\s]?)?\d{7,14}$/;

// RFC 5322 standard email regex
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 6-digit Indian PIN / Postal code regex
export const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Heavy validation for Quotation / PO Deletion or Cancellation.
 * Enforces business rules, anti-spam, exact string match, and status protection.
 *
 * @param {Object} quotation - The quotation/PO record being targeted
 * @param {Object} inputData - User inputs { reason, explanation, confirmText, agreedToTerms }
 * @returns {Object} { isValid: boolean, isBlocked: boolean, blockedReason?: string, errors: Object }
 */
export function validateQuotationDeletion(quotation, inputData = {}) {
  const errors = {};
  let isBlocked = false;
  let blockedReason = null;

  if (!quotation) {
    return {
      isValid: false,
      isBlocked: true,
      blockedReason: "Target quotation record does not exist or has already been removed.",
      errors: { general: "Record not found" },
    };
  }

  // 1. Heavy Business Status Guard:
  // Cannot delete/cancel if already Confirmed, In Fulfillment, or Paid!
  const nonCancellableStatuses = ["Confirmed", "In Fulfillment", "Delivered", "Paid", "Processing"];
  if (nonCancellableStatuses.includes(quotation.status)) {
    isBlocked = true;
    blockedReason = `Action Blocked: Quotation / PO ${quotation.id} is in '${quotation.status}' status. Confirmed commercial commitments and active sales orders cannot be deleted or cancelled via the customer self-service portal. Please contact your dedicated Account Executive (${quotation.salesRep || "Sales Team"}) or submit a formal Change Request.`;
    return {
      isValid: false,
      isBlocked: true,
      blockedReason,
      errors: { status: blockedReason },
    };
  }

  const { reason, explanation, confirmText, agreedToTerms } = inputData;

  // 2. Cancellation Reason Category Validation
  const validReasons = [
    "budget_constraints",
    "project_postponed",
    "scope_altered",
    "competitor_selected",
    "vendor_reevaluation",
    "duplicate_entry",
    "other",
  ];

  if (!reason || reason.trim() === "") {
    errors.reason = "Please select a primary reason for cancellation.";
  } else if (!validReasons.includes(reason)) {
    errors.reason = "Invalid cancellation reason category selected.";
  }

  // 3. Detailed Business Justification Check (Heavy checking)
  const trimmedExplanation = (explanation || "").trim();
  if (!trimmedExplanation) {
    errors.explanation = "Detailed business justification is required.";
  } else if (trimmedExplanation.length < 15) {
    errors.explanation = `Justification too brief (${trimmedExplanation.length}/15 chars minimum). Please provide context for the sales team.`;
  } else if (trimmedExplanation.length > 500) {
    errors.explanation = `Justification exceeds 500 character limit (${trimmedExplanation.length}/500 chars).`;
  } else if (/^(.)\1{9,}$/.test(trimmedExplanation)) {
    errors.explanation = "Please provide a valid meaningful explanation rather than repetitive characters.";
  }

  // 4. Exact Quotation / PO Number Verification (Double confirmation check)
  const trimmedConfirm = (confirmText || "").trim();
  const expectedText = quotation.id.trim();
  if (!trimmedConfirm) {
    errors.confirmText = `Verification required: Type '${expectedText}' to authorize deletion.`;
  } else if (trimmedConfirm !== expectedText && trimmedConfirm.toUpperCase() !== "DELETE") {
    errors.confirmText = `Confirmation mismatch. You must type exactly '${expectedText}' or 'DELETE' (entered: '${trimmedConfirm}').`;
  }

  // 5. Legal / Audit Acknowledgement Checkbox
  if (!agreedToTerms) {
    errors.agreedToTerms = "You must acknowledge that this cancellation is irreversible and notifies sales & finance.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    isBlocked: false,
    errors,
  };
}

/**
 * Heavy validation for Counter-Offer Submissions.
 *
 * @param {Object} quotation - The quotation record
 * @param {Object} offerData - { requestedDiscountPercent, customAmount, message, contactEmail }
 * @returns {Object} { isValid: boolean, errors: Object, warnings: Object }
 */
export function validateCounterOffer(quotation, offerData = {}) {
  const errors = {};
  const warnings = {};

  const { requestedDiscountPercent, customAmount, message, contactEmail } = offerData;

  // 1. Discount Percentage validation
  const discount = Number(requestedDiscountPercent);
  if (isNaN(discount)) {
    errors.requestedDiscountPercent = "Discount percentage must be a valid number.";
  } else if (discount <= 0) {
    errors.requestedDiscountPercent = "Requested discount must be greater than 0%.";
  } else if (discount > 40) {
    errors.requestedDiscountPercent = "Maximum allowed customer counter-offer is 40%. For higher discounts, contact your Account Executive directly.";
  } else if (discount > 25) {
    warnings.requestedDiscountPercent = "Discounts above 25% require Level-3 VP & Finance approval and may take 24-48 hours.";
  }

  // 2. Custom Amount validation (if provided)
  if (customAmount !== undefined && customAmount !== "") {
    const amount = Number(customAmount);
    if (isNaN(amount) || amount <= 0) {
      errors.customAmount = "Proposed amount must be a positive number.";
    } else if (quotation && amount >= quotation.total) {
      errors.customAmount = `Counter-offer amount must be lower than the current total (₹${quotation.total.toLocaleString("en-IN")}).`;
    }
  }

  // 3. Justification Message validation
  const trimmedMessage = (message || "").trim();
  if (!trimmedMessage) {
    errors.message = "Please include a short message explaining the basis for your counter offer.";
  } else if (trimmedMessage.length < 15) {
    errors.message = `Message too short (${trimmedMessage.length}/15 chars). Example: 'Requesting 15% discount for bulk volume commitment'.`;
  } else if (trimmedMessage.length > 500) {
    errors.message = "Message exceeds 500 characters.";
  }

  // 4. Contact Email verification (if provided)
  if (contactEmail && !EMAIL_REGEX.test(contactEmail)) {
    errors.contactEmail = "Please enter a valid work email address.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Heavy validation for Customer Account Profile & Billing Details.
 */
export function validateAccountProfile(profileData = {}) {
  const errors = {};

  if (!profileData.companyName || profileData.companyName.trim().length < 3) {
    errors.companyName = "Company name must be at least 3 characters.";
  }

  if (!profileData.contactPerson || profileData.contactPerson.trim().length < 2) {
    errors.contactPerson = "Primary contact person name is required.";
  }

  if (!profileData.email || !EMAIL_REGEX.test(profileData.email)) {
    errors.email = "Valid corporate email address is required.";
  }

  if (!profileData.phone || !PHONE_REGEX.test(profileData.phone.replace(/[\s-]/g, ""))) {
    errors.phone = "Valid contact phone number is required (e.g. +91 98765 43210).";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Heavy validation for Tax and Address Details.
 */
export function validateAddressAndTax(addressData = {}) {
  const errors = {};

  if (!addressData.addressLine1 || addressData.addressLine1.trim().length < 5) {
    errors.addressLine1 = "Address Line 1 must be at least 5 characters.";
  }

  if (!addressData.city || addressData.city.trim().length < 2) {
    errors.city = "City is required.";
  }

  if (!addressData.state || addressData.state.trim().length < 2) {
    errors.state = "State / Province is required.";
  }

  if (!addressData.postalCode || !PIN_CODE_REGEX.test(addressData.postalCode.trim())) {
    errors.postalCode = "Valid 6-digit Indian PIN / Postal code required (e.g. 110001).";
  }

  if (addressData.gstin && addressData.gstin.trim() !== "") {
    const formattedGstin = addressData.gstin.trim().toUpperCase();
    if (!GSTIN_REGEX.test(formattedGstin)) {
      errors.gstin = "Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 07AAAAA0000A1Z5).";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
