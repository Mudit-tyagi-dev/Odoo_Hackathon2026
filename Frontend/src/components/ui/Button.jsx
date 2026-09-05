const Button = ({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
}) => {

  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 hover:bg-gray-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-4 py-2
        rounded-lg
        font-medium
        transition
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${styles[variant]}
      `}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

export default Button;