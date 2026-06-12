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
        <label>{t("unit_name", "master")} <span style={{ color: "var(--red)" }}>*</span></label>
        <input name="name" value={form.name} onChange={onChange} autoFocus
          style={errors.name ? { borderColor: "var(--red)" } : {}} placeholder="e.g. Kilogram" />
        {errors.name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.name}</span>}
      </div>
      <div className="fg">
        <label>{t("short_name", "master")} <span style={{ color: "var(--red)" }}>*</span></label>
        <input name="short_name" value={form.short_name} onChange={onChange}
          style={errors.short_name ? { borderColor: "var(--red)" } : {}} placeholder="e.g. KG" />
        {errors.short_name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.short_name}</span>}
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

export default function Units() {
  const { t } = useLanguage();
  const { currentStore } = useAuth();
  return (
    <CrudPage
      title={t("units", "nav")}
      singular={t("singular_unit", "master")}
      resource="units"
      service={masterService}
      searchFields={["name", "short_name"]}
      storeFilter={true}
      extraLoader={async () => {
        const res = await masterService.getAll("stores");
        return { stores: Array.isArray(res.data) ? res.data : (res.data?.data || []) };
      }}
      tableColumns={[
        { label: t("col_name", "master"), render: (r) => <strong style={{ color: "var(--tx)" }}>{r.name}</strong> },
        {
          label: t("col_short_name", "master"), width: 120,
          render: (r) => (
            <span style={{ background: "var(--abg)", color: "var(--accent)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
              {r.short_name}
            </span>
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
      ]}
      emptyForm={{ name: "", short_name: "", store_id: currentStore?.id || "" }}
      toForm={(r) => ({ name: r.name, short_name: r.short_name, store_id: r.store_id || "" })}
      toPayload={(f) => ({ name: f.name.trim(), short_name: f.short_name.trim(), store_id: f.store_id || null })}
      validate={(f) => {
        const e = {};
        if (!f.name.trim()) e.name = t("unit_name_required", "master");
        if (!f.short_name.trim()) e.short_name = t("short_name_required", "master");
        return e;
      }}
      renderForm={FORM}
      modalWidth={420}
      deleteLabel={(r) => r.name}
    />
  );
}
