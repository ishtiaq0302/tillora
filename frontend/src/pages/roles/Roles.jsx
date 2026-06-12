import MainLayout from "../../layout/MainLayout";
import DeleteDialog from "../component/DeleteDialog";
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRoles, deleteRole } from "../../services/roleService";
import toast from "react-hot-toast";
import { Plus, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Modal from "../component/Modal";
import Button from "../component/Button";
import Badge from "../component/Badge";
import { useLanguage } from "../../context/LanguageContext";

const pageSizeStyle = {
  background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)",
  padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none",
};

function RoleDetailModal({ role, onClose }) {
  const { t } = useLanguage();
  if (!role) return null;

  const formatDate = (val) => {
    if (!val) return "-";
    return new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fields = [
    { label: t("role_name_label", "roles"), value: role.name },
    { label: t("description_label", "roles"), value: role.description },
    { label: t("created_at", "roles"), value: formatDate(role.createdAt) },
    { label: t("updated_at", "roles"), value: formatDate(role.updatedAt) },
  ];

  const groupedPermissions = (role.permissions || []).reduce((acc, p) => {
    const [module, action] = p.name.split(".");
    if (!acc[module]) acc[module] = [];
    acc[module].push(action);
    return acc;
  }, {});

  return (
    <Modal isOpen={!!role} onClose={onClose} width={700} columns={{ sm: 1, md: 2 }}
      title={
        <div className="flex items-center gap-2">
          <span>{role.name}</span>
          <Badge variant="success">{t("active", "roles")}</Badge>
        </div>
      }
      footer={<Button variant="ghost" onClick={onClose}>{t("close", "roles")}</Button>}
    >
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p style={{ fontSize: 10.5, color: "var(--tx3)", marginBottom: 4 }}>{label}</p>
          <p style={{ fontSize: 12.5, color: "var(--tx)", fontWeight: 500 }}>{value || "-"}</p>
        </div>
      ))}

      <div style={{ gridColumn: "1 / -1" }}>
        <p style={{ fontSize: 10.5, color: "var(--tx3)", marginBottom: 8 }}>{t("permissions_label", "roles")}</p>
        {Object.keys(groupedPermissions).length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--tx3)" }}>{t("no_permissions", "roles")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(groupedPermissions).map(([module, actions]) => (
              <div key={module} style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                <span className="capitalize" style={{ fontSize: 11, fontWeight: 600, color: "var(--tx2)", minWidth: 80, paddingTop: 3, flexShrink: 0 }}>{module}</span>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {actions.map((action) => {
                    const variantMap = {
                      view: { bg: "var(--abg)", color: "var(--accent)" },
                      create: { bg: "var(--gbg)", color: "var(--green)" },
                      edit: { bg: "var(--ambg)", color: "var(--amber)" },
                      delete: { bg: "var(--rbg)", color: "var(--red)" },
                    };
                    const style = variantMap[action] || { bg: "var(--bg3)", color: "var(--tx2)" };
                    return (
                      <span key={action} className="capitalize" style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: style.bg, color: style.color }}>
                        {action}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function Roles() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [detailRole, setDetailRole] = useState(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: "" });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(Array.isArray(data) ? data : data?.roles || []);
    } catch (err) {
      console.log(err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const terms = search.toLowerCase().split(" ").filter(Boolean);
    return roles.filter((role) => {
      const haystack = [role.name, role.description, role.permissions?.map((p) => p.name).join(" ")]
        .filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [roles, search]);

  const totalPages = Math.ceil(filteredRoles.length / pageSize);

  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, pageSize]);

  const handleDelete = async () => {
    try {
      const ids = Array.isArray(deleteDialog.id) ? deleteDialog.id : [deleteDialog.id];
      await Promise.all(ids.map((id) => deleteRole(id)));
      toast.success(t("updated_successfully", "roles"));
      fetchRoles();
      setSelectedRoles([]);
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || t("something_went_wrong_delete", "roles"));
    } finally {
      setDeleteDialog({ open: false, id: null, label: "" });
    }
  };

  const toggleSelect = (id) =>
    setSelectedRoles((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedRoles(selectedRoles.length === paginatedRoles.length ? [] : paginatedRoles.map((r) => r.id));

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
      <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />

      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>{t("title", "roles")}</strong>

          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder={t("search_placeholder", "roles")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>{t("show", "roles")}</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={pageSizeStyle}>
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {selectedRoles.length > 0 && (
              <Button variant="danger" size="sm" onClick={() => setDeleteDialog({ open: true, id: selectedRoles, label: `${selectedRoles.length} roles` })}>
                {t("delete", "common")} ({selectedRoles.length})
              </Button>
            )}

            <Link to="/roles/create" className="btn btn-p" style={{ fontSize: 12 }}>
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
                  <input type="checkbox" checked={paginatedRoles.length > 0 && selectedRoles.length === paginatedRoles.length}
                    onChange={toggleSelectAll} style={{ width: 12, height: 12, accentColor: "var(--accent)", cursor: "pointer" }} />
                </th>
                <th>{t("col_name", "roles")}</th>
                <th className="hidden md:table-cell">{t("col_description", "roles")}</th>
                <th className="hidden lg:table-cell">{t("col_permissions", "roles")}</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--tx3)" }}>{t("loading", "roles")}</td></tr>
              ) : paginatedRoles.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--tx3)" }}>{t("no_roles_found", "roles")}</td></tr>
              ) : (
                paginatedRoles.map((role) => (
                  <tr key={role.id} onClick={() => navigate(`/roles/edit/${role.id}`)} style={{ cursor: "pointer" }}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => toggleSelect(role.id)}
                        style={{ width: 12, height: 12, accentColor: "var(--accent)", cursor: "pointer" }} />
                    </td>
                    <td>{role.name}</td>
                    <td className="hidden md:table-cell">{role.description || "-"}</td>
                    <td className="hidden lg:table-cell">{role.permissions?.slice(0, 3).map((p) => p.name).join(", ") || "-"}</td>
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setDetailRole(role)} className="hbtn" title="View details"><Eye size={13} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredRoles.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>
              {t("showing", "common")}{" "}
              <strong style={{ color: "var(--tx)" }}>
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredRoles.length)}
              </strong>{" "}
              {t("of", "common")} <strong style={{ color: "var(--tx)" }}>{filteredRoles.length}</strong> {t("roles_label", "roles")}
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
