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

const EMPTY = { product_id: "", variant_name: "", sku: "", barcode: "", cost_price: 0, selling_price: 0, stock_quantity: 0, store_id: "" };

export default function ProductVariants() {
  const { currentStore } = useAuth();
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
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
      const res = await masterService.getAll("product-variants");
      setData(res.data?.data || res.data || []);
    } catch { toast.error("Failed to load product variants"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    masterService.getAll("products").then(r => setProducts(r.data?.data || r.data || [])).catch(() => {});
    masterService.getAll("stores").then(r => setStores(r.data?.data || r.data || [])).catch(() => {});
  }, [load]);

  const filtered = useMemo(() => data.filter(r => {
    const matchProd = !filterProduct || r.product_id === filterProduct;
    const matchStore = !filterStore || r.store_id === filterStore;
    const matchSearch = !search.trim() || (r.variant_name || "").toLowerCase().includes(search.toLowerCase()) || (r.sku || "").toLowerCase().includes(search.toLowerCase());
    return matchProd && matchStore && matchSearch;
  }), [data, search, filterProduct, filterStore]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterProduct, filterStore, pageSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }));
  };

  const openCreate = () => { setForm({ ...EMPTY, store_id: currentStore?.id || "" }); setErrors({}); setEditId(null); setModal("create"); };
  const openEdit = (r) => {
    setForm({ product_id: r.product_id, variant_name: r.variant_name, sku: r.sku || "", barcode: r.barcode || "", cost_price: r.cost_price, selling_price: r.selling_price, stock_quantity: r.stock_quantity, store_id: r.store_id || "" });
    setErrors({}); setEditId(r.id); setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditId(null); };

  const handleSave = async () => {
    const errs = {};
    if (!form.product_id) errs.product_id = "Product is required";
    if (!form.variant_name?.trim()) errs.variant_name = "Variant name is required";
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      const payload = { product_id: form.product_id, variant_name: form.variant_name.trim(), sku: form.sku || null, barcode: form.barcode || null, cost_price: Number(form.cost_price || 0), selling_price: Number(form.selling_price || 0), stock_quantity: Number(form.stock_quantity || 0), store_id: form.store_id || null };
      if (modal === "edit") {
        await masterService.update("product-variants", editId, payload);
        toast.success("Variant updated");
      } else {
        await masterService.create("product-variants", payload);
        toast.success("Variant created");
      }
      closeModal(); load();
    } catch (err) { toast.error(err?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await masterService.delete("product-variants", deleteDialog.id); toast.success("Variant deleted"); load(); }
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

  const storeMap = useMemo(() => Object.fromEntries(stores.map(s => [s.id, s.name])), [stores]);

  return (
    <MainLayout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>Product Variants</strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder="Search variant or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} style={psStyle}>
              <option value="">All Products</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
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
            <Button variant="primary" size="sm" onClick={openCreate}><Plus size={13} strokeWidth={2.5} /><span>Add</span></Button>
          </div>
        </div>
        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant Name</th>
                <th className="hidden sm:table-cell">SKU</th>
                <th className="hidden md:table-cell">Cost</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="hidden lg:table-cell">Store</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>No product variants found</td></tr>
              ) : paged.map(r => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => openEdit(r)}>
                  <td style={{ color: "var(--tx2)", fontSize: 12 }}>{r.product?.name || "—"}</td>
                  <td><strong style={{ color: "var(--tx)" }}>{r.variant_name}</strong></td>
                  <td className="hidden sm:table-cell" style={{ fontFamily: "monospace", fontSize: 11, color: "var(--tx3)" }}>{r.sku || "—"}</td>
                  <td className="hidden md:table-cell" style={{ color: "var(--tx3)", fontSize: 12 }}>{Number(r.cost_price).toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>{Number(r.selling_price).toFixed(2)}</td>
                  <td style={{ color: r.stock_quantity <= 0 ? "var(--red)" : "var(--tx)", fontWeight: 600 }}>{Number(r.stock_quantity)}</td>
                  <td className="hidden lg:table-cell">
                    {r.store_id ? (
                      <span style={{ background: "var(--abg)", color: "var(--accent)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>
                        {storeMap[r.store_id] || "—"}
                      </span>
                    ) : <span style={{ color: "var(--tx3)", fontSize: 11 }}>All Stores</span>}
                  </td>
                  <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                      <button className="hbtn" onClick={e => { e.stopPropagation(); openEdit(r); }} title="Edit"><Pencil size={12} /></button>
                      <button className="hbtn" onClick={e => { e.stopPropagation(); setDeleteDialog({ open: true, id: r.id, label: r.variant_name }); }} title="Delete"><Trash2 size={12} /></button>
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
        <Modal isOpen onClose={closeModal} title={modal === "edit" ? "Edit Variant" : "Add Variant"} width={520}
          footer={<><Button variant="ghost" size="sm" onClick={closeModal}>Cancel</Button><Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>{saving ? "Saving..." : modal === "edit" ? "Update" : "Create"}</Button></>}
        >
          <div className="fg">
            <label>Product <span style={{ color: "var(--red)" }}>*</span></label>
            <select name="product_id" value={form.product_id} onChange={handleChange} disabled={modal === "edit"} style={errors.product_id ? { borderColor: "var(--red)" } : {}}>
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.product_id && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.product_id}</span>}
          </div>
          <div className="fg">
            <label>Variant Name <span style={{ color: "var(--red)" }}>*</span></label>
            <input name="variant_name" value={form.variant_name} onChange={handleChange} placeholder="e.g. Red / Large" autoFocus style={errors.variant_name ? { borderColor: "var(--red)" } : {}} />
            {errors.variant_name && <span style={{ fontSize: 11, color: "var(--red)" }}>{errors.variant_name}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="fg"><label>SKU</label><input name="sku" value={form.sku} onChange={handleChange} placeholder="Optional" /></div>
            <div className="fg"><label>Barcode</label><input name="barcode" value={form.barcode} onChange={handleChange} placeholder="Optional" /></div>
            <div className="fg"><label>Cost Price</label><input name="cost_price" type="number" value={form.cost_price} onChange={handleChange} min="0" step="0.01" /></div>
            <div className="fg"><label>Selling Price</label><input name="selling_price" type="number" value={form.selling_price} onChange={handleChange} min="0" step="0.01" /></div>
          </div>
          <div className="fg"><label>Stock Quantity</label><input name="stock_quantity" type="number" value={form.stock_quantity} onChange={handleChange} min="0" step="0.01" /></div>
          {currentStore?.id == null && stores.length > 0 && (
            <div className="fg">
              <label>Store Availability</label>
              <select name="store_id" value={form.store_id || ""} onChange={handleChange}>
                <option value="">All Stores</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </Modal>
      )}

      <DeleteDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, label: "" })} onConfirm={handleDelete} label={deleteDialog.label} />
    </MainLayout>
  );
}
