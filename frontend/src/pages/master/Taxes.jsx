import CrudPage from "../../components/CrudPage";
import masterService from "../../services/masterService";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const FORM = ({ form, onChange, errors, extras }) => {
  const { t } = useLanguage();
  const { currentStore } = useAuth();
  const stores = extras?.stores || [];
  return (
    <>
      <div className="fg">
        <label>{t("tax_name", "master")} <span style={{ color: "var(--red)" }}>*</span></label>
        <input name="name" value={form.name} onChange={onChange} autoFocus
          style={errors.name ? { borderColor: "var(--red)" } : {}} placeholder="e.g. GST" />
        {errors.name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.name}</span>}
      </div>
      <div className="fg">
        <label>{t("rate", "master")} <span style={{ color: "var(--red)" }}>*</span></label>
        <input name="rate" type="number" step="0.01" min="0" max="100" value={form.rate} onChange={onChange}
          style={errors.rate ? { borderColor: "var(--red)" } : {}} placeholder="e.g. 18" />
        {errors.rate && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.rate}</span>}
      </div>
      <div className="fg">
        <label>{t("tax_type", "master")}</label>
        <select name="tax_type" value={form.tax_type} onChange={onChange}>
          <option value="percentage">{t("percentage", "master")}</option>
          <option value="fixed">{t("fixed_amount", "master")}</option>
        </select>
      </div>
      {currentStore?.id == null && stores.length > 0 && (
        <div className="fg">
          <label>{t("store_availability", "master")}</label>
          <select name="store_id" value={form.store_id || ""} onChange={onChange}>
            <option value="">{t("all_stores", "master")}</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <div className="fg">
        <label>{t("status", "master")}</label>
        <select name="is_active" value={form.is_active.toString()} onChange={onChange}>
          <option value="true">{t("active", "master")}</option>
          <option value="false">{t("inactive", "master")}</option>
        </select>
      </div>
    </>
  );
};

export default function Taxes() {
  const { t } = useLanguage();
  const { currentStore } = useAuth();
  return (
    <CrudPage
      title={t("taxes", "nav")}
      singular={t("singular_tax", "master")}
      resource="taxes"
      service={masterService}
      searchFields={["name", "tax_type"]}
      storeFilter={true}
      extraLoader={async () => {
        const res = await masterService.getAll("stores");
        return { stores: Array.isArray(res.data) ? res.data : (res.data?.data || []) };
      }}
      tableColumns={[
        { label: t("col_name", "master"), render: (r) => <strong style={{ color: "var(--tx)" }}>{r.name}</strong> },
        {
          label: t("col_rate", "master"), width: 100,
          render: (r) => (
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
              {r.rate}{r.tax_type === "percentage" ? "%" : " (fixed)"}
            </span>
          ),
        },
        {
          label: t("col_type", "master"), width: 110,
          render: (r) => <span style={{ color: "var(--tx3)", fontSize: 12 }}>{r.tax_type === "percentage" ? t("percentage", "master") : t("fixed", "master")}</span>,
        },
        {
          label: t("col_store", "master"), width: 140,
          render: (r, extras) => {
            if (!r.store_id) return <span style={{ color: "var(--tx3)" }}>{t("all_stores", "master")}</span>;
            const store = extras?.stores?.find((s) => s.id === r.store_id);
            return store ? (
              <span style={{ background: "var(--abg)", color: "var(--accent)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>
                {store.name}
              </span>
            ) : <span style={{ color: "var(--tx3)" }}>—</span>;
          },
        },
        {
          label: t("col_status", "master"), width: 100,
          render: (r) => <span className={`sta ${r.is_active ? "ok" : "er"}`}>{r.is_active ? t("active", "master") : t("inactive", "master")}</span>,
        },
      ]}
      emptyForm={{ name: "", rate: "", tax_type: "percentage", store_id: currentStore?.id || "", is_active: true }}
      toForm={(r) => ({ name: r.name, rate: r.rate ?? "", tax_type: r.tax_type || "percentage", store_id: r.store_id || "", is_active: r.is_active ?? true })}
      toPayload={(f) => ({ name: f.name.trim(), rate: Number(f.rate), tax_type: f.tax_type, store_id: f.store_id || null, is_active: f.is_active })}
      validate={(f) => {
        const e = {};
        if (!f.name.trim()) e.name = t("tax_name_required", "master");
        if (f.rate === "" || f.rate === null) e.rate = t("rate_required", "master");
        else if (isNaN(Number(f.rate)) || Number(f.rate) < 0) e.rate = t("rate_invalid", "master");
        return e;
      }}
      booleanFields={["is_active"]}
      renderForm={FORM}
      modalColumns={{ sm: 1, md: 2 }}
      modalWidth={520}
      deleteLabel={(r) => r.name}
    />
  );
}
