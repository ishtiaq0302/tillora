import { X } from "lucide-react";
import { useEffect, useState } from "react";

function useResponsiveColumns(columns) {
  const getColumns = () => {
    const w = window.innerWidth;
    if (w < 640) return columns.sm ?? 1;
    if (w < 1024) return columns.md ?? columns.sm ?? 2;
    return columns.lg ?? columns.md ?? columns.sm ?? 2;
  };

  const [cols, setCols] = useState(getColumns);

  useEffect(() => {
    const handler = () => setCols(getColumns());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return cols;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = 480,
  columns = { sm: 1, md: 2, lg: 2 },
}) {
  const cols =
    typeof columns === "number" ? columns : useResponsiveColumns(columns);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full mx-3 sm:mx-4 overflow-hidden"
        style={{
          maxWidth: width,
          background: "var(--bg2)",
          border: "1px solid var(--bd)",
          borderRadius: "var(--r2)",
          boxShadow: "var(--shadow)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        {title && (
          <div
            className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4"
            style={{ borderBottom: "1px solid var(--bd)" }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>
              {title}
            </span>
            <button onClick={onClose} className="hbtn">
              <X size={14} />
            </button>
          </div>
        )}

        {/* BODY */}
        <div
          className="px-4 sm:px-5 py-4"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "16px 24px",
            maxHeight: "65vh",
            overflowY: "auto",
          }}
        >
          {children}
        </div>

        {/* FOOTER */}
        {footer && (
          <div
            className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-5 py-3 [&>*]:w-full sm:[&>*]:w-auto"
            style={{ borderTop: "1px solid var(--bd)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
