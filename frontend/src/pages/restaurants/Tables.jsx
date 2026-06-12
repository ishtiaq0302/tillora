import CrudPage from "../../components/CrudPage";
import masterService from "../../services/masterService";
import { useAuth } from "../../context/AuthContext";

const EMPTY = { table_name: "", capacity: 4, status: "available" };

const FORM = ({ form, onChange, errors, extras }) => {
  const { currentStore } = useAuth();
  const stores = extras?.stores || [];
  return (
    <>
      <div className="fg">
        <label>
          Table Name <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <input
          name="table_name"
          value={form.table_name}
          onChange={onChange}
          autoFocus
          style={errors.table_name ? { borderColor: "var(--red)" } : {}}
          placeholder="e.g. Table 1"
        />
        {errors.table_name && (
          <span style={{ fontSize: 11, color: "var(--red)" }}>
            {errors.table_name}
          </span>
        )}
      </div>
      <div className="fg">
        <label>Capacity</label>
        <input
          name="capacity"
          type="number"
          min="1"
          value={form.capacity}
          onChange={onChange}
          placeholder="4"
        />
      </div>
      <div className="fg">
        <label>Status</label>
        <select name="status" value={form.status} onChange={onChange}>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
      {currentStore?.id == null && stores.length > 0 && (
        <div className="fg">
          <label>Store <span style={{ color: "var(--red)" }}>*</span></label>
          <select name="store_id" value={form.store_id || ""} onChange={onChange}
            style={errors.store_id ? { borderColor: "var(--red)" } : {}}>
            <option value="">Select Store</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.store_id && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.store_id}</span>}
        </div>
      )}
    </>
  );
};

const STATUS_COLORS = {
  available: { bg: "var(--gbg)", color: "var(--green)" },
  occupied: { bg: "var(--rbg)", color: "var(--red)" },
  reserved: { bg: "var(--ambg)", color: "var(--amber)" },
  maintenance: { bg: "var(--bg3)", color: "var(--tx3)" },
};

export default function Tables() {
  const { currentStore } = useAuth();
  return (
    <CrudPage
      title="Restaurant Tables"
      singular="Table"
      resource="restaurant-tables"
      service={masterService}
      searchFields={["table_name", "status"]}
      storeFilter={true}
      extraLoader={async () => {
        const res = await masterService.getAll("stores");
        return { stores: Array.isArray(res.data) ? res.data : (res.data?.data || []) };
      }}
      tableColumns={[
        {
          label: "Table Name",
          render: (r) => (
            <strong style={{ color: "var(--tx)" }}>{r.table_name}</strong>
          ),
        },
        {
          label: "Store",
          width: 140,
          render: (r, extras) => {
            const store = extras?.stores?.find((s) => s.id === r.store_id);
            return store ? (
              <span style={{ background: "var(--abg)", color: "var(--accent)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>
                {store.name}
              </span>
            ) : <span style={{ color: "var(--tx3)" }}>—</span>;
          },
        },
        {
          label: "Capacity",
          width: 100,
          render: (r) => (
            <span style={{ color: "var(--tx2)" }}>{r.capacity} seats</span>
          ),
        },
        {
          label: "Status",
          width: 130,
          render: (r) => {
            const s = STATUS_COLORS[r.status] || {
              bg: "var(--bg3)",
              color: "var(--tx3)",
            };
            return (
              <span
                style={{
                  background: s.bg,
                  color: s.color,
                  borderRadius: "var(--r)",
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {r.status}
              </span>
            );
          },
        },
      ]}
      emptyForm={{ table_name: "", capacity: 4, status: "available", store_id: currentStore?.id || "" }}
      toForm={(r) => ({
        table_name: r.table_name,
        capacity: r.capacity ?? 4,
        status: r.status || "available",
        store_id: r.store_id || "",
      })}
      toPayload={(f) => ({
        table_name: f.table_name.trim(),
        capacity: Number(f.capacity) || 4,
        status: f.status,
        store_id: f.store_id || null,
      })}
      validate={(f) => {
        const e = {};
        if (!f.table_name.trim()) e.table_name = "Table name is required";
        if (!currentStore?.id && !f.store_id) e.store_id = "Store is required";
        return e;
      }}
      renderForm={FORM}
      modalWidth={440}
      deleteLabel={(r) => r.table_name}
    />
  );
}
