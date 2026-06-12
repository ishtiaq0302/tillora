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
        <label>{t("col_name", "master")} <span style={{ color: "var(--red)" }}>*</span></label>
        <input name="name" value={form.name} onChange={onChange} autoFocus
          style={errors.name ? { borderColor: "var(--red)" } : {}} placeholder="Supplier name" />
        {errors.name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.name}</span>}
      </div>
      <div className="fg">
        <label>{t("phone", "master")}</label>
        <input name="phone" value={form.phone} onChange={onChange} placeholder="+92-300-0000000" />
      </div>
      <div className="fg">
        <label>{t("email", "master")}</label>
        <input name="email" type="email" value={form.email} onChange={onChange}
          style={errors.email ? { borderColor: "var(--red)" } : {}} placeholder="supplier@example.com" />
        {errors.email && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.email}</span>}
      </div>
      {currentStore?.id == null && stores.length > 0 && (
        <div className="fg">
          <label>{t("store_availability", "master")}</label>
          <select name="store_id" value={form.store_id || ""} onChange={onChange}>
            <option value="">{t("all_stores", "master")}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="fg" style={{ gridColumn: "1 / -1" }}>
        <label>{t("address", "master")}</label>
        <textarea name="address" value={form.address} onChange={onChange} rows={2} placeholder="Full address" />
      </div>
    </>
  );
};

export default function Suppliers() {
  const { t } = useLanguage();
  const { currentStore } = useAuth();

  return (
    <CrudPage
      title={t("suppliers", "nav")}
      resource="suppliers"
      service={masterService}
      searchFields={["name", "phone", "email"]}
      extraLoader={async () => {
        const res = await masterService.getAll("stores");
        return { stores: Array.isArray(res.data) ? res.data : (res.data?.data || []) };
      }}
      tableColumns={[
        { label: t("col_name", "master"), render: (r) => <strong style={{ color: "var(--tx)" }}>{r.name}</strong> },
        { label: t("col_phone", "master"), width: 150, render: (r) => r.phone || "—" },
        { label: t("col_email", "master"), render: (r) => r.email || "—" },
        {
          label: t("col_store", "master"), width: 130,
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
      emptyForm={{ name: "", phone: "", email: "", address: "", store_id: currentStore?.id || "" }}
      toForm={(r) => ({ name: r.name, phone: r.phone || "", email: r.email || "", address: r.address || "", store_id: r.store_id || "" })}
      toPayload={(f) => ({ name: f.name.trim(), phone: f.phone || null, email: f.email || null, address: f.address || null, store_id: f.store_id || null })}
      validate={(f) => {
        const e = {};
        if (!f.name.trim()) e.name = t("supplier_name_required", "master");
        if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = t("invalid_email", "master");
        return e;
      }}
      renderForm={FORM}
      modalColumns={{ sm: 1, md: 2 }}
      modalWidth={560}
      storeFilter={true}
      deleteLabel={(r) => r.name}
    />
  );
}
