import CrudPage from "../../components/CrudPage";
import masterService from "../../services/masterService";
import { useAuth } from "../../context/AuthContext";

const UNITS = ["kg", "g", "litre", "ml", "piece", "dozen", "box", "bag"];

const FORM = ({ form, onChange, errors, extras }) => {
  const { currentStore } = useAuth();
  const stores = extras?.stores || [];
  return (
    <>
      <div className="fg">
        <label>
          Name <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <input name="name" value={form.name || ""} onChange={onChange} autoFocus placeholder="e.g. Chicken, Cheese, Tomato Sauce" style={errors.name ? { borderColor: "var(--red)" } : {}} />
        {errors.name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.name}</span>}
      </div>

      <div className="fg">
        <label>Unit</label>
        <select name="unit" value={form.unit || ""} onChange={onChange}>
          <option value="">— Select unit —</option>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div className="fg">
        <label>Cost Price</label>
        <input name="cost_price" type="number" step="0.01" min="0" value={form.cost_price ?? 0} onChange={onChange} placeholder="0.00" />
      </div>

      {currentStore?.id == null && stores.length > 0 && (
        <div className="fg">
          <label>Store Availability</label>
          <select name="store_id" value={form.store_id || ""} onChange={onChange}>
            <option value="">All Stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
};

export default function Ingredients() {
  return (
    <CrudPage
      title="Ingredients"
      singular="Ingredient"
      resource="ingredients"
      service={masterService}
      searchFields={["name"]}
      storeFilter={true}
      extraLoader={async () => {
        const res = await masterService.getAll("stores");
        return { stores: Array.isArray(res.data) ? res.data : res.data?.data || [] };
      }}
      emptyForm={{ name: "", unit: "", cost_price: 0, store_id: "" }}
      validate={(form) => {
        const e = {};
        if (!form.name?.trim()) e.name = "Name is required";
        return e;
      }}
      renderForm={(props) => <FORM {...props} />}
      tableColumns={[
        {
          label: "Name",
          render: (r) => <strong style={{ color: "var(--tx)" }}>{r.name}</strong>,
        },
        {
          label: "Unit",
          width: 90,
          render: (r) => (r.unit ? <span style={{ fontSize: 11, color: "var(--tx2)" }}>{r.unit}</span> : <span style={{ color: "var(--tx3)" }}>—</span>),
        },
        {
          label: "Cost Price",
          width: 110,
          render: (r) => <span style={{ fontWeight: 600, color: "var(--tx)" }}>{Number(r.cost_price).toLocaleString()}</span>,
        },
        {
          label: "In Stock",
          width: 100,
          render: (r) => (
            <span
              style={{
                fontWeight: 600,
                color: Number(r.stock_quantity) > 0 ? "var(--green)" : "var(--tx3)",
              }}
            >
              {Number(r.stock_quantity).toLocaleString()}
              {r.unit ? ` ${r.unit}` : ""}
            </span>
          ),
        },
      ]}
    />
  );
}
