import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Modal from "../component/Modal";
import DeleteDialog from "../component/DeleteDialog";
import Button from "../component/Button";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";

const psStyle = { background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)", padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none" };

const EMPTY = { store_id: "", language_id: "", is_default: false };

export default function StoreLanguages() {
  const [data, setData] = useState([]);
  const [stores, setStores] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getAll("store-languages");
      setData(res.data?.data || res.data || []);
    } catch { toast.error("Failed to load store languages"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    masterService.getAll("stores").then(r => setStores(r.data?.data || r.data || [])).catch(() => {});
    masterService.getAll("languages").then(r => setLanguages(r.data?.data || r.data || [])).catch(() => {});
  }, [load]);

  const filtered = useMemo(() => data.filter(r => {
    const matchStore = !filterStore || r.store_id === filterStore;
    const matchSearch = !search.trim() || (r.language?.name || "").toLowerCase().includes(search.toLowerCase()) || (r.language?.code || "").toLowerCase().includes(search.toLowerCase());
    return matchStore && matchSearch;
  }), [data, search, filterStore]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterStore, pageSize]);

  const storeMap = useMemo(() => Object.fromEntries(stores.map(s => [s.id, s.name])), [stores]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }));
  };

  const openCreate = () => { setForm({ ...EMPTY }); setErrors({}); setEditId(null); setModal("create"); };
  const openEdit = (r) => {
    setForm({ store_id: r.store_id, language_id: r.language_id, is_default: r.is_default });
    setErrors({}); setEditId(r.id); setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditId(null); };

  const handleSave = async () => {
    const errs = {};
    if (!form.store_id) errs.store_id = "Store is required";
    if (!form.language_id) errs.language_id = "Language is required";
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      const payload = { store_id: form.store_id, language_id: form.language_id, is_default: form.is_default };
      if (modal === "edit") {
        await masterService.update("store-languages", editId, { is_default: form.is_default });
        toast.success("Store language updated");
      } else {
        await masterService.create("store-languages", payload);
        toast.success("Language assigned to store");
      }
      closeModal(); load();
    } catch (err) { toast.error(err?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await masterService.delete("store-languages", deleteDialog.id); toast.success("Language removed from store"); load(); }
    catch { toast.error("Delete failed"); }
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
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>Store Languages</strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder="Search language..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterStore} onChange={e => setFilterStore(e.target.value)} style={psStyle}>
              <option value="">All Stores</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>Show</span>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={psStyle}>
                {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={openCreate}><Plus size={13} strokeWidth={2.5} /><span>Assign</span></Button>
          </div>
        </div>
        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Store</th>
                <th>Language</th>
                <th>Code</th>
                <th>Default</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>No store languages found</td></tr>
              ) : paged.map(r => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => openEdit(r)}>
                  <td style={{ color: "var(--tx2)", fontSize: 12 }}>{storeMap[r.store_id] || "—"}</td>
                  <td><strong style={{ color: "var(--tx)" }}>{r.language?.name || "—"}</strong></td>
                  <td><span style={{ background: "var(--bg3)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>{r.language?.code?.toUpperCase() || "—"}</span></td>
                  <td>
                    {r.is_default
                      ? <span className="sta ok" style={{ fontSize: 11 }}>Default</span>
                      : <span style={{ color: "var(--tx3)", fontSize: 11 }}>—</span>
                    }
                  </td>
                  <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                      <button className="hbtn" onClick={e => { e.stopPropagation(); openEdit(r); }} title="Edit"><Pencil size={12} /></button>
                      <button className="hbtn" onClick={e => { e.stopPropagation(); setDeleteDialog({ open: true, id: r.id, label: `${storeMap[r.store_id]} – ${r.language?.name}` }); }} title="Remove"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>Showing <strong style={{ color: "var(--tx)" }}>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong></span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="hbtn" style={{ opacity: currentPage === 1 ? 0.4 : 1 }}><ChevronLeft size={13} /></button>
                {getPageNumbers().map((page, i) => page === "..." ? <span key={`d-${i}`} style={{ padding: "0 4px" }}>…</span> : (
                  <button key={page} onClick={() => setCurrentPage(page)} className="hbtn"
                    style={currentPage === page ? { background: "var(--abg)", borderColor: "var(--accent)", color: "var(--accent)", width: 28, height: 28, fontSize: 12 } : { width: 28, height: 28, fontSize: 12, color: "var(--tx2)" }}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="hbtn" style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}><ChevronRight size={13} /></button>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <Modal isOpen onClose={closeModal} title={modal === "edit" ? "Edit Store Language" : "Assign Language to Store"} width={460}
          footer={<><Button variant="ghost" size="sm" onClick={closeModal}>Cancel</Button><Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>{saving ? "Saving..." : modal === "edit" ? "Update" : "Assign"}</Button></>}
        >
          <div className="fg">
            <label>Store <span style={{ color: "var(--red)" }}>*</span></label>
            <select name="store_id" value={form.store_id} onChange={handleChange} disabled={modal === "edit"} style={errors.store_id ? { borderColor: "var(--red)" } : {}}>
              <option value="">Select store...</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.store_id && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.store_id}</span>}
          </div>
          <div className="fg">
            <label>Language <span style={{ color: "var(--red)" }}>*</span></label>
            <select name="language_id" value={form.language_id} onChange={handleChange} disabled={modal === "edit"} style={errors.language_id ? { borderColor: "var(--red)" } : {}}>
              <option value="">Select language...</option>
              {languages.map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
            </select>
            {errors.language_id && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.language_id}</span>}
          </div>
          <div className="fg" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="is_default" name="is_default" checked={form.is_default} onChange={handleChange} style={{ width: "auto" }} />
            <label htmlFor="is_default" style={{ cursor: "pointer", marginBottom: 0 }}>Set as default language for this store</label>
          </div>
        </Modal>
      )}

      <DeleteDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, label: "" })} onConfirm={handleDelete} label={deleteDialog.label} />
    </MainLayout>
  );
}
