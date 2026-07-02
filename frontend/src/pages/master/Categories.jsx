import CrudPage from "../../components/CrudPage";
import masterService from "../../services/masterService";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const FORM = ({ form, onChange, errors, data, extras }) => {
  const { t } = useLanguage();
  const { currentStore } = useAuth();
  const parentOptions = data.filter((c) => c.id !== form._editId);
  const stores = extras?.stores || [];
  return (
    <>
      <div className="fg">
        <label>
          {t("category_name", "master")} 666
          <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          autoFocus
          style={errors.name ? { borderColor: "var(--red)" } : {}}
          placeholder="e.g. Beverages"
        />
        {errors.name && (
          <span style={{ fontSize: 11, color: "var(--red)" }}>
            {errors.name}
          </span>
        )}
      </div>
      <div className="fg">
        <label>{t("parent_category", "master")}</label>
        <select
          name="parent_id"
          value={form.parent_id || ""}
          onChange={onChange}
        >
          <option value="">{t("none_top_level", "master")}</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {currentStore?.id == null && stores.length > 0 && (
        <div className="fg">
          <label>{t("store_availability", "master")}</label>
          <select
            name="store_id"
            value={form.store_id || ""}
            onChange={onChange}
          >
            <option value="">{t("all_stores", "master")}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="fg">
        <label>{t("status", "master")}</label>
        <select
          name="is_active"
          value={form.is_active.toString()}
          onChange={onChange}
        >
          <option value="true">{t("active", "master")}</option>
          <option value="false">{t("inactive", "master")}</option>
        </select>
      </div>
    </>
  );
};

export default function Categories() {
  const { t } = useLanguage();
  const { currentStore } = useAuth();

  return (
    <CrudPage
      title={t("categories", "nav")}
      singular={t("singular_category", "master")}
      resource="categories"
      service={masterService}
      searchFields={["name"]}
      extraLoader={async () => {
        const res = await masterService.getAll("stores");
        return {
          stores: Array.isArray(res.data) ? res.data : res.data?.data || [],
        };
      }}
      tableColumns={[
        {
          label: t("col_name", "master"),
          render: (r) => (
            <strong style={{ color: "var(--tx)" }}>{r.name}</strong>
          ),
        },
        {
          label: t("col_store", "master"),
          width: 140,
          render: (r, extras) => {
            if (!r.store_id)
              return (
                <span style={{ color: "var(--tx3)" }}>
                  {t("all_stores", "master")}
                </span>
              );
            const store = extras?.stores?.find((s) => s.id === r.store_id);
            return store ? (
              <span
                style={{
                  background: "var(--abg)",
                  color: "var(--accent)",
                  borderRadius: "var(--r)",
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {store.name}
              </span>
            ) : (
              <span style={{ color: "var(--tx3)" }}>—</span>
            );
          },
        },
        {
          label: t("col_parent", "master"),
          width: 140,
          render: (r, _e, all) => {
            const parent = all?.find((c) => c.id === r.parent_id);
            return parent ? (
              <span
                style={{
                  background: "var(--abg)",
                  color: "var(--accent)",
                  borderRadius: "var(--r)",
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {parent.name}
              </span>
            ) : (
              <span style={{ color: "var(--tx3)" }}>—</span>
            );
          },
        },
        {
          label: t("col_status", "master"),
          width: 100,
          render: (r) => (
            <span className={`sta ${r.is_active ? "ok" : "er"}`}>
              {r.is_active ? t("active", "master") : t("inactive", "master")}
            </span>
          ),
        },
      ]}
      emptyForm={{
        name: "",
        parent_id: "",
        store_id: currentStore?.id || "",
        is_active: true,
      }}
      toForm={(r) => ({
        name: r.name,
        parent_id: r.parent_id || "",
        store_id: r.store_id || "",
        is_active: r.is_active ?? true,
        _editId: r.id,
      })}
      toPayload={(f) => ({
        name: f.name.trim(),
        parent_id: f.parent_id || null,
        store_id: f.store_id || null,
        is_active: f.is_active,
      })}
      validate={(f) => {
        const e = {};
        if (!f.name.trim()) e.name = t("category_name_required", "master");
        return e;
      }}
      booleanFields={["is_active"]}
      storeFilter={true}
      renderForm={FORM}
      modalWidth={440}
      deleteLabel={(r) => r.name}
    />
  );
}
