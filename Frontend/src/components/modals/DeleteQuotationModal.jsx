import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, Trash2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Badge from "../ui/Badge";
import { validateQuotationDeletion } from "../../utils/validation";
import { useToast } from "../ui/Toast";

export const DeleteQuotationModal = ({
  isOpen,
  onClose,
  quotation,
  onDeleteSuccess,
}) => {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [blockedReason, setBlockedReason] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or quotation changes
  useEffect(() => {
    if (isOpen && quotation) {
      setReason("");
      setExplanation("");
      setConfirmText("");
      setAgreedToTerms(false);
      setErrors({});

      // Pre-check if quotation is in a non-cancellable status (Heavy status check)
      const nonCancellable = ["Confirmed", "In Fulfillment", "Delivered", "Paid", "Processing"];
      if (nonCancellable.includes(quotation.status)) {
        setBlockedReason(
          `Action Blocked: ${quotation.id} is already in '${quotation.status}' status. Confirmed orders and binding quotations cannot be cancelled or deleted from the customer self-service portal. Please contact your Account Executive (${quotation.salesRep || "Sales Rep"}) for order adjustments.`
        );
      } else {
        setBlockedReason(null);
      }
    }
  }, [isOpen, quotation]);

  if (!quotation) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Run heavy custom validation
    const validationResult = validateQuotationDeletion(quotation, {
      reason,
      explanation,
      confirmText,
      agreedToTerms,
    });

    if (validationResult.isBlocked) {
      setBlockedReason(validationResult.blockedReason);
      toast.error(
        validationResult.blockedReason,
        "Cancellation Blocked by Governance Rules"
      );
      return;
    }

    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      const firstError = Object.values(validationResult.errors)[0];
      toast.error(firstError, "Validation Check Failed");
      return;
    }

    // Passed all heavy validation checks -> execute cancellation
    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(
        `Quotation ${quotation.id} was successfully cancelled. Commercial records updated and ${quotation.salesRep || "sales rep"} was notified.`,
        "Cancellation Confirmed"
      );
      if (onDeleteSuccess) {
        onDeleteSuccess(quotation.id);
      }
      onClose();
    }, 900);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel / Delete Quotation`}
      description="Perform safe commercial record cancellation with audit logging"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Record Overview Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{quotation.id}</span>
              <Badge variant={quotation.status}>{quotation.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sales Rep: <span className="font-medium text-slate-700">{quotation.salesRep}</span> · Total:{" "}
              <span className="font-semibold text-slate-900">
                ₹{quotation.total ? quotation.total.toLocaleString("en-IN") : "0"}
              </span>
            </p>
          </div>
          <div className="p-2.5 bg-red-100/70 text-red-600 rounded-lg">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>

        {/* Heavy Status Block Alert (Demonstrating Failure Condition) */}
        {blockedReason ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-900">
                  Governance Block: Operation Not Permitted
                </h4>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  {blockedReason}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-red-200/60 flex justify-end">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Warning Banner */}
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold">Irreversible Action</p>
                <p className="mt-0.5 text-amber-800">
                  Cancelling will close active negotiations, notify the sales team, and mark this commercial quotation as inactive.
                </p>
              </div>
            </div>

            {/* Field 1: Reason Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) setErrors((prev) => ({ ...prev, reason: null }));
                }}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white text-slate-900 outline-none transition
                  ${
                    errors.reason
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  }
                `}
              >
                <option value="">-- Select a primary cancellation reason --</option>
                <option value="budget_constraints">Budget constraints / Project freeze</option>
                <option value="project_postponed">Project timeline postponed to next quarter</option>
                <option value="scope_altered">Scope / Technical requirements altered</option>
                <option value="competitor_selected">Selected another vendor / competitor pricing</option>
                <option value="vendor_reevaluation">Internal vendor procurement re-evaluation</option>
                <option value="duplicate_entry">Duplicate quotation issued by mistake</option>
                <option value="other">Other business reasons</option>
              </select>
              {errors.reason && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  {errors.reason}
                </p>
              )}
            </div>

            {/* Field 2: Detailed Explanation (Heavy checking min 15 chars) */}
            <Textarea
              label="Business Justification & Details"
              required
              maxLength={500}
              value={explanation}
              error={errors.explanation}
              placeholder="Please elaborate with at least 15 characters (e.g. 'Project budget frozen until Q4 review')..."
              onChange={(e) => {
                setExplanation(e.target.value);
                if (errors.explanation)
                  setErrors((prev) => ({ ...prev, explanation: null }));
              }}
            />

            {/* Field 3: Exact Quotation ID Typing (Security Match) */}
            <div>
              <Input
                label={`Type '${quotation.id}' to confirm authorization`}
                required
                value={confirmText}
                error={errors.confirmText}
                placeholder={quotation.id}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  if (errors.confirmText)
                    setErrors((prev) => ({ ...prev, confirmText: null }));
                }}
                helperText={`Safety check: Must type exact quotation ID '${quotation.id}' or 'DELETE'`}
              />
            </div>

            {/* Field 4: Legal & Audit Acknowledgement */}
            <div className="space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (errors.agreedToTerms)
                      setErrors((prev) => ({ ...prev, agreedToTerms: null }));
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I certify that I am authorized on behalf of <strong className="text-slate-800">Acme Corporation</strong> to cancel this commercial request and notify all parties.
                </span>
              </label>
              {errors.agreedToTerms && (
                <p className="text-xs text-red-600 font-medium pl-6">
                  {errors.agreedToTerms}
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Keep Quotation
              </Button>
              <Button
                type="submit"
                variant="destructive"
                loading={isSubmitting}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Cancellation</span>
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default DeleteQuotationModal;
