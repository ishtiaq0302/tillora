import CrudPage from "../../components/CrudPage";
import masterService from "../../services/masterService";

const EMPTY = { code: "", name: "", native_name: "", is_rtl: false, is_default: false, is_active: true };

const FORM = ({ form, onChange, errors }) => (
  <>
    <div className="fg">
      <label>Language Code <span style={{ color: "var(--red)" }}>*</span></label>
      <input name="code" value={form.code} onChange={onChange} autoFocus
        style={errors.code ? { borderColor: "var(--red)" } : {}} placeholder="e.g. en, ur, ar" />
      {errors.code && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.code}</span>}
    </div>
    <div className="fg">
      <label>Name <span style={{ color: "var(--red)" }}>*</span></label>
      <input name="name" value={form.name} onChange={onChange}
        style={errors.name ? { borderColor: "var(--red)" } : {}} placeholder="e.g. English, Urdu" />
      {errors.name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.name}</span>}
    </div>
    <div className="fg">
      <label>Native Name</label>
      <input name="native_name" value={form.native_name} onChange={onChange} placeholder="e.g. اردو" />
    </div>
    <div className="fg">
      <label>RTL Direction</label>
      <select name="is_rtl" value={form.is_rtl.toString()} onChange={onChange}>
        <option value="false">LTR (Left to Right)</option>
        <option value="true">RTL (Right to Left)</option>
      </select>
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

export default function Languages() {
  return (
    <CrudPage
      title="Languages"
      singular="Language"
      resource="languages"
      service={masterService}
      searchFields={["name", "code"]}
      tableColumns={[
        { label: "Code", width: 80, render: (r) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--accent)" }}>{r.code}</span> },
        { label: "Name", render: (r) => <strong style={{ color: "var(--tx)" }}>{r.name}{r.native_name ? <span style={{ color: "var(--tx3)", fontWeight: 400, marginLeft: 8 }}>({r.native_name})</span> : null}</strong> },
        { label: "Direction", width: 90, render: (r) => <span className={`sta ${r.is_rtl ? "er" : "ok"}`}>{r.is_rtl ? "RTL" : "LTR"}</span> },
        { label: "Status", width: 90, render: (r) => <span className={`sta ${r.is_active ? "ok" : "er"}`}>{r.is_active ? "Active" : "Inactive"}</span> },
      ]}
      emptyForm={EMPTY}
      toForm={(r) => ({ code: r.code, name: r.name, native_name: r.native_name || "", is_rtl: r.is_rtl ?? false, is_default: r.is_default ?? false, is_active: r.is_active ?? true })}
      toPayload={(f) => ({ code: f.code.trim(), name: f.name.trim(), native_name: f.native_name.trim(), is_rtl: f.is_rtl, is_default: f.is_default, is_active: f.is_active })}
      validate={(f) => {
        const e = {};
        if (!f.code.trim()) e.code = "Language code is required";
        if (!f.name.trim()) e.name = "Language name is required";
        return e;
      }}
      booleanFields={["is_rtl", "is_default", "is_active"]}
      renderForm={FORM}
      modalWidth={460}
      deleteLabel={(r) => r.name}
    />
  );
}
