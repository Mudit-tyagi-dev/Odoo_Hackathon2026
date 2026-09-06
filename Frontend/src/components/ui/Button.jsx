import React from "react";

const variantStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs focus-visible:ring-ring",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring",
  destructive: "bg-destructive text-white hover:bg-destructive/90 shadow-xs focus-visible:ring-destructive",
  outline: "border border-input bg-card text-foreground hover:bg-muted hover:text-foreground shadow-2xs focus-visible:ring-ring",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring",
  link: "text-primary underline-offset-4 hover:underline p-0 h-auto focus-visible:ring-ring",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 py-2 text-sm rounded-lg",
  lg: "h-11 px-6 text-base rounded-lg",
  icon: "h-9 w-9 p-0 rounded-lg justify-center",
};

export const Button = React.forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      className = "",
      disabled = false,
      loading = false,
      type = "button",
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        onClick={onClick}
        className={`
          inline-flex items-center justify-center font-medium transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer
          ${variantStyles[variant] || variantStyles.primary}
          ${sizeStyles[size] || sizeStyles.md}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;