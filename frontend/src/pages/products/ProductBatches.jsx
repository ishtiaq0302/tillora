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

const EMPTY = { batch_no: "", manufacture_date: "", expiry_date: "", quantity: 0, store_id: "" };

const toDateStr = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const toInputDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

export default function ProductBatches() {
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
      const res = await masterService.getAll("product-batches");
      setData(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load batches");
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
        const matchSearch = !search.trim() || (r.batch_no || "").toLowerCase().includes(search.toLowerCase()) || (r.product?.name || "").toLowerCase().includes(search.toLowerCase());
        return matchStore && matchSearch;
      }),
    [data, search, filterStore],
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterStore, pageSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const openCreate = () => {
    setForm({ ...EMPTY, store_id: currentStore?.id || "" });
    setErrors({});
    setEditId(null);
    setModal("create");
  };
  const openEdit = (r) => {
    setForm({ batch_no: r.batch_no, manufacture_date: toInputDate(r.manufacture_date), expiry_date: toInputDate(r.expiry_date), quantity: r.quantity, store_id: r.store_id || "" });
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
    if (!form.batch_no?.trim()) errs.batch_no = "Batch number is required";
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      const payload = { batch_no: form.batch_no.trim(), manufacture_date: form.manufacture_date || null, expiry_date: form.expiry_date || null, quantity: Number(form.quantity || 0), store_id: form.store_id || null };
      if (modal === "edit") {
        await masterService.update("product-batches", editId, payload);
        toast.success("Batch updated");
      } else {
        await masterService.create("product-batches", payload);
        toast.success("Batch created");
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
      await masterService.delete("product-batches", deleteDialog.id);
      toast.success("Batch deleted");
      load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteDialog({ open: false, id: null, label: "" });
    }
  };

  const isExpiringSoon = (d) => {
    if (!d) return false;
    const days = (new Date(d) - new Date()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };
  const isExpired = (d) => d && new Date(d) < new Date();

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
            Batches
          </strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic">
              <Search size={13} />
            </span>
            <input type="text" placeholder="Search batch no or product..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <span>Add Batch</span>
            </Button>
          </div>
        </div>
        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch No</th>
                <th className="hidden md:table-cell">Manufacture Date</th>
                <th>Expiry Date</th>
                <th>Qty</th>
                <th className="hidden lg:table-cell">Store</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>
                    Loading...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>
                    No batches found
                  </td>
                </tr>
              ) : (
                paged.map((r) => {
                  const expired = isExpired(r.expiry_date);
                  const expiringSoon = !expired && isExpiringSoon(r.expiry_date);
                  return (
                    <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => openEdit(r)}>
                      <td style={{ color: "var(--tx2)", fontSize: 12 }}>{r.product?.name || "—"}</td>
                      <td>
                        <strong style={{ color: "var(--tx)", fontFamily: "monospace", fontSize: 12 }}>{r.batch_no}</strong>
                      </td>
                      <td className="hidden md:table-cell" style={{ color: "var(--tx3)", fontSize: 12 }}>
                        {toDateStr(r.manufacture_date)}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: expired || expiringSoon ? 600 : 400, color: expired ? "var(--red)" : expiringSoon ? "var(--amber)" : "var(--tx2)" }}>
                          {toDateStr(r.expiry_date)}
                          {expired && <span style={{ fontSize: 10, marginLeft: 6, background: "var(--rbg)", color: "var(--red)", padding: "1px 5px", borderRadius: 4 }}>Expired</span>}
                          {expiringSoon && <span style={{ fontSize: 10, marginLeft: 6, background: "var(--ambg)", color: "var(--amber)", padding: "1px 5px", borderRadius: 4 }}>Exp. Soon</span>}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{Number(r.quantity)}</td>
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
                              setDeleteDialog({ open: true, id: r.id, label: r.batch_no });
                            }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
          title={modal === "edit" ? "Edit Batch" : "Add Batch"}
          width={520}
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
              Batch Number <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input name="batch_no" value={form.batch_no} onChange={handleChange} placeholder="e.g. BTH-2025-001" autoFocus style={errors.batch_no ? { borderColor: "var(--red)" } : {}} />
            {errors.batch_no && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.batch_no}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="fg">
              <label>Manufacture Date</label>
              <input name="manufacture_date" type="date" value={form.manufacture_date} onChange={handleChange} />
            </div>
            <div className="fg">
              <label>Expiry Date</label>
              <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} />
            </div>
          </div>
          <div className="fg">
            <label>Quantity</label>
            <input name="quantity" type="number" value={form.quantity} onChange={handleChange} min="0" step="0.01" />
          </div>
          {currentStore?.id == null && stores.length > 0 && (
            <div className="fg">
              <label>Store Availability</label>
              <select name="store_id" value={form.store_id || ""} onChange={handleChange}>
                <option value="">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Modal>
      )}

      <DeleteDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, label: "" })} onConfirm={handleDelete} label={deleteDialog.label} />
    </MainLayout>
  );
}
