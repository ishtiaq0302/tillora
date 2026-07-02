import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, Trash2, Printer } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Modal from "../component/Modal";
import DeleteDialog from "../component/DeleteDialog";
import Button from "../component/Button";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";
import useStoreRefresh from "../../hooks/useStoreRefresh";
import { useLanguage } from "../../context/LanguageContext";
import { printPurchaseInvoice } from "../../utils/printInvoice";

const pageSizeStyle = {
  background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)",
  padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none",
};

const PAY_STATUS = {
  paid: { bg: "var(--gbg)", color: "var(--green)" },
  pending: { bg: "var(--ambg)", color: "var(--amber)" },
  partial: { bg: "var(--pbg)", color: "var(--purple)" },
  cancelled: { bg: "var(--rbg)", color: "var(--red)" },
};

export default function Purchases() {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [stores, setStores] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewPurchase, setViewPurchase] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getAll("purchases");
      setData(res.data?.data || res.data || []);
    } catch { toast.error(t("failed_to_load", "purchases")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    masterService.getAll("stores").then((res) => setStores(res.data?.data || res.data || [])).catch(() => {});
  }, [loadData]);
  useStoreRefresh(loadData);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (r.invoice_no || "").toLowerCase().includes(q) || (r.supplier?.name || "").toLowerCase().includes(q);
      const matchStatus = !filterStatus || r.payment_status === filterStatus;
      const matchStore = !filterStore || r.store_id === filterStore;
      return matchSearch && matchStatus && matchStore;
    });
  }, [data, search, filterStatus, filterStore]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterStatus, filterStore, pageSize]);

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

  const statusStyle = (s) => PAY_STATUS[s] || { bg: "var(--bg3)", color: "var(--tx2)" };

  const toggleSelect = (id) => setSelectedItems((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
  const toggleSelectAll = () => setSelectedItems(selectedItems.length === paged.length ? [] : paged.map((r) => r.id));

  const handleDelete = async () => {
    try {
      const ids = Array.isArray(deleteDialog.id) ? deleteDialog.id : [deleteDialog.id];
      await Promise.all(ids.map((id) => masterService.delete("purchases", id)));
      toast.success("Deleted successfully");
      loadData();
      setSelectedItems([]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeleteDialog({ open: false, id: null, label: "" });
    }
  };

  return (
    <MainLayout>
      <DeleteDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, label: "" })}
        onConfirm={handleDelete}
        label={deleteDialog.label}
      />

      {viewPurchase && (
        <Modal isOpen onClose={() => setViewPurchase(null)} title={`Purchase — ${viewPurchase.invoice_no}`}
          columns={{ sm: 1, md: 2 }} width={640}
          footer={
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => printPurchaseInvoice(viewPurchase)} style={{ gap: 5 }}>
                <Printer size={13} /> Print
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewPurchase(null)}>{t("close", "common")}</Button>
            </div>
          }>
          <div className="fg"><label>{t("invoice", "common")}</label><p style={{ fontSize: 13, color: "var(--tx)", fontWeight: 600 }}>{viewPurchase.invoice_no}</p></div>
          <div className="fg"><label>{t("supplier", "common")}</label><p style={{ fontSize: 13, color: "var(--tx)" }}>{viewPurchase.supplier?.name || "—"}</p></div>
          <div className="fg"><label>{t("subtotal", "common")}</label><p style={{ fontSize: 13, color: "var(--tx)" }}>{Number(viewPurchase.subtotal).toLocaleString()}</p></div>
          <div className="fg"><label>{t("discount", "common")}</label><p style={{ fontSize: 13, color: "var(--tx)" }}>{Number(viewPurchase.discount).toLocaleString()}</p></div>
          <div className="fg"><label>{t("tax", "common")}</label><p style={{ fontSize: 13, color: "var(--tx)" }}>{Number(viewPurchase.tax).toLocaleString()}</p></div>
          <div className="fg"><label>{t("shipping", "common")}</label><p style={{ fontSize: 13, color: "var(--tx)" }}>{Number(viewPurchase.shipping || 0).toLocaleString()}</p></div>
          <div className="fg"><label>{t("grand_total", "common")}</label><p style={{ fontSize: 15, color: "var(--green)", fontWeight: 700 }}>{Number(viewPurchase.grand_total).toLocaleString()}</p></div>
          <div className="fg">
            <label>{t("payment_status", "common")}</label>
            <span style={{ ...statusStyle(viewPurchase.payment_status), borderRadius: "var(--r)", padding: "3px 10px", fontSize: 12, fontWeight: 600, textTransform: "capitalize", display: "inline-block" }}>
              {viewPurchase.payment_status}
            </span>
          </div>
          <div className="fg"><label>{t("purchase_status", "purchases")}</label><p style={{ fontSize: 13, color: "var(--tx)", textTransform: "capitalize" }}>{viewPurchase.purchase_status}</p></div>
          <div className="fg"><label>{t("date", "common")}</label><p style={{ fontSize: 13, color: "var(--tx)" }}>{viewPurchase.created_at ? new Date(viewPurchase.created_at).toLocaleString() : "—"}</p></div>
          {viewPurchase.notes && (
            <div className="fg" style={{ gridColumn: "1 / -1" }}><label>{t("notes", "common")}</label><p style={{ fontSize: 13, color: "var(--tx)" }}>{viewPurchase.notes}</p></div>
          )}
          {viewPurchase.purchaseItems?.length > 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--tx3)", marginBottom: 8 }}>{t("line_items", "common")}</p>
              <table className="w-full" style={{ fontSize: 12 }}>
                <thead><tr><th>{t("product", "common")}</th><th>{t("qty", "common")}</th><th>{t("cost", "common")}</th><th>{t("total", "common")}</th></tr></thead>
                <tbody>
                  {viewPurchase.purchaseItems.map((item, i) => (
                    <tr key={i}>
                      <td>{item.product?.name || item.product_id}</td>
                      <td>{item.quantity}</td>
                      <td>{Number(item.cost_price ?? item.price).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{Number(item.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>{t("title", "purchases")}</strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder={t("search_placeholder", "purchases")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {selectedItems.length > 0 && (
              <Button variant="danger" size="sm" onClick={() => setDeleteDialog({ open: true, id: selectedItems, label: `${selectedItems.length} purchases` })}>
                {t("delete", "common")} ({selectedItems.length})
              </Button>
            )}
            <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} style={pageSizeStyle}>
              <option value="">{t("all_stores", "common")}</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={pageSizeStyle}>
              <option value="">{t("all_status", "common")}</option>
              <option value="paid">{t("paid", "common")}</option>
              <option value="pending">{t("pending", "common")}</option>
              <option value="partial">{t("partial", "common")}</option>
              <option value="cancelled">{t("cancelled", "common")}</option>
            </select>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>{t("show", "common")}</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={pageSizeStyle}>
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <Link to="/purchases/create" className="btn btn-p" style={{ fontSize: 12 }}>
              <Plus size={13} strokeWidth={2.5} /><span>{t("new_purchase", "purchases")}</span>
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
                <th>{t("invoice", "common")}</th>
                <th className="hidden sm:table-cell">{t("supplier", "common")}</th>
                <th className="hidden md:table-cell">{t("store", "common")}</th>
                <th>{t("total", "common")}</th>
                <th>{t("status", "common")}</th>
                <th className="hidden lg:table-cell">{t("date", "common")}</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>{t("loading", "common")}</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>{t("no_purchases_found", "purchases")}</td></tr>
              ) : paged.map((r) => {
                const s = statusStyle(r.payment_status);
                return (
                  <tr key={r.id}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedItems.includes(r.id)} onChange={() => toggleSelect(r.id)}
                        style={{ width: 12, height: 12, accentColor: "var(--accent)", cursor: "pointer" }} />
                    </td>
                    <td><strong style={{ color: "var(--tx)" }}>{r.invoice_no}</strong></td>
                    <td className="hidden sm:table-cell">{r.supplier?.name || "—"}</td>
                    <td className="hidden md:table-cell" style={{ color: "var(--tx3)" }}>{r.store?.name || "—"}</td>
                    <td><span style={{ color: "var(--green)", fontWeight: 600 }}>{Number(r.grand_total).toLocaleString()}</span></td>
                    <td>
                      <span style={{ background: s.bg, color: s.color, borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
                        {r.payment_status}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell" style={{ color: "var(--tx3)", fontSize: 11.5 }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button className="hbtn" onClick={() => setViewPurchase(r)} title="View"><Eye size={13} /></button>
                        <button className="hbtn" onClick={() => setDeleteDialog({ open: true, id: r.id, label: r.invoice_no })} title="Delete" style={{ color: "var(--red)" }}><Trash2 size={12} /></button>
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
            <span>{t("showing", "common")} <strong style={{ color: "var(--tx)" }}>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}</strong> {t("of", "common")} <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong> {t("title", "purchases").toLowerCase()}</span>
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
    </MainLayout>
  );
}
