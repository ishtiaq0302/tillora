import { Trash2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { useLanguage } from "../../context/LanguageContext";

export default function DeleteDialog({ isOpen, onClose, onConfirm, label = "this record" }) {
  const { t } = useLanguage();
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t("delete_record", "common")}
      message={
        <>
          {t("delete", "common")} <strong>{label}</strong>? {t("cannot_be_undone", "common")}
        </>
      }
      confirmLabel={t("delete", "common")}
      cancelLabel={t("cancel", "common")}
      variant="danger"
      icon={<Trash2 size={18} style={{ color: "var(--red)" }} />}
    />
  );
}
