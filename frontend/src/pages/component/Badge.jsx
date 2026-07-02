export default function Badge({ children, variant = "default" }) {
  const variants = {
    default: { background: "var(--bg3)", color: "var(--tx2)" },
    success: { background: "var(--gbg)", color: "var(--green)" },
    danger: { background: "var(--rbg)", color: "var(--red)" },
    warning: { background: "var(--ambg)", color: "var(--amber)" },
    info: { background: "var(--abg)", color: "var(--accent)" },
    purple: { background: "var(--pbg)", color: "var(--purple)" },
  };

  return (
    <span className="sta" style={variants[variant]}>
      {children}
    </span>
  );
}
