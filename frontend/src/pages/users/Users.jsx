import MainLayout from "../../layout/MainLayout";
import DeleteDialog from "../component/DeleteDialog";
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUsers, deleteUser } from "../../services/userService";
import toast from "react-hot-toast";
import { Plus, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Modal from "../component/Modal";
import Button from "../component/Button";
import Badge from "../component/Badge";
import { useLanguage } from "../../context/LanguageContext";

function UserDetailModal({ user, onClose }) {
  const { t } = useLanguage();
  if (!user) return null;

  const formatDate = (val) => {
    if (!val) return "-";
    const date = new Date(val);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const Y = String(date.getFullYear());
    switch (user.dateFormat) {
      case "d-m-Y": return `${d}-${m}-${Y}`;
      case "m-d-Y": return `${m}-${d}-${Y}`;
      case "Y-m-d": return `${Y}-${m}-${d}`;
      case "d/m/Y": return `${d}/${m}/${Y}`;
      case "m/d/Y": return `${m}/${d}/${Y}`;
      default: return `${d}-${m}-${Y}`;
    }
  };

  const fields = [
    { label: t("first_name", "users"), value: user.firstName },
    { label: t("last_name", "users"), value: user.lastName },
    { label: t("email", "users"), value: user.email },
    { label: t("phone", "users"), value: user.phone },
    { label: t("created_at", "users"), value: formatDate(user.createdAt) },
    { label: t("updated_at", "users"), value: formatDate(user.updatedAt) },
  ];

  const avatarUrl = user.avatar
    ? `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "")}/${user.avatar}`
    : null;

  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      width={860}
      columns={{ sm: 1, md: 2, lg: 3 }}
      title={
        <div className="flex items-center gap-2">
          <span>{user.name}</span>
          <Badge variant={user.isActive ? "success" : "danger"}>
            {user.isActive ? t("active", "users") : t("inactive", "users")}
          </Badge>
        </div>
      }
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t("close", "users")}
        </Button>
      }
    >
      <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-3 mb-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover border" />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold border"
            style={{ background: "var(--abg)", color: "var(--accent)" }}
          >
            {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
          </div>
        )}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>{user.firstName} {user.lastName}</p>
          <p style={{ fontSize: 11.5, color: "var(--tx3)" }}>{user.email}</p>
        </div>
      </div>

      {fields.map(({ label, value }) => (
        <div key={label}>
          <p style={{ fontSize: 10.5, color: "var(--tx3)", marginBottom: 2 }}>{label}</p>
          <p style={{ fontSize: 12.5, color: "var(--tx)", fontWeight: 500 }}>{value || "-"}</p>
        </div>
      ))}
    </Modal>
  );
}

const pageSizeStyle = {
  background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)",
  padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none",
};

export default function Users() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailUser, setDetailUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: "" });
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (err) {
      console.log(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const terms = search.toLowerCase().split(" ").filter(Boolean);
    return users.filter((user) => {
      const haystack = [user.firstName, user.lastName, user.email, user.phone, user.avatar, user.isSuperAdmin, user.isActive ? "active" : "inactive"]
        .filter(Boolean).join(" ").toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [users, search]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, pageSize]);

  const handleDelete = async () => {
    try {
      const ids = Array.isArray(deleteDialog.id) ? deleteDialog.id : [deleteDialog.id];
      await Promise.all(ids.map((id) => deleteUser(id)));
      toast.success(t("updated_successfully", "users"));
      fetchUsers();
      setSelectedUsers([]);
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || t("something_went_wrong", "users"));
    } finally {
      setDeleteDialog({ open: false, id: null, label: "" });
    }
  };

  const toggleSelect = (id) =>
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedUsers(selectedUsers.length === paginatedUsers.length ? [] : paginatedUsers.map((u) => u.id));

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
      <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />

      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>{t("title", "users")}</strong>

          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder={t("search_placeholder", "users")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>{t("show", "users")}</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={pageSizeStyle}>
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {selectedUsers.length > 0 && (
              <Button variant="danger" size="sm" onClick={() => setDeleteDialog({ open: true, id: selectedUsers, label: `${selectedUsers.length} users` })}>
                {t("delete", "common")} ({selectedUsers.length})
              </Button>
            )}

            <Link to="/users/create" className="btn btn-p" style={{ fontSize: 12 }}>
              <Plus size={13} strokeWidth={2.5} />
              <span>{t("add", "common")}</span>
            </Link>
          </div>
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox"
                    checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                    onChange={toggleSelectAll}
                    style={{ width: 12, height: 12, accentColor: "var(--accent)", cursor: "pointer" }}
                  />
                </th>
                <th className="hidden sm:table-cell">{t("full_name", "users")}</th>
                <th className="hidden md:table-cell">{t("email", "users")}</th>
                <th className="hidden md:table-cell">{t("phone", "users")}</th>
                <th className="hidden lg:table-cell">{t("super_admin", "users")}</th>
                <th>{t("status", "users")}</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: "center", color: "var(--tx3)" }}>{t("loading", "users")}</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: "center", color: "var(--tx3)" }}>{t("no_users_found", "users")}</td></tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} onClick={() => navigate(`/users/edit/${user.id}`)} style={{ cursor: "pointer" }}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleSelect(user.id)}
                        style={{ width: 12, height: 12, accentColor: "var(--accent)", cursor: "pointer" }} />
                    </td>
                    <td className="hidden sm:table-cell">{user.firstName + " " + user.lastName || "-"}</td>
                    <td className="hidden md:table-cell">{user.email || "-"}</td>
                    <td className="hidden md:table-cell">{user.phone || "-"}</td>
                    <td className="hidden lg:table-cell">{user.isSuperAdmin ? t("yes", "users") : t("no", "users")}</td>
                    <td>
                      <span className={`sta ${user.isActive ? "ok" : "er"}`}>
                        {user.isActive ? t("active", "users") : t("inactive", "users")}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setDetailUser(user)} className="hbtn" title="View details">
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredUsers.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>
              {t("showing", "common")}{" "}
              <strong style={{ color: "var(--tx)" }}>
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredUsers.length)}
              </strong>{" "}
              {t("of", "common")} <strong style={{ color: "var(--tx)" }}>{filteredUsers.length}</strong> {t("users_label", "users")}
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
