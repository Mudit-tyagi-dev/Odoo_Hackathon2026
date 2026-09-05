import React, { useState } from "react";
import { User, Building2, MapPin, ShieldCheck, Check, Save } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { validateAccountProfile, validateAddressAndTax } from "../utils/validation";
import { useToast } from "../components/ui/Toast";

export const Account = ({ user, onUpdateUser }) => {
  const toast = useToast();

  const [formData, setFormData] = useState({
    companyName: user?.customerOrg?.name || "Acme Corporation",
    contactPerson: user?.name || "Rohan Kapoor",
    email: user?.email || "rohan.kapoor@acme-corp.com",
    phone: user?.phone || "+91 98200 45678",
    gstin: user?.customerOrg?.gstin || "27AAACA1234A1Z5",
    pan: user?.customerOrg?.pan || "AAACA1234A",
    addressLine1: user?.customerOrg?.addressLine1 || "Tech Park IV, 5th Floor, Tower B",
    addressLine2: user?.customerOrg?.addressLine2 || "Outer Ring Road, Kadubeesanahalli",
    city: user?.customerOrg?.city || "Bengaluru",
    state: user?.customerOrg?.state || "Karnataka",
    postalCode: user?.customerOrg?.postalCode || "560103",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Run custom heavy validation
    const profileValidation = validateAccountProfile({
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
    });

    const taxValidation = validateAddressAndTax({
      addressLine1: formData.addressLine1,
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode,
      gstin: formData.gstin,
    });

    const allErrors = {
      ...profileValidation.errors,
      ...taxValidation.errors,
    };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const firstError = Object.values(allErrors)[0];
      toast.error(firstError, "Profile Validation Error");
      return;
    }

    setErrors({});
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          name: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          customerOrg: {
            ...user?.customerOrg,
            name: formData.companyName,
            gstin: formData.gstin,
            pan: formData.pan,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
          },
        });
      }
      toast.success(
        "Commercial profile and tax credentials saved successfully.",
        "Account Updated"
      );
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">
          SETTINGS
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
          Account & Legal Entity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your enterprise procurement profile, billing address, and GSTIN tax details
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company & Contact Profile */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Company & Authorized Representative
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Legal Name"
              required
              value={formData.companyName}
              error={errors.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
            />
            <Input
              label="Authorized Procurement Contact"
              required
              value={formData.contactPerson}
              error={errors.contactPerson}
              onChange={(e) => handleChange("contactPerson", e.target.value)}
            />
            <Input
              label="Corporate Work Email"
              type="email"
              required
              value={formData.email}
              error={errors.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            <Input
              label="Contact Phone (with country code)"
              required
              value={formData.phone}
              error={errors.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              helperText="Format: +91 98765 43210"
            />
          </div>
        </div>

        {/* Tax & GST Credentials (Heavy checking) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Tax ID & Statutory Compliance
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GSTIN Number (15-character format)"
              value={formData.gstin}
              error={errors.gstin}
              onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
              helperText="Validated via GSTN format: 22AAAAA0000A1Z5"
            />
            <Input
              label="Permanent Account Number (PAN)"
              value={formData.pan}
              error={errors.pan}
              onChange={(e) => handleChange("pan", e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* Registered Billing Address */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Registered Billing & Dispatch Address
            </h3>
          </div>

          <div className="space-y-4">
            <Input
              label="Address Line 1"
              required
              value={formData.addressLine1}
              error={errors.addressLine1}
              onChange={(e) => handleChange("addressLine1", e.target.value)}
            />
            <Input
              label="Address Line 2 (Optional)"
              value={formData.addressLine2}
              onChange={(e) => handleChange("addressLine2", e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                required
                value={formData.city}
                error={errors.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
              <Input
                label="State"
                required
                value={formData.state}
                error={errors.state}
                onChange={(e) => handleChange("state", e.target.value)}
              />
              <Input
                label="Postal PIN Code (6 digits)"
                required
                value={formData.postalCode}
                error={errors.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                helperText="Must be valid 6-digit PIN"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="md"
            loading={isSaving}
            className="gap-2 px-6"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Billing Changes</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Account;
