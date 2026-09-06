import React from "react";

export const Card = ({ children, className = "", ...props }) => (
  <div
    className={`bg-card text-card-foreground rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`p-5 sm:p-6 border-b border-border ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "", ...props }) => (
  <h3
    className={`text-base sm:text-lg font-semibold text-card-foreground tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-xs sm:text-sm text-muted-foreground mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = "", ...props }) => (
  <div className={`p-5 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = "", ...props }) => (
  <div
    className={`p-5 sm:p-6 border-t border-border bg-muted/20 text-card-foreground rounded-b-xl ${className}`}
    {...props}
  >
    {children}
  </div>
);
