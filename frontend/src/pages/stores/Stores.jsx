import MainLayout from "../../layout/MainLayout";
import DeleteDialog from "../component/DeleteDialog";
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStores, deleteStore } from "../../services/storeService";
import toast from "react-hot-toast";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, AlertTriangle, CreditCard } from "lucide-react";
import Modal from "../component/Modal";
import Button from "../component/Button";
import Badge from "../component/Badge";
import { useLanguage } from "../../context/LanguageContext";

const SERVER_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const pageSizeStyle = {
  background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)",
  padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none",
};

function StoreDetailModal({ store, onClose }) {
  const { t } = useLanguage();
  if (!store) return null;

  const formatDate = (val) => {
    if (!val) return "-";
    const date = new Date(val);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const Y = String(date.getFullYear());
    switch (store.dateFormat) {
      case "d-m-Y": return `${d}-${m}-${Y}`;
      case "m-d-Y": return `${m}-${d}-${Y}`;
      case "Y-m-d": return `${Y}-${m}-${d}`;
      case "d/m/Y": return `${d}/${m}/${Y}`;
      case "m/d/Y": return `${m}/${d}/${Y}`;
      default: return `${d}-${m}-${Y}`;
    }
  };

  const fields = [
    { label: t("store_name_label", "stores"), value: store.name },
    { label: t("store_code_label", "stores"), value: store.code },
    { label: t("store_type_label", "stores"), value: store.storeType },
    { label: t("phone", "stores"), value: store.phone },
    { label: t("email", "stores"), value: store.email },
    { label: t("address", "stores"), value: store.address },
    { label: t("city", "stores"), value: store.city },
    { label: t("state", "stores"), value: store.state },
    { label: t("country", "stores"), value: store.country },
    { label: t("zip_code", "stores"), value: store.zipCode },
    { label: t("currency", "stores"), value: store.currency },
    { label: t("timezone", "stores"), value: store.timezone },
    { label: t("date_format_label", "stores"), value: store.dateFormat },
    { label: t("tax_number", "stores"), value: store.taxNumber },
    { label: t("created_at", "stores"), value: formatDate(store.createdAt) },
    { label: t("updated_at", "stores"), value: formatDate(store.updatedAt) },
  ];

  return (
    <Modal isOpen={!!store} onClose={onClose} width={860} columns={{ sm: 1, md: 2, lg: 3 }}
      title={
        <div className="flex items-center gap-2">
          <span>{store.name}</span>
          <Badge variant={store.isActive ? "success" : "danger"}>
            {store.isActive ? t("active", "stores") : t("inactive", "stores")}
          </Badge>
        </div>
      }
      footer={<Button variant="ghost" onClick={onClose}>{t("close", "stores")}</Button>}
    >
      {store.logo && (
        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12, paddingBottom: 4 }}>
          <img src={`${SERVER_URL}${store.logo}`} alt={`${store.name} logo`}
            style={{ width: 64, height: 64, borderRadius: "var(--r2)", objectFit: "cover", border: "1px solid var(--bd)", background: "var(--bg3)" }} />
          <div>
            <p style={{ fontSize: 10.5, color: "var(--tx3)", marginBottom: 2 }}>{t("store_logo_label", "stores")}</p>
          </div>
        </div>
      )}
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p style={{ fontSize: 10.5, color: "var(--tx3)", marginBottom: 2 }}>{label}</p>
          <p style={{ fontSize: 12.5, color: "var(--tx)", fontWeight: 500 }}>{value || "-"}</p>
        </div>
      ))}
    </Modal>
  );
}

