import CrudPage from "../../components/CrudPage";
import masterService from "../../services/masterService";

const EMPTY = { name: "", code: "", price: "", duration_days: 30, max_users: 5, max_stores: 1, paddle_price_id: "", is_active: true };

const FORM = ({ form, onChange, errors }) => (
  <>
    <div className="fg">
      <label>Plan Name <span style={{ color: "var(--red)" }}>*</span></label>
      <input name="name" value={form.name} onChange={onChange} autoFocus
        style={errors.name ? { borderColor: "var(--red)" } : {}} placeholder="e.g. Starter, Professional" />
      {errors.name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.name}</span>}
    </div>
    <div className="fg">
      <label>Code <span style={{ color: "var(--red)" }}>*</span></label>
      <input name="code" value={form.code} onChange={onChange}
        style={errors.code ? { borderColor: "var(--red)" } : {}} placeholder="e.g. STARTER, PRO" />
      {errors.code && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.code}</span>}
    </div>
    <div className="fg">
      <label>Price (USD)</label>
      <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={onChange} placeholder="0.00" />
    </div>
    <div className="fg">
      <label>Duration (days)</label>
      <input name="duration_days" type="number" min="1" value={form.duration_days} onChange={onChange} placeholder="30" />
    </div>
    <div className="fg">
      <label>Max Users</label>
      <input name="max_users" type="number" min="1" value={form.max_users} onChange={onChange} placeholder="5" />
    </div>
    <div className="fg">
      <label>Max Stores</label>
      <input name="max_stores" type="number" min="1" value={form.max_stores} onChange={onChange} placeholder="1" />
    </div>
    <div className="fg">
      <label>
        Paddle Price ID
        <span style={{ fontSize: 10, color: "var(--tx3)", fontWeight: 400, marginLeft: 6 }}>
          from Paddle Dashboard → Catalog → Prices
        </span>
      </label>
      <input
        name="paddle_price_id"
        value={form.paddle_price_id}
        onChange={onChange}
        placeholder="pri_01abc123... (required for online payment)"
        style={{ fontFamily: "monospace", fontSize: 12 }}
      />
      <span style={{ fontSize: 11, color: "var(--tx3)" }}>
        Leave blank to disable online payment for this plan.
      </span>
    </div>
    <div className="fg">
      <label>Status</label>
      <select name="is_active" value={form.is_active.toString()} onChange={onChange}>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>
  </>
);

export default function SubscriptionPlans() {
  return (
    <CrudPage
      title="Subscription Plans"
      singular="Plan"
      resource="subscription-plans"
      service={masterService}
      searchFields={["name", "code"]}
      tableColumns={[
        { label: "Name", render: (r) => <strong style={{ color: "var(--tx)" }}>{r.name}</strong> },
        { label: "Code", width: 100, render: (r) => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--tx3)" }}>{r.code}</span> },
        { label: "Price", width: 100, render: (r) => <span style={{ fontWeight: 600, color: "var(--green)" }}>{Number(r.price).toFixed(2)}</span> },
        { label: "Days", width: 80, render: (r) => <span style={{ color: "var(--tx2)" }}>{r.duration_days}d</span> },
        { label: "Users", width: 70, render: (r) => <span style={{ color: "var(--tx3)", fontSize: 12 }}>{r.max_users}</span> },
        { label: "Paddle Price", width: 140, render: (r) => r.paddle_price_id
          ? <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--accent)" }}>{r.paddle_price_id}</span>
          : <span style={{ fontSize: 11, color: "var(--tx3)" }}>— not set —</span> },
        { label: "Status", width: 90, render: (r) => <span className={`sta ${r.is_active ? "ok" : "er"}`}>{r.is_active ? "Active" : "Inactive"}</span> },
      ]}
      emptyForm={EMPTY}
      toForm={(r) => ({ name: r.name, code: r.code, price: r.price ?? "", duration_days: r.duration_days ?? 30, max_users: r.max_users ?? 5, max_stores: r.max_stores ?? 1, paddle_price_id: r.paddle_price_id ?? "", is_active: r.is_active ?? true })}
      toPayload={(f) => ({ name: f.name.trim(), code: f.code.trim(), price: Number(f.price || 0), duration_days: Number(f.duration_days || 30), max_users: Number(f.max_users || 5), max_stores: Number(f.max_stores || 1), paddle_price_id: f.paddle_price_id?.trim() || null, is_active: f.is_active })}
      validate={(f) => {
        const e = {};
        if (!f.name.trim()) e.name = "Plan name is required";
        if (!f.code.trim()) e.code = "Plan code is required";
        return e;
      }}
      booleanFields={["is_active"]}
      renderForm={FORM}
      modalWidth={500}
      deleteLabel={(r) => r.name}
    />
  );
}
