import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Modal from "../component/Modal";
import DeleteDialog from "../component/DeleteDialog";
import Button from "../component/Button";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";

const STATUS_COLORS = {
  active: { bg: "var(--gbg)", color: "var(--green)" },
  expired: { bg: "var(--rbg)", color: "var(--red)" },
  cancelled: { bg: "var(--bg3)", color: "var(--tx3)" },
};
const PAYMENT_COLORS = {
  paid: { bg: "var(--gbg)", color: "var(--green)" },
  pending: { bg: "var(--ambg)", color: "var(--amber)" },
  failed: { bg: "var(--rbg)", color: "var(--red)" },
};

const psStyle = { background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)", padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none" };

const EMPTY = { subscription_plan_id: "", start_date: "", end_date: "", amount: "", payment_status: "pending", status: "active" };

export default function Subscriptions() {
  const [data, setData] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getAll("subscriptions");
      setData(res.data?.data || res.data || []);
    } catch { toast.error("Failed to load subscriptions"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    masterService.getAll("subscription-plans").then((r) => setPlans(r.data?.data || r.data || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const s = search.toLowerCase();
    return data.filter((r) => (r.plan?.name || "").toLowerCase().includes(s) || (r.status || "").toLowerCase().includes(s));
  }, [data, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, pageSize]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => { setForm({ ...EMPTY }); setEditId(null); setModal("create"); };

  const openEdit = (r) => {
    setForm({
      subscription_plan_id: r.subscription_plan_id || "",
      start_date: r.start_date ? r.start_date.slice(0, 10) : "",
      end_date: r.end_date ? r.end_date.slice(0, 10) : "",
      amount: r.amount ?? "",
      payment_status: r.payment_status || "pending",
      status: r.status || "active",
    });
    setEditId(r.id);
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.start_date) return toast.error("Start date is required");
    if (!form.end_date) return toast.error("End date is required");
    setSaving(true);
    try {
      const payload = {
        subscription_plan_id: form.subscription_plan_id || null,
        start_date: form.start_date,
        end_date: form.end_date,
        amount: Number(form.amount || 0),
        payment_status: form.payment_status,
        status: form.status,
      };
      if (modal === "edit") {
        await masterService.update("subscriptions", editId, payload);
        toast.success("Subscription updated");
      } else {
        await masterService.create("subscriptions", payload);
        toast.success("Subscription created");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await masterService.delete("subscriptions", deleteDialog.id);
      toast.success("Subscription deleted");
      load();
    } catch { toast.error("Delete failed"); }
    finally { setDeleteDialog({ open: false, id: null, label: "" }); }
  };

  const getPageNumbers = () => {
    const pages = []; const delta = 2;
    const left = Math.max(1, currentPage - delta); const right = Math.min(totalPages, currentPage + delta);
    if (left > 1) { pages.push(1); if (left > 2) pages.push("..."); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  return (
    <MainLayout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>Subscriptions</strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={psStyle}>
                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={13} strokeWidth={2.5} /><span>Add</span>
            </Button>
          </div>
        </div>
        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Amount</th>
                <th className="hidden sm:table-cell">Start Date</th>
                <th className="hidden sm:table-cell">End Date</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>No subscriptions found</td></tr>
              ) : paged.map((r) => {
                const sc = STATUS_COLORS[r.status] || { bg: "var(--bg3)", color: "var(--tx3)" };
                const pc = PAYMENT_COLORS[r.payment_status] || { bg: "var(--bg3)", color: "var(--tx3)" };
                return (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => openEdit(r)}>
                    <td><strong style={{ color: "var(--tx)" }}>{r.plan?.name || "—"}</strong></td>
                    <td style={{ fontWeight: 600 }}>{Number(r.amount).toLocaleString()}</td>
                    <td className="hidden sm:table-cell" style={{ color: "var(--tx3)", fontSize: 12 }}>{r.start_date ? new Date(r.start_date).toLocaleDateString() : "—"}</td>
                    <td className="hidden sm:table-cell" style={{ color: "var(--tx3)", fontSize: 12 }}>{r.end_date ? new Date(r.end_date).toLocaleDateString() : "—"}</td>
                    <td><span style={{ background: pc.bg, color: pc.color, borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{r.payment_status}</span></td>
                    <td><span style={{ background: sc.bg, color: sc.color, borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{r.status}</span></td>
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                        <button className="hbtn" onClick={(e) => { e.stopPropagation(); openEdit(r); }} title="Edit"><Pencil size={12} /></button>
                        <button className="hbtn" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: r.id, label: r.plan?.name || "this subscription" }); }} title="Delete"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>Showing <strong style={{ color: "var(--tx)" }}>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong></span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="hbtn" style={{ opacity: currentPage === 1 ? 0.4 : 1 }}><ChevronLeft size={13} /></button>
                {getPageNumbers().map((page, i) => page === "..." ? <span key={`d-${i}`} style={{ padding: "0 4px" }}>…</span> : (
                  <button key={page} onClick={() => setCurrentPage(page)} className="hbtn"
                    style={currentPage === page ? { background: "var(--abg)", borderColor: "var(--accent)", color: "var(--accent)", width: 28, height: 28, fontSize: 12 } : { width: 28, height: 28, fontSize: 12, color: "var(--tx2)" }}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="hbtn" style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}><ChevronRight size={13} /></button>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          isOpen
          onClose={() => setModal(null)}
          title={modal === "edit" ? "Edit Subscription" : "Add Subscription"}
          width={500}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : modal === "edit" ? "Update" : "Create"}
              </Button>
            </>
          }
        >
          <div className="fg">
            <label>Subscription Plan</label>
            <select name="subscription_plan_id" value={form.subscription_plan_id} onChange={handleChange}>
              <option value="">— No Plan —</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Start Date <span style={{ color: "var(--red)" }}>*</span></label>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} />
          </div>
          <div className="fg">
            <label>End Date <span style={{ color: "var(--red)" }}>*</span></label>
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} />
          </div>
          <div className="fg">
            <label>Amount</label>
            <input type="number" step="0.01" min="0" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" />
          </div>
          <div className="fg">
            <label>Payment Status</label>
            <select name="payment_status" value={form.payment_status} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="fg">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Modal>
      )}

      <DeleteDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, label: "" })}
        onConfirm={handleDelete}
        label={deleteDialog.label}
      />
    </MainLayout>
  );
}