export default function Stores() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedStores, setSelectedStores] = useState([]);
  const [stores, setStores] = useState([]);
  const [maxStores, setMaxStores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailStore, setDetailStore] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: "" });
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await getStores();
      setStores(Array.isArray(data) ? data : data?.stores || []);
      if (data?.maxStores != null) setMaxStores(data.maxStores);
    } catch (err) {
      console.log(err);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const filteredStores = useMemo(() => {
    if (!search.trim()) return stores;
    const terms = search.toLowerCase().split(" ").filter(Boolean);
    return stores.filter((store) => {
      const haystack = [store.name, store.code, store.storeType, store.phone, store.email, store.currency, store.address, store.city, store.state, store.country, store.isActive ? "active" : "inactive"]
        .filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [stores, search]);

  const totalPages = Math.ceil(filteredStores.length / pageSize);

  const paginatedStores = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStores.slice(start, start + pageSize);
  }, [filteredStores, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, pageSize]);

  const handleDelete = async () => {
    try {
      const ids = Array.isArray(deleteDialog.id) ? deleteDialog.id : [deleteDialog.id];
      await Promise.all(ids.map((id) => deleteStore(id)));
      toast.success(t("updated_successfully", "stores"));
      fetchStores();
      setSelectedStores([]);
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || t("something_went_wrong_delete", "stores"));
    } finally {
      setDeleteDialog({ open: false, id: null, label: "" });
    }
  };

  const toggleSelect = (id) =>
    setSelectedStores((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedStores(selectedStores.length === paginatedStores.length ? [] : paginatedStores.map((s) => s.id));

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
      <StoreDetailModal store={detailStore} onClose={() => setDetailStore(null)} />

      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <strong className="ct" style={{ fontSize: 15 }}>{t("title", "stores")}</strong>
            {maxStores != null && (
              <span
                style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                  background: stores.length >= maxStores ? "var(--rbg)" : stores.length >= maxStores * 0.8 ? "var(--ambg)" : "var(--gbg)",
                  color: stores.length >= maxStores ? "var(--red)" : stores.length >= maxStores * 0.8 ? "var(--amber)" : "var(--green)",
                }}
              >
                {stores.length} / {maxStores} stores
              </span>
            )}
          </div>

          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder={t("search_placeholder", "stores")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>{t("show", "stores")}</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={pageSizeStyle}>
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {selectedStores.length > 0 && (
              <Button variant="danger" size="sm" onClick={() => setDeleteDialog({ open: true, id: selectedStores, label: `${selectedStores.length} stores` })}>
                {t("delete", "common")} ({selectedStores.length})
              </Button>
            )}

            {maxStores != null && stores.length >= maxStores ? (
              <Link to="/billing" className="btn btn-g" style={{ fontSize: 12 }}>
                <CreditCard size={13} strokeWidth={2.5} />
                <span>Upgrade Plan</span>
              </Link>
            ) : (
              <Link to="/stores/create" className="btn btn-p" style={{ fontSize: 12 }}>
                <Plus size={13} strokeWidth={2.5} />
                <span>{t("add", "common")}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Upgrade banner when at limit */}
        {maxStores != null && stores.length >= maxStores && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: "var(--rbg)", borderRadius: "var(--r)", marginBottom: 12, fontSize: 12,
            }}
          >
            <AlertTriangle size={14} style={{ color: "var(--red)", flexShrink: 0 }} />
            <span style={{ color: "var(--red)", fontWeight: 500 }}>
              You have reached your plan limit of {maxStores} store{maxStores !== 1 ? "s" : ""}.
            </span>
            <Link to="/billing" style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent)", fontWeight: 600, whiteSpace: "nowrap" }}>
              Upgrade subscription →
            </Link>
          </div>
        )}

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" checked={paginatedStores.length > 0 && selectedStores.length === paginatedStores.length}
                    onChange={toggleSelectAll} style={{ width: 12, height: 12, accentColor: "var(--accent)", cursor: "pointer" }} />
                </th>
                <th>{t("col_name", "stores")}</th>
                <th className="hidden sm:table-cell">{t("col_code", "stores")}</th>
                <th className="hidden md:table-cell">{t("col_type", "stores")}</th>
                <th className="hidden md:table-cell">{t("col_phone", "stores")}</th>
                <th className="hidden lg:table-cell">{t("col_currency", "stores")}</th>
                <th>{t("col_status", "stores")}</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: "center", color: "var(--tx3)" }}>{t("loading", "stores")}</td></tr>
              ) : paginatedStores.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: "center", color: "var(--tx3)" }}>{t("no_stores_found", "stores")}</td></tr>
              ) : (
                paginatedStores.map((store) => (
                  <tr key={store.id} onClick={() => navigate(`/stores/edit/${store.id}`)} style={{ cursor: "pointer" }}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedStores.includes(store.id)} onChange={() => toggleSelect(store.id)}
                        style={{ width: 12, height: 12, accentColor: "var(--accent)", cursor: "pointer" }} />
                    </td>
                    <td>{store.name}</td>
                    <td className="hidden sm:table-cell">{store.code || "-"}</td>
                    <td className="hidden md:table-cell">{store.storeType}</td>
                    <td className="hidden md:table-cell">{store.phone || "-"}</td>
                    <td className="hidden lg:table-cell">{store.currency}</td>
                    <td>
                      <span className={`sta ${store.isActive ? "ok" : "er"}`}>
                        {store.isActive ? t("active", "stores") : t("inactive", "stores")}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setDetailStore(store)} className="hbtn" title="View details"><Eye size={13} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredStores.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>
              {t("showing", "common")}{" "}
              <strong style={{ color: "var(--tx)" }}>
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredStores.length)}
              </strong>{" "}
              {t("of", "common")} <strong style={{ color: "var(--tx)" }}>{filteredStores.length}</strong> {t("stores_label", "stores")}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="hbtn" style={{ opacity: currentPage === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={13} />
                </button>
                {getPageNumbers().map((page, i) =>
                  page === "..." ? (
                    <span key={`dots-${i}`} style={{ padding: "0 4px", color: "var(--tx3)" }}>…</span>
                  ) : (
                    <button key={page} onClick={() => setCurrentPage(page)} className="hbtn"
                      style={currentPage === page
                        ? { background: "var(--abg)", borderColor: "var(--accent)", color: "var(--accent)", width: 28, height: 28, fontSize: 12 }
                        : { width: 28, height: 28, fontSize: 12, color: "var(--tx2)" }}>
                      {page}
                    </button>
                  )
                )}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="hbtn" style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}>
                  <ChevronRight size={13} />
                </button>
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
