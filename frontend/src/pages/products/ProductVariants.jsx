import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Modal from "../component/Modal";
import DeleteDialog from "../component/DeleteDialog";
import Button from "../component/Button";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";
import { useAuth } from "../../context/AuthContext";

const psStyle = { background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)", padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none" };

const EMPTY = { name: "", multi_select: false, store_id: "" };

export default function ProductVariants() {
  const { currentStore } = useAuth();
  const [data, setData] = useState([]);
  const [stores, setStores] = useState([]);
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
      const res = await masterService.getAll("variants");
      setData(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load variants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    masterService
      .getAll("stores")
      .then((r) => setStores(normalizeStoreList(r.data?.data || r.data || [])))
      .catch(() => {});
  }, [load]);

  const filtered = useMemo(
    () =>
      data.filter((r) => {
        const matchStore = !filterStore || r.store_id === filterStore;
        const matchSearch = !search.trim() || (r.name || "").toLowerCase().includes(search.toLowerCase());
        return matchStore && matchSearch;
      }),
    [data, search, filterStore],
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterStore, pageSize]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const openCreate = () => {
    setForm({ ...EMPTY, store_id: currentStore?.id || "" });
    setErrors({});
    setEditId(null);
    setModal("create");
  };
  const openEdit = (r) => {
    setForm({ name: r.name, multi_select: !!r.multi_select, store_id: r.store_id || "" });
    setErrors({});
    setEditId(r.id);
    setModal("edit");
  };
  const closeModal = () => {
    setModal(null);
    setEditId(null);
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Variant name is required";
    if (currentStore?.id == null && stores.length > 0 && !form.store_id) errs.store_id = "Store is required";
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), multi_select: !!form.multi_select, store_id: form.store_id || null };
      if (modal === "edit") {
        await masterService.update("variants", editId, payload);
        toast.success("Variant updated");
      } else {
        await masterService.create("variants", payload);
        toast.success("Variant created");
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await masterService.delete("variants", deleteDialog.id);
      toast.success("Variant deleted");
      load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteDialog({ open: false, id: null, label: "" });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push("...");
    }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) {
      if (right < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const storeMap = useMemo(() => Object.fromEntries(stores.map((s) => [s.id, s.name])), [stores]);

  return (
    <MainLayout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>
            Variants
          </strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic">
              <Search size={13} />
            </span>
            <input type="text" placeholder="Search variants..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} style={psStyle}>
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={psStyle}>
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={13} strokeWidth={2.5} />
              <span>Add Variant</span>
            </Button>
          </div>
        </div>
        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Variant Name</th>
                <th>Multi-Select</th>
                <th className="hidden md:table-cell">Stock</th>
                <th className="hidden lg:table-cell">Store</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>
                    Loading...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>
                    No variants found
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => openEdit(r)}>
                    <td>
                      <strong style={{ color: "var(--tx)" }}>{r.name}</strong>
                    </td>
                    <td>{r.multi_select ? <span style={{ background: "var(--abg)", color: "var(--accent)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>Multi</span> : <span style={{ color: "var(--tx3)", fontSize: 11 }}>Single</span>}</td>
                    <td className="hidden md:table-cell">
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: (r.stock_quantity ?? 0) > 0 ? "var(--green, #16a34a)" : "var(--red, #dc2626)",
                        }}
                      >
                        {(r.stock_quantity ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell">
                      {r.store_id ? <span style={{ background: "var(--abg)", color: "var(--accent)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>{storeMap[r.store_id] || "—"}</span> : <span style={{ color: "var(--tx3)", fontSize: 11 }}>All Stores</span>}
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                        <button
                          className="hbtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(r);
                          }}
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="hbtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({ open: true, id: r.id, label: r.name });
                          }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>
              Showing{" "}
              <strong style={{ color: "var(--tx)" }}>
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}
              </strong>{" "}
              of <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong>
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="hbtn" style={{ opacity: currentPage === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={13} />
                </button>
                {getPageNumbers().map((page, i) =>
                  page === "..." ? (
                    <span key={`d-${i}`} style={{ padding: "0 4px" }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="hbtn"
                      style={currentPage === page ? { background: "var(--abg)", borderColor: "var(--accent)", color: "var(--accent)", width: 28, height: 28, fontSize: 12 } : { width: 28, height: 28, fontSize: 12, color: "var(--tx2)" }}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="hbtn" style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          isOpen
          onClose={closeModal}
          title={modal === "edit" ? "Edit Variant" : "Add Variant"}
          width={480}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : modal === "edit" ? "Update" : "Create"}
              </Button>
            </>
          }
        >
          <div className="fg">
            <label>
              Variant Name <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Large, Red, Extra Cheese" autoFocus style={errors.name ? { borderColor: "var(--red)" } : {}} />
            {errors.name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.name}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: form.multi_select ? "var(--abg)" : "var(--bg3)", borderRadius: "var(--r)", border: `1px solid ${form.multi_select ? "var(--accent)" : "var(--bd)"}`, transition: "all 0.15s", marginTop: 4 }}>
            <input type="checkbox" id="multi_select" name="multi_select" checked={!!form.multi_select} onChange={handleChange} style={{ marginTop: 2, accentColor: "var(--accent)", width: 14, height: 14, flexShrink: 0, cursor: "pointer" }} />
            <label htmlFor="multi_select" style={{ cursor: "pointer", userSelect: "none" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tx)", display: "block", marginBottom: 3 }}>Allow Multiple Selection</span>
              <span style={{ fontSize: 11, color: "var(--tx3)", lineHeight: 1.5 }}>
                When checked, customers can select <strong style={{ color: "var(--tx2)" }}>multiple options</strong> of this variant (e.g. toppings). When unchecked, only <strong style={{ color: "var(--tx2)" }}>one option</strong> can be chosen (e.g. size: S / M / L).
              </span>
            </label>
          </div>
          {currentStore?.id == null && stores.length > 0 && (
            <div className="fg" style={{ marginTop: 10 }}>
              <label>
                Store <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <select name="store_id" value={form.store_id || ""} onChange={handleChange} style={errors.store_id ? { borderColor: "var(--red)" } : {}}>
                <option value="">Select store...</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
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
