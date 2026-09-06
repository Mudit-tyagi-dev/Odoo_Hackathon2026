import React from "react";

export const Textarea = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      maxLength,
      value,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold text-foreground tracking-wide"
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </label>
          )}
          {maxLength && (
            <span
              className={`text-xs ${
                currentLength > maxLength
                  ? "text-destructive font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={`
            w-full px-3.5 py-2.5 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground
            transition-colors duration-150 outline-none resize-y min-h-[90px]
            ${
              error
                ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                : "border-input focus:border-primary focus:ring-2 focus:ring-primary/10"
            }
            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error ? (
          <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
