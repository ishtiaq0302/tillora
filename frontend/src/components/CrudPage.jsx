import { useState, useEffect, useCallback, useMemo } from "react";
import useStoreRefresh from "../hooks/useStoreRefresh";
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import MainLayout from "../layout/MainLayout";
import Modal from "../pages/component/Modal";
import DeleteDialog from "../pages/component/DeleteDialog";
import Button from "../pages/component/Button";
import toast from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

const pageSizeStyle = {
  background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)",
  padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none",
};

export default function CrudPage({
  title,
  singular,
  resource,
  service,
  searchFields = [],
  tableColumns = [],
  renderForm,
  emptyForm = {},
  toForm,
  toPayload,
  validate = () => ({}),
  booleanFields = [],
  modalColumns = { sm: 1 },
  modalWidth = 480,
  deleteLabel = (r) => r.name || "this record",
  canCreate = true,
  extraLoader,
  onReload,
  storeFilter = false,
}) {
  const { t } = useLanguage();
  const label = singular || (title.endsWith("ies") ? title.slice(0, -3) + "y" : title.endsWith("s") ? title.slice(0, -1) : title);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [stores, setStores] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [extras, setExtras] = useState({});

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.getAll(resource);
      setData(res.data?.data || res.data || []);
    } catch {
      toast.error(`${t("failed_to_load", "common")} ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [resource, service, title]);

  useEffect(() => {
    loadData();
    if (extraLoader) extraLoader().then(setExtras).catch(() => {});
    if (storeFilter) service.getAll("stores").then((r) => setStores(r.data?.data || r.data || [])).catch(() => {});
    if (onReload) onReload(loadData);
  }, [loadData]);

  useStoreRefresh(loadData);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const matchSearch = !search.trim() || !searchFields.length || (() => {
        const s = search.toLowerCase();
        return searchFields.some((f) => (row[f] ?? "").toString().toLowerCase().includes(s));
      })();
      const matchStore = !storeFilter || !filterStore || row.store_id === filterStore;
      return matchSearch && matchStore;
    });
  }, [data, search, searchFields, storeFilter, filterStore]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );
  useEffect(() => setCurrentPage(1), [search, filterStore, pageSize]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let v = type === "checkbox" ? checked : value;
    if (booleanFields.includes(name)) v = value === "true" || value === true;
    setForm((f) => ({ ...f, [name]: v }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const openCreate = () => { setForm({ ...emptyForm }); setErrors({}); setEditId(null); setModal("create"); };
  const openEdit = (row) => { setForm(toForm ? toForm(row) : { ...emptyForm, ...row }); setErrors({}); setEditId(row.id); setModal("edit"); };
  const closeModal = () => { setModal(null); setEditId(null); };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      const payload = toPayload ? toPayload(form) : form;
      if (modal === "edit") {
        await service.update(resource, editId, payload);
        toast.success(`${label} ${t("update", "common").toLowerCase()}d`);
      } else {
        await service.create(resource, payload);
        toast.success(`${label} ${t("create", "common").toLowerCase()}d`);
      }
      closeModal();
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || t("save_failed", "common"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await service.delete(resource, deleteDialog.id);
      toast.success(`${label} ${t("delete", "common").toLowerCase()}d`);
      loadData();
    } catch {
      toast.error(t("delete_failed", "common"));
    } finally {
      setDeleteDialog({ open: false, id: null, label: "" });
    }
  };

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

  const colCount = tableColumns.length + 1;

  return (
    <MainLayout>
      <div className="card">
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>{title}</strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input
              type="text"
              placeholder={`${t("search", "common")} ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {storeFilter && (
              <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} style={pageSizeStyle}>
                <option value="">{t("all_stores", "common")}</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>{t("show", "common")}</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={pageSizeStyle}>
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {canCreate && (
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus size={13} strokeWidth={2.5} /><span>{t("add", "common")}</span>
              </Button>
            )}
          </div>
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {tableColumns.map((col) => (
                  <th key={col.label} style={{ width: col.width }}>{col.label}</th>
                ))}
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colCount} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>{t("loading", "common")}</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={colCount} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>{t("no_data", "common")}</td></tr>
              ) : paged.map((row) => (
                <tr key={row.id} style={{ cursor: "pointer" }} onClick={() => openEdit(row)}>
                  {tableColumns.map((col) => (
                    <td key={col.label} style={col.tdStyle}>{col.render(row, extras, data)}</td>
                  ))}
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                      <button className="hbtn" onClick={(e) => { e.stopPropagation(); openEdit(row); }} title={t("edit", "common")}>
                        <Pencil size={12} />
                      </button>
                      <button
                        className="hbtn"
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: row.id, label: deleteLabel(row) }); }}
                        title={t("delete", "common")}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>
              {t("showing", "common")}{" "}
              <strong style={{ color: "var(--tx)" }}>
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}
              </strong>{" "}
              {t("of", "common")} <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong> {title.toLowerCase()}
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

      {/* CREATE / EDIT MODAL */}
      {modal && (
        <Modal
          isOpen
          onClose={closeModal}
          title={modal === "edit" ? `${t("edit", "common")} ${label}` : `${t("add", "common")} ${label}`}
          columns={modalColumns}
          width={modalWidth}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={closeModal}>{t("cancel", "common")}</Button>
              <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
                {saving ? t("saving", "common") : modal === "edit" ? t("update", "common") : t("create", "common")}
              </Button>
            </>
          }
        >
          {renderForm && renderForm({ form, onChange: handleChange, errors, data, extras })}
        </Modal>
      )}

      <DeleteDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, label: "" })}
        onConfirm={handleDelete}
        label={deleteDialog.label}
      />
    </MainLayout>
  );
}
