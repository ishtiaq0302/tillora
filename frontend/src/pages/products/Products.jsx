import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import DeleteDialog from "../component/DeleteDialog";
import Button from "../component/Button";
import toast from "react-hot-toast";
import productService from "../../services/productService";
import masterService from "../../services/masterService";
import useStoreRefresh from "../../hooks/useStoreRefresh";
import { useLanguage } from "../../context/LanguageContext";

const pageSizeStyle = {
  background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)",
  padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none",
};

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [filterStore, setFilterStore] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: "" });
  const [selectedItems, setSelectedItems] = useState([]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getAll();
      setProducts(res.data?.data || res.data || []);
    } catch { toast.error(t("failed_to_load", "products")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadProducts();
    masterService.getAll("categories").then((res) => setCategories(res.data?.data || res.data || [])).catch(() => {});
    masterService.getAll("stores").then((res) => setStores(res.data?.data || res.data || [])).catch(() => {});
  }, [loadProducts]);

  useStoreRefresh(loadProducts);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || (p.barcode || "").toLowerCase().includes(q);
      const matchCat = !filterCategory || p.category_id === filterCategory;
      const matchStatus = filterStatus === "" ? true : filterStatus === "active" ? p.is_active : !p.is_active;
      const matchStore = !filterStore || p.store_id === filterStore;
      return matchSearch && matchCat && matchStatus && matchStore;
    });
  }, [products, search, filterCategory, filterStatus, filterStore]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterCategory, filterStatus, filterStore, pageSize]);

  const toggleSelect = (id) => setSelectedItems((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
  const toggleSelectAll = () => setSelectedItems(selectedItems.length === paged.length ? [] : paged.map((p) => p.id));

  const handleDelete = async () => {
    try {
      const ids = Array.isArray(deleteDialog.id) ? deleteDialog.id : [deleteDialog.id];
      await Promise.all(ids.map((id) => productService.delete(id)));
      toast.success(t("product_deleted", "products"));
      loadProducts();
      setSelectedItems([]);
    } catch { toast.error(t("delete_failed", "products")); }
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
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>{t("title", "products")}</strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder={t("search_placeholder", "products")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} style={pageSizeStyle}>
              <option value="">{t("all_stores", "common")}</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={pageSizeStyle}>
              <option value="">{t("all_categories", "products")}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={pageSizeStyle}>
              <option value="">{t("all_status", "common")}</option>
              <option value="active">{t("active", "common")}</option>
              <option value="inactive">{t("inactive", "common")}</option>
            </select>
            {selectedItems.length > 0 && (
              <Button variant="danger" size="sm" onClick={() => setDeleteDialog({ open: true, id: selectedItems, label: `${selectedItems.length} products` })}>
                {t("delete", "common")} ({selectedItems.length})
              </Button>
            )}
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>{t("show", "common")}</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={pageSizeStyle}>
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <Link to="/products/create" className="btn btn-p" style={{ fontSize: 12 }}>
              <Plus size={13} strokeWidth={2.5} /><span>{t("add", "common")}</span>
            </Link>
          </div>
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" checked={paged.length > 0 && selectedItems.length === paged.length} onChange={toggleSelectAll}
                    style={{ width: 12, height: 12, accentColor: "var(--accent)", cursor: "pointer" }} />
                </th>
                <th>{t("product", "common")}</th>
                <th className="hidden sm:table-cell">{t("sku", "products")}</th>
                <th className="hidden md:table-cell">{t("category", "products")}</th>
                <th>{t("price", "products")}</th>
                <th className="hidden lg:table-cell">{t("stock", "products")}</th>
                <th>{t("status", "common")}</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>{t("loading", "common")}</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>{t("no_products_found", "products")}</td></tr>
              ) : paged.map((p) => (
                <tr key={p.id}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedItems.includes(p.id)} onChange={() => toggleSelect(p.id)}
                      style={{ width: 12, height: 12, accentColor: "var(--accent)", cursor: "pointer" }} />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontWeight: 500, color: "var(--tx)" }}>{p.name}</span>
                      {p.product_type === "variant" && (
                        <span style={{ background: "var(--pbg)", color: "var(--purple)", borderRadius: "var(--r)", padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>
                          Variants
                        </span>
                      )}
                    </div>
                    {p.barcode && <div style={{ fontSize: 10.5, color: "var(--tx3)" }}>{p.barcode}</div>}
                  </td>
                  <td className="hidden sm:table-cell">
                    <span style={{ background: "var(--bg3)", borderRadius: "var(--r)", padding: "2px 7px", fontSize: 11, fontFamily: "monospace", color: "var(--tx2)" }}>
                      {p.sku || "—"}
                    </span>
                  </td>
                  <td className="hidden md:table-cell" style={{ color: "var(--tx3)" }}>{catName(p.category_id)}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--green)" }}>{Number(p.selling_price).toLocaleString()}</div>
                    {Number(p.cost_price) > 0 && <div style={{ fontSize: 10.5, color: "var(--tx3)" }}>{t("cost", "products")} {Number(p.cost_price).toLocaleString()}</div>}
                  </td>
                  <td className="hidden lg:table-cell">
                    <span style={{ color: Number(p.stock_quantity) <= Number(p.stock_alert_quantity) && Number(p.stock_alert_quantity) > 0 ? "var(--amber)" : "var(--green)", fontWeight: 500, fontSize: 12 }}>
                      {Number(p.stock_quantity).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className={`sta ${p.is_active ? "ok" : "er"}`}>
                      {p.is_active ? t("active", "common") : t("inactive", "common")}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                      <Link to={`/products/edit/${p.id}`} className="hbtn" title={t("edit", "common")}><Pencil size={12} /></Link>
                      <button className="hbtn" onClick={() => setDeleteDialog({ open: true, id: p.id, label: p.name })} title={t("delete", "common")}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>
              {t("showing", "common")} <strong style={{ color: "var(--tx)" }}>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}</strong> {t("of", "common")} <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong> {t("title", "products").toLowerCase()}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="hbtn" style={{ opacity: currentPage === 1 ? 0.4 : 1 }}><ChevronLeft size={13} /></button>
                {getPageNumbers().map((page, i) =>
                  page === "..." ? <span key={`d-${i}`} style={{ padding: "0 4px" }}>…</span> : (
                    <button key={page} onClick={() => setCurrentPage(page)} className="hbtn"
                      style={currentPage === page ? { background: "var(--abg)", borderColor: "var(--accent)", color: "var(--accent)", width: 28, height: 28, fontSize: 12 } : { width: 28, height: 28, fontSize: 12, color: "var(--tx2)" }}>
                      {page}
                    </button>
                  )
                )}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="hbtn" style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}><ChevronRight size={13} /></button>
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, label: "" })}
        onConfirm={handleDelete}
        label={deleteDialog.label}
      />
    </MainLayout>
  );
}
