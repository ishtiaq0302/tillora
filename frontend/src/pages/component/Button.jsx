export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  className = "",
}) {
  const sizes = {
    sm: { padding: "4px 10px", fontSize: 11.5 },
    md: { padding: "6px 13px", fontSize: 12 },
    lg: { padding: "8px 16px", fontSize: 13 },
  };

  const variants = {
    primary: { background: "var(--accent)", color: "white", border: "none" },
    secondary: {
      background: "var(--bg3)",
      color: "var(--tx2)",
      border: "1px solid var(--bd)",
    },
    danger: { background: "var(--red)", color: "white", border: "none" },
    ghost: {
      background: "transparent",
      color: "var(--tx2)",
      border: "1px solid var(--bd)",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${className}`}
      style={{
        ...variants[variant],
        ...sizes[size],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
