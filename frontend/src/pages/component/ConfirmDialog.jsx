import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  icon,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width={380}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        {icon && (
          <div
            className="w-10 h-10 flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--rbg)", borderRadius: "var(--r)" }}
          >
            {icon}
          </div>
        )}
        <div className="flex-shrink-0">
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--tx)",
              marginBottom: 4,
            }}
          >
            {title}
          </p>
          {message && (
            <p style={{ fontSize: 12.5, color: "var(--tx3)", lineHeight: 1.5 }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
