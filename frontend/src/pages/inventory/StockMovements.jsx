import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";
import useStoreRefresh from "../../hooks/useStoreRefresh";
import Button from "../component/Button";
import { useAuth } from "../../context/AuthContext";

const psStyle = {
  background: "var(--inp)",
  border: "1px solid var(--inpbd)",
  borderRadius: "var(--r)",
  padding: "3px 22px 3px 7px",
  fontSize: 12,
  color: "var(--tx)",
  fontFamily: "var(--font)",
  outline: "none",
};

const TYPE_COLORS = {
  sale: { bg: "var(--rbg)", color: "var(--red)" },
  purchase: { bg: "var(--gbg)", color: "var(--green)" },
  adjustment: { bg: "var(--ambg)", color: "var(--amber)" },
  return: { bg: "var(--pbg)", color: "var(--purple)" },
};

const EMPTY_ADJ = { product_id: "", movement_type: "adjustment", quantity: "", notes: "", store_id: "" };

export default function StockMovements() {
  const { currentStore } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [stores, setStores] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_ADJ });
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getAll("stock-movements");
      setData(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useStoreRefresh(loadData);

  useEffect(() => {
    masterService
      .getAll("products")
      .then((res) => setProducts(res.data?.data || res.data || []))
      .catch(() => {});
    masterService
      .getAll("stores")
      .then((res) => setStores(normalizeStoreList(res.data?.data || res.data || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setFilterStore(currentStore?.id ?? null);
  }, [currentStore?.id]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const matchSearch = !search.trim() || (r.product?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || r.movement_type === filterType;
      const matchStore = !filterStore || r.store_id === filterStore;
      return matchSearch && matchType && matchStore;
    });
  }, [data, search, filterType, filterStore]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterType, filterStore, pageSize]);

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

  const typeStyle = (type) => TYPE_COLORS[type] || { bg: "var(--bg3)", color: "var(--tx2)" };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!currentStore?.id && !form.store_id) return toast.error("Store is required");
    if (!form.product_id) return toast.error("Please select a product");
    if (!form.quantity || form.quantity === "0") return toast.error("Quantity is required");
    setSaving(true);
    try {
      await masterService.create("stock-movements", {
        product_id: form.product_id,
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
        notes: form.notes || null,
        store_id: form.store_id || undefined,
      });
      toast.success("Stock movement logged");
      setShowModal(false);
      setForm({ ...EMPTY_ADJ });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>
            Stock Movements
          </strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic">
              <Search size={13} />
            </span>
            <input type="text" placeholder="Search product..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {/* <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} style={psStyle}>
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select> */}
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={psStyle}>
              <option value="">All Types</option>
              <option value="sale">Sale</option>
              <option value="purchase">Purchase</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
            </select>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={psStyle}>
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
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
                <th className="hidden sm:table-cell">Type</th>
                <th>Quantity</th>
                <th className="hidden md:table-cell">Reference</th>
                <th className="hidden lg:table-cell">Notes</th>
                <th className="hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>
                    Loading...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>
                    No stock movements found
                  </td>
                </tr>
              ) : (
                paged.map((r) => {
                  const s = typeStyle(r.movement_type);
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong style={{ color: "var(--tx)" }}>{r.product?.name || r.product_id}</strong>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span style={{ background: s.bg, color: s.color, borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{r.movement_type}</span>
                      </td>
                      <td>
                        <span style={{ color: r.quantity >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                          {r.quantity > 0 ? "+" : ""}
                          {Number(r.quantity).toLocaleString()}
                        </span>
                      </td>
                      <td className="hidden md:table-cell" style={{ color: "var(--tx3)", fontSize: 12 }}>
                        {r.reference_type || "—"}
                      </td>
                      <td className="hidden lg:table-cell" style={{ color: "var(--tx3)" }}>
                        {r.notes || "—"}
                      </td>
                      <td className="hidden lg:table-cell" style={{ color: "var(--tx3)", fontSize: 11.5 }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
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
              of <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong> movements
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

      {/* Add Adjustment Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="fcard" style={{ width: 420, maxWidth: "calc(100vw - 32px)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <strong style={{ fontSize: 14, color: "var(--tx)" }}>Log Stock Adjustment</strong>
              <button
                className="hbtn"
                onClick={() => {
                  setShowModal(false);
                  setForm({ ...EMPTY_ADJ });
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="fg">
                <label>
                  Product <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <select name="product_id" value={form.product_id} onChange={handleChange}>
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Movement Type</label>
                <select name="movement_type" value={form.movement_type} onChange={handleChange}>
                  <option value="adjustment">Adjustment</option>
                  <option value="return">Return</option>
                  <option value="purchase">Purchase</option>
                  <option value="sale">Sale</option>
                </select>
              </div>
              <div className="fg">
                <label>
                  Quantity <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="Use negative for stock reduction (e.g. -5)" />
              </div>
              <div className="fg">
                <label>Notes</label>
                <input name="notes" value={form.notes} onChange={handleChange} placeholder="Optional note..." />
              </div>
              {currentStore?.id == null && stores.length > 0 && (
                <div className="fg">
                  <label>
                    Store <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <select name="store_id" value={form.store_id || ""} onChange={handleChange}>
                    <option value="">Select Store</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowModal(false);
                  setForm({ ...EMPTY_ADJ });
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : "Log Movement"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
