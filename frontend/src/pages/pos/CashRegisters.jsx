import { useState, useCallback, useRef } from "react";
import CrudPage from "../../components/CrudPage";
import masterService from "../../services/masterService";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const FORM = ({ form, onChange, errors, extras }) => {
  const { currentStore } = useAuth();
  const stores = extras?.stores || [];
  return (
    <>
      <div className="fg">
        <label>Opening Balance <span style={{ color: "var(--red)" }}>*</span></label>
        <input name="opening_balance" type="number" step="0.01" min="0" value={form.opening_balance} onChange={onChange} autoFocus
          style={errors.opening_balance ? { borderColor: "var(--red)" } : {}} placeholder="0.00" />
        {errors.opening_balance && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.opening_balance}</span>}
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
  open: { bg: "var(--gbg)", color: "var(--green)" },
  closed: { bg: "var(--bg3)", color: "var(--tx3)" },
};

export default function CashRegisters() {
  const { currentStore } = useAuth();
  const [closing, setClosing] = useState(null);
  const [closeAmount, setCloseAmount] = useState("");
  const reloadRef = useRef(null);

  const handleClose = useCallback(async () => {
    try {
      await api.put(`/cash-registers/${closing}/close`, { closing_balance: Number(closeAmount || 0) });
      toast.success("Cash register closed");
      setClosing(null);
      setCloseAmount("");
      if (reloadRef.current) reloadRef.current();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to close register");
    }
  }, [closing, closeAmount]);

  return (
    <>
      <CrudPage
        title="Cash Registers"
        singular="Register"
        resource="cash-registers"
        service={masterService}
        searchFields={["status"]}
        storeFilter={true}
        extraLoader={async () => {
          const res = await masterService.getAll("stores");
          return { stores: Array.isArray(res.data) ? res.data : (res.data?.data || []) };
        }}
        onReload={(fn) => { reloadRef.current = fn; }}
        tableColumns={[
          { label: "Opened At", render: (r) => <span style={{ color: "var(--tx)", fontSize: 12 }}>{r.opened_at ? new Date(r.opened_at).toLocaleString() : "—"}</span> },
          {
            label: "Store", width: 140,
            render: (r, extras) => {
              const store = extras?.stores?.find((s) => s.id === r.store_id);
              return store ? (
                <span style={{ background: "var(--abg)", color: "var(--accent)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>{store.name}</span>
              ) : <span style={{ color: "var(--tx3)" }}>—</span>;
            },
          },
          { label: "User", width: 140, render: (r) => <span style={{ color: "var(--tx2)" }}>{r.user?.name || "—"}</span> },
          { label: "Opening Bal.", width: 120, render: (r) => <span style={{ fontWeight: 600 }}>{Number(r.opening_balance).toLocaleString()}</span> },
          { label: "Closing Bal.", width: 120, render: (r) => <span style={{ color: r.closing_balance !== null ? "var(--tx)" : "var(--tx3)" }}>{r.closing_balance !== null ? Number(r.closing_balance).toLocaleString() : "—"}</span> },
          {
            label: "Status", width: 90,
            render: (r) => {
              const s = STATUS_COLORS[r.status] || { bg: "var(--bg3)", color: "var(--tx3)" };
              return <span style={{ background: s.bg, color: s.color, borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{r.status}</span>;
            },
          },
          {
            label: "", width: 80,
            tdStyle: { textAlign: "right" },
            render: (r) => r.status === "open" ? (
              <button
                className="hbtn"
                style={{ fontSize: 11, color: "var(--red)", borderColor: "var(--red)", padding: "2px 8px" }}
                onClick={(e) => { e.stopPropagation(); setClosing(r.id); setCloseAmount(""); }}
              >
                Close
              </button>
            ) : null,
          },
        ]}
        emptyForm={{ opening_balance: "", store_id: currentStore?.id || "" }}
        toForm={(r) => ({ opening_balance: r.opening_balance ?? "", store_id: r.store_id || "" })}
        toPayload={(f) => ({ opening_balance: Number(f.opening_balance || 0), store_id: f.store_id || null })}
        validate={(f) => {
          const e = {};
          if (f.opening_balance === "" || f.opening_balance === null) e.opening_balance = "Opening balance is required";
          if (!currentStore?.id && !f.store_id) e.store_id = "Store is required";
          return e;
        }}
        renderForm={FORM}
        modalWidth={380}
        deleteLabel={(r) => `Register (${r.status})`}
      />
      {closing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="fcard" style={{ width: 340, padding: 24 }}>
            <strong style={{ fontSize: 14 }}>Close Cash Register</strong>
            <div className="fg" style={{ marginTop: 16 }}>
              <label>Closing Balance</label>
              <input type="number" step="0.01" min="0" value={closeAmount} onChange={(e) => setCloseAmount(e.target.value)} autoFocus placeholder="0.00" />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button className="hbtn" onClick={() => setClosing(null)}>Cancel</button>
              <button className="hbtn" style={{ background: "var(--accent)", color: "#fff" }} onClick={handleClose}>Close Register</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
