import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CrudPage from "../../components/CrudPage";
import masterService from "../../services/masterService";
import Button from "../component/Button";
import { useLanguage } from "../../context/LanguageContext";

const FORM = ({ form, onChange, errors }) => {
  const { t } = useLanguage();
  return (
    <div className="fg">
      <label>{t("value", "master")} <span style={{ color: "var(--red)" }}>*</span></label>
      <input name="value" value={form.value} onChange={onChange} autoFocus
        style={errors.value ? { borderColor: "var(--red)" } : {}} placeholder="e.g. Red, Large, Cotton" />
      {errors.value && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.value}</span>}
    </div>
  );
};

export default function AttributeValues() {
  const { t } = useLanguage();
  const { id: attributeId } = useParams();
  const navigate = useNavigate();

  const scopedService = {
    ...masterService,
    getAll: (resource) => masterService.getAll(resource, { attribute_id: attributeId }),
    create: (resource, data) => masterService.create(resource, { ...data, attribute_id: attributeId }),
  };

  return (
    <>
      <div style={{ padding: "12px 16px 0" }}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/master/attributes")}>
          <ArrowLeft size={13} /><span>{t("back_to_attributes", "master")}</span>
        </Button>
      </div>
      <CrudPage
        title={t("attribute_values", "nav")}
        singular={t("singular_value", "master")}
        resource="attribute-values"
        service={scopedService}
        searchFields={["value"]}
        tableColumns={[
          { label: t("value", "master"), render: (r) => <strong style={{ color: "var(--tx)" }}>{r.value}</strong> },
          { label: t("col_attribute", "master"), width: 160, render: (r) => <span style={{ color: "var(--tx3)", fontSize: 12 }}>{r.attribute?.name || "—"}</span> },
        ]}
        emptyForm={{ value: "" }}
        toForm={(r) => ({ value: r.value })}
        toPayload={(f) => ({ value: f.value.trim(), attribute_id: attributeId })}
        validate={(f) => {
          const e = {};
          if (!f.value.trim()) e.value = t("value_required", "master");
          return e;
        }}
        renderForm={FORM}
        modalWidth={400}
        deleteLabel={(r) => r.value}
      />
    </>
  );
}
