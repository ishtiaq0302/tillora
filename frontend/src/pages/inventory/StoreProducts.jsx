import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Modal from "../component/Modal";
import DeleteDialog from "../component/DeleteDialog";
import Button from "../component/Button";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";
import useStoreRefresh from "../../hooks/useStoreRefresh";
import { useAuth } from "../../context/AuthContext";

const psStyle = { background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)", padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none" };

const EMPTY = { store_id: "", product_id: "", stock_quantity: 0, low_stock_alert: 0 };

const normalizeStoreList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.stores)) return payload.stores;
  }
  return [];
};

export default function StoreProducts() {
  const { currentStore } = useAuth();
  const [data, setData] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, storeId: null, productId: null, label: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getAll("store-products");
      setData(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load store inventory");
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
    masterService
      .getAll("products")
      .then((r) => setProducts(r.data?.data || r.data || []))
      .catch(() => {});
  }, [load]);

  useEffect(() => {
    setFilterStore(currentStore?.id ?? null);
  }, [currentStore?.id]);

  useStoreRefresh(load);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const matchStore = !filterStore || r.store_id === filterStore;
      const matchSearch = !search.trim() || (r.product?.name || "").toLowerCase().includes(search.toLowerCase()) || (r.product?.sku || "").toLowerCase().includes(search.toLowerCase());
      return matchStore && matchSearch;
    });
  }, [data, search, filterStore]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterStore, pageSize]);

  const storeMap = useMemo(() => Object.fromEntries(stores.map((s) => [s.id, s.name])), [stores]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const openCreate = () => {
    setForm({ ...EMPTY });
    setErrors({});
    setEditRecord(null);
    setModal("create");
  };
  const openEdit = (r) => {
    setForm({ store_id: r.store_id, product_id: r.product_id, stock_quantity: r.stock_quantity, low_stock_alert: r.low_stock_alert });
    setErrors({});
    setEditRecord(r);
    setModal("edit");
  };
  const closeModal = () => {
    setModal(null);
    setEditRecord(null);
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.store_id) errs.store_id = "Store is required";
    if (!form.product_id) errs.product_id = "Product is required";
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      await masterService.create("store-products", { store_id: form.store_id, product_id: form.product_id, stock_quantity: Number(form.stock_quantity || 0), low_stock_alert: Number(form.low_stock_alert || 0) });
      toast.success(modal === "edit" ? "Inventory updated" : "Product added to store");
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
      await masterService.delete("store-products", `${deleteDialog.storeId}/${deleteDialog.productId}`);
      toast.success("Product removed from store inventory");
      load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteDialog({ open: false, storeId: null, productId: null, label: "" });
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

  return (
    <MainLayout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>
            Store Inventory
          </strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic">
              <Search size={13} />
            </span>
            <input type="text" placeholder="Search product or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} style={psStyle}>
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select> */}
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
              <span>Add</span>
            </Button>
          </div>
        </div>
        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th className="hidden sm:table-cell">SKU</th>
                <th className="hidden md:table-cell">Store</th>
                <th>Stock Qty</th>
                <th className="hidden lg:table-cell">Low Stock Alert</th>
                <th className="hidden xl:table-cell">Updated</th>
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
                    No inventory records found
                  </td>
                </tr>
              ) : (
                paged.map((r, i) => {
                  const isLow = r.low_stock_alert > 0 && r.stock_quantity <= r.low_stock_alert;
                  return (
                    <tr key={`${r.store_id}-${r.product_id}-${i}`} style={{ cursor: "pointer" }} onClick={() => openEdit(r)}>
                      <td>
                        <strong style={{ color: "var(--tx)" }}>{r.product?.name || "—"}</strong>
                      </td>
                      <td className="hidden sm:table-cell" style={{ fontFamily: "monospace", fontSize: 11, color: "var(--tx3)" }}>
                        {r.product?.sku || "—"}
                      </td>
                      <td className="hidden md:table-cell" style={{ color: "var(--tx2)", fontSize: 12 }}>
                        {storeMap[r.store_id] || "—"}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: isLow ? "var(--red)" : "var(--tx)" }}>
                          {Number(r.stock_quantity).toLocaleString()}
                          {isLow && <span style={{ fontSize: 10, marginLeft: 6, background: "var(--rbg)", color: "var(--red)", padding: "1px 5px", borderRadius: 4 }}>Low</span>}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell" style={{ color: "var(--tx3)", fontSize: 12 }}>
                        {Number(r.low_stock_alert).toLocaleString()}
                      </td>
                      <td className="hidden xl:table-cell" style={{ color: "var(--tx3)", fontSize: 11 }}>
                        {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}
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
                              setDeleteDialog({ open: true, storeId: r.store_id, productId: r.product_id, label: r.product?.name });
                            }}
                            title="Remove"
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
          title={modal === "edit" ? "Update Store Inventory" : "Add Product to Store"}
          width={480}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : modal === "edit" ? "Update" : "Add"}
              </Button>
            </>
          }
        >
          <div className="fg">
            <label>
              Store <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <select name="store_id" value={form.store_id} onChange={handleChange} disabled={modal === "edit"} style={errors.store_id ? { borderColor: "var(--red)" } : {}}>
              <option value="">Select store...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.store_id && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.store_id}</span>}
          </div>
          <div className="fg">
            <label>
              Product <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <select name="product_id" value={form.product_id} onChange={handleChange} disabled={modal === "edit"} style={errors.product_id ? { borderColor: "var(--red)" } : {}}>
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.sku ? ` (${p.sku})` : ""}
                </option>
              ))}
            </select>
            {errors.product_id && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.product_id}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="fg">
              <label>Stock Quantity</label>
              <input name="stock_quantity" type="number" value={form.stock_quantity} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div className="fg">
              <label>Low Stock Alert</label>
              <input name="low_stock_alert" type="number" value={form.low_stock_alert} onChange={handleChange} min="0" step="0.01" />
            </div>
          </div>
        </Modal>
      )}

      <DeleteDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, storeId: null, productId: null, label: "" })} onConfirm={handleDelete} label={deleteDialog.label} />
    </MainLayout>
  );
}
