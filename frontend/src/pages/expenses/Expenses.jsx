import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Modal from "../component/Modal";
import DeleteDialog from "../component/DeleteDialog";
import Button from "../component/Button";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";
import useStoreRefresh from "../../hooks/useStoreRefresh";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const pageSizeStyle = {
  background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)",
  padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none",
};

const EMPTY = { category_id: "", amount: "", expense_date: new Date().toISOString().slice(0, 10), notes: "", store_id: "" };

export default function Expenses() {
  const { currentStore } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [stores, setStores] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getAll("expenses");
      setData(res.data?.data || res.data || []);
    } catch { toast.error(t("failed_to_load", "expenses")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    masterService.getAll("expense-categories").then((r) => setCategories(r.data?.data || r.data || [])).catch(() => {});
    masterService.getAll("stores").then((r) => setStores(r.data?.data || r.data || [])).catch(() => {});
  }, [loadData]);
  useStoreRefresh(loadData);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const s = search.toLowerCase();
      const matchSearch = !search.trim() || (r.notes || "").toLowerCase().includes(s) || (r.category?.name || "").toLowerCase().includes(s);
      const matchStore = !filterStore || r.store_id === filterStore;
      return matchSearch && matchStore;
    });
  }, [data, search, filterStore]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterStore, pageSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const openCreate = () => { setForm({ ...EMPTY, expense_date: new Date().toISOString().slice(0, 10), store_id: currentStore?.id || "" }); setErrors({}); setEditId(null); setModal("create"); };
  const openEdit = (row) => {
    setForm({ category_id: row.category_id || "", amount: row.amount ?? "", expense_date: row.expense_date || new Date().toISOString().slice(0, 10), notes: row.notes || "", store_id: row.store_id || currentStore?.id || "" });
    setErrors({}); setEditId(row.id); setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditId(null); };

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = t("enter_valid_amount", "expenses");
    if (!form.expense_date) e.expense_date = t("date_required", "expenses");
    if (!currentStore?.id && !form.store_id) e.store_id = t("store_required", "expenses");
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      const payload = { category_id: form.category_id || null, amount: Number(form.amount), expense_date: form.expense_date, notes: form.notes || null, store_id: form.store_id || undefined };
      if (modal === "edit") { await masterService.update("expenses", editId, payload); toast.success(t("expense_updated", "expenses")); }
      else { await masterService.create("expenses", payload); toast.success(t("expense_created", "expenses")); }
      closeModal(); loadData();
    } catch (err) { toast.error(err?.response?.data?.message || t("save_failed", "common")); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await masterService.delete("expenses", deleteDialog.id); toast.success(t("expense_deleted", "expenses")); loadData(); }
    catch { toast.error(t("delete_failed", "common")); }
    finally { setDeleteDialog({ open: false, id: null, label: "" }); }
  };

  const catName = (id) => categories.find((c) => c.id === id)?.name || "—";

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    if (left > 1) { pages.push(1); if (left > 2) pages.push("..."); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  return (
    <MainLayout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>{t("title", "expenses")}</strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder={t("search_placeholder", "expenses")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} style={pageSizeStyle}>
              <option value="">{t("all_stores", "common")}</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>{t("show", "common")}</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={pageSizeStyle}>
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={openCreate}><Plus size={13} strokeWidth={2.5} /><span>{t("add", "common")}</span></Button>
          </div>
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>{t("date", "common")}</th>
                <th className="hidden sm:table-cell">{t("category", "common")}</th>
                <th className="hidden md:table-cell">{t("store", "common")}</th>
                <th>{t("amount", "common")}</th>
                <th className="hidden lg:table-cell">{t("notes", "common")}</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>{t("loading", "common")}</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>{t("no_expenses_found", "expenses")}</td></tr>
              ) : paged.map((r) => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => openEdit(r)}>
                  <td><span style={{ color: "var(--tx)", fontWeight: 500 }}>{r.expense_date}</span></td>
                  <td className="hidden sm:table-cell">{catName(r.category_id)}</td>
                  <td className="hidden md:table-cell" style={{ color: "var(--tx3)" }}>{r.store?.name || "—"}</td>
                  <td><span style={{ color: "var(--red)", fontWeight: 600 }}>{Number(r.amount).toLocaleString()}</span></td>
                  <td className="hidden lg:table-cell" style={{ color: "var(--tx3)", maxWidth: 200 }}>{r.notes || "—"}</td>
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                      <button className="hbtn" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Pencil size={12} /></button>
                      <button className="hbtn" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: r.id, label: `expense on ${r.expense_date}` }); }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>{t("showing", "common")} <strong style={{ color: "var(--tx)" }}>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}</strong> {t("of", "common")} <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong> {t("title", "expenses").toLowerCase()}</span>
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
        <Modal isOpen onClose={closeModal} title={modal === "edit" ? t("edit_expense", "expenses") : t("add_expense", "expenses")} columns={{ sm: 1, md: 2 }} width={520}
          footer={<><Button variant="ghost" size="sm" onClick={closeModal}>{t("cancel", "common")}</Button><Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>{saving ? t("saving", "common") : modal === "edit" ? t("update", "common") : t("create", "common")}</Button></>}>
          <div className="fg">
            <label>{t("category", "common")}</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}>
              <option value="">{t("no_category", "common")}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>{t("amount", "common")} <span style={{ color: "var(--red)" }}>*</span></label>
            <input name="amount" type="number" step="0.01" min="0" value={form.amount} onChange={handleChange}
              style={errors.amount ? { borderColor: "var(--red)" } : {}} placeholder="0.00" />
            {errors.amount && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.amount}</span>}
          </div>
          <div className="fg">
            <label>{t("date", "common")} <span style={{ color: "var(--red)" }}>*</span></label>
            <input name="expense_date" type="date" value={form.expense_date} onChange={handleChange}
              style={errors.expense_date ? { borderColor: "var(--red)" } : {}} />
            {errors.expense_date && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.expense_date}</span>}
          </div>
          <div className="fg" style={{ gridColumn: "1 / -1" }}>
            <label>{t("notes", "common")}</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder={t("optional_notes", "expenses")} />
          </div>
          {currentStore?.id == null && stores.length > 0 && (
            <div className="fg" style={{ gridColumn: "1 / -1" }}>
              <label>{t("store", "common")} <span style={{ color: "var(--red)" }}>*</span></label>
              <select name="store_id" value={form.store_id || ""} onChange={handleChange}
                style={errors.store_id ? { borderColor: "var(--red)" } : {}}>
                <option value="">{t("select_store", "common")}</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.store_id && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.store_id}</span>}
            </div>
          )}
        </Modal>
      )}

      <DeleteDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, label: "" })} onConfirm={handleDelete} label={deleteDialog.label} />
    </MainLayout>
  );
}
