import { Link } from "react-router-dom";
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
        <label>{t("attribute_name", "master")} <span style={{ color: "var(--red)" }}>*</span></label>
        <input name="name" value={form.name} onChange={onChange} autoFocus
          style={errors.name ? { borderColor: "var(--red)" } : {}} placeholder="e.g. Color, Size, Material" />
        {errors.name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.name}</span>}
      </div>

      <div className="fg">
        <label
          style={{
            display: "inline-flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
            padding: "10px 14px",
            borderRadius: "var(--r)",
            border: form.allow_multi_select ? "1.5px solid var(--accent)" : "1px solid var(--bd)",
            background: form.allow_multi_select ? "var(--abg)" : "var(--bg3)",
            transition: "all 0.15s",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <input
            type="checkbox"
            name="allow_multi_select"
            checked={!!form.allow_multi_select}
            onChange={onChange}
            style={{ accentColor: "var(--accent)", width: 14, height: 14, marginTop: 2, flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tx)" }}>
              Allow Multiple Selections
            </div>
            <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 2 }}>
              When enabled, users can pick <strong>multiple values</strong> from this attribute group
              in Sales, Purchases, and POS (e.g. selecting Red <em>and</em> Blue for Color).
              When disabled, only one value can be selected at a time.
            </div>
          </div>
        </label>
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
    </>
  );
};

export default function Attributes() {
  const { t } = useLanguage();
  const { currentStore } = useAuth();
  return (
    <CrudPage
      title={t("attributes", "nav")}
      singular={t("singular_attribute", "master")}
      resource="attributes"
      service={masterService}
      searchFields={["name"]}
      storeFilter={true}
      extraLoader={async () => {
        const res = await masterService.getAll("stores");
        return { stores: Array.isArray(res.data) ? res.data : (res.data?.data || []) };
      }}
      tableColumns={[
        { label: t("col_name", "master"), render: (r) => <strong style={{ color: "var(--tx)" }}>{r.name}</strong> },
        {
          label: "Selection Mode", width: 130,
          render: (r) => r.allow_multi_select ? (
            <span style={{ background: "var(--abg)", color: "var(--accent)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
              Multi-Select
            </span>
          ) : (
            <span style={{ color: "var(--tx3)", fontSize: 11 }}>Single</span>
          ),
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
          label: t("col_values", "master"), width: 120,
          render: (r) => (
            <Link
              to={`/master/attributes/${r.id}/values`}
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--abg)", padding: "2px 8px", borderRadius: "var(--r)", textDecoration: "none" }}
            >
              {r.values_count ?? 0} values →
            </Link>
          ),
        },
      ]}
      emptyForm={{ name: "", allow_multi_select: false, store_id: currentStore?.id || "" }}
      toForm={(r) => ({ name: r.name, allow_multi_select: r.allow_multi_select ?? false, store_id: r.store_id || "" })}
      toPayload={(f) => ({ name: f.name.trim(), allow_multi_select: !!f.allow_multi_select, store_id: f.store_id || null })}
      validate={(f) => {
        const e = {};
        if (!f.name.trim()) e.name = t("attribute_name_required", "master");
        return e;
      }}
      renderForm={FORM}
      modalWidth={460}
      deleteLabel={(r) => r.name}
    />
  );
}
