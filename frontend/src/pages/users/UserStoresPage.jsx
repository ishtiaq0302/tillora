import MainLayout from "../../layout/MainLayout";
import { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Store } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import toast from "react-hot-toast";
import Modal from "../component/Modal";
import Button from "../component/Button";
import Badge from "../component/Badge";

// =====================
// ASSIGN STORES MODAL
// =====================
function AssignStoresModal({ user, stores, onClose, onSave }) {
  const [selectedStores, setSelectedStores] = useState([]);
  const [saving, setSaving] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");

  useEffect(() => {
    if (user) {
      setSelectedStores(user.stores?.map((s) => s.id) || []);
      setStoreSearch("");
    }
  }, [user]);

  const filteredStores = useMemo(() => {
    if (!storeSearch.trim()) return stores;
    const q = storeSearch.toLowerCase();
    return stores.filter((s) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q));
  }, [stores, storeSearch]);

  const toggleStore = (id) => setSelectedStores((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const toggleAll = () => setSelectedStores(selectedStores.length === filteredStores.length ? [] : filteredStores.map((s) => s.id));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user.id, selectedStores);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      width={520}
      title={
        <div className="flex items-center gap-2">
          <Store size={14} />
          <span>Assign Stores</span>
          <Badge variant="default">
            {user.firstName} {user.lastName}
          </Badge>
        </div>
      }
      footer={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      {/* Store search inside modal */}
      <div
        style={{
          gridColumn: "1 / -1",
          marginBottom: 4,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Search */}
        <div className="srch" style={{ width: "100%" }}>
          <span className="srch-ic">
            <Search size={13} />
          </span>
          <input type="text" placeholder="Search stores…" value={storeSearch} onChange={(e) => setStoreSearch(e.target.value)} />
        </div>

        {/* Select all row */}
        <div className="flex items-center gap-2" style={{ fontSize: 12, color: "var(--tx3)" }}>
          <input
            type="checkbox"
            checked={filteredStores.length > 0 && filteredStores.every((s) => selectedStores.includes(s.id))}
            onChange={toggleAll}
            style={{
              width: 12,
              height: 12,
              accentColor: "var(--accent)",
              cursor: "pointer",
            }}
          />
          <span>Select all ({filteredStores.length})</span>
          {selectedStores.length > 0 && <span style={{ color: "var(--accent)", marginLeft: "auto" }}>{selectedStores.length} selected</span>}
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: 0 }} />

        {/* Store list */}
        <div
          style={{
            maxHeight: 280,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {filteredStores.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--tx3)", padding: "8px 0" }}>No stores found</p>
          ) : (
            filteredStores.map((store) => (
              <label
                key={store.id}
                className="flex items-center gap-2"
                style={{
                  fontSize: 12.5,
                  color: "var(--tx)",
                  padding: "6px 8px",
                  borderRadius: "var(--r)",
                  cursor: "pointer",
                  background: selectedStores.includes(store.id) ? "var(--abg)" : "transparent",
                  border: selectedStores.includes(store.id) ? "1px solid var(--accent)" : "1px solid transparent",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedStores.includes(store.id)}
                  onChange={() => toggleStore(store.id)}
                  style={{
                    width: 12,
                    height: 12,
                    accentColor: "var(--accent)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontWeight: 500 }}>{store.name}</span>
                {store.code && <span style={{ color: "var(--tx3)", fontSize: 11 }}>{store.code}</span>}
                {store.isActive !== undefined && (
                  <span className={`sta ${store.isActive ? "ok" : "er"}`} style={{ fontSize: 10 }}>
                    {store.isActive ? "Active" : "Inactive"}
                  </span>
                )}
              </label>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

// =====================
// MAIN COMPONENT
// =====================
export default function UserStoresPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [assignUser, setAssignUser] = useState(null);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // =====================
  // FETCH
  // =====================
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, storesRes] = await Promise.all([api.get("/users"), api.get("/stores")]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      setStores(Array.isArray(storesRes.data) ? storesRes.data : Array.isArray(storesRes.data?.stores) ? storesRes.data.stores : []);
    } catch (err) {
      console.log(err);
      setUsers([]);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================
  // SEARCH
  // =====================
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const terms = search.toLowerCase().split(" ").filter(Boolean);
    return users.filter((u) => {
      const haystack = [u.firstName, u.lastName, u.email, u.role, u.stores?.map((s) => s.name).join(" ")].filter(Boolean).join(" ").toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [users, search]);

  // =====================
  // PAGINATION
  // =====================
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  // =====================
  // ASSIGN SAVE
  // =====================
  const handleSave = async (userId, storeIds) => {
    try {
      await api.post("/store-users/assign", { userId, storeIds });
      toast.success("Stores assigned successfully");
      setAssignUser(null);
      await loadData();
    } catch (err) {
      console.log(err.response?.data || err);
      toast.error(err?.response?.data?.message || "Failed to assign stores");
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
      <AssignStoresModal user={assignUser} stores={stores} onClose={() => setAssignUser(null)} onSave={handleSave} />

      <div className="card">
        {/* ── HEADER ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          {/* Title */}
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>
            User Store Assignment
          </strong>

          {/* Search */}
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic">
              <Search size={13} />
            </span>
            <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {/* Page size */}
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  background: "var(--inp)",
                  border: "1px solid var(--inpbd)",
                  borderRadius: "var(--r)",
                  padding: "3px 22px 3px 7px",
                  fontSize: 12,
                  color: "var(--tx)",
                  fontFamily: "var(--font)",
                  outline: "none",
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />

        {/* ── TABLE ── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hidden sm:table-cell">Email</th>
                <th className="hidden md:table-cell">Role</th>
                <th>Stores</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "var(--tx3)" }}>
                    Loading...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "var(--tx3)" }}>
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="hidden sm:table-cell">{u.email || "-"}</td>
                    <td className="hidden md:table-cell">{u.role || "-"}</td>
                    <td>
                      {u.stores?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.stores.slice(0, 3).map((s) => (
                            <Badge key={s.id} variant="default">
                              {s.name}
                            </Badge>
                          ))}
                          {u.stores.length > 3 && <Badge variant="default">+{u.stores.length - 3} more</Badge>}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--tx3)" }}>None</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Button variant="ghost" size="sm" onClick={() => setAssignUser(u)}>
                        <Store size={12} />
                        <span>Assign</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── FOOTER ── */}
        {!loading && filteredUsers.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            {/* Record count */}
            <span>
              Showing{" "}
              <strong style={{ color: "var(--tx)" }}>
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredUsers.length)}
              </strong>{" "}
              of <strong style={{ color: "var(--tx)" }}>{filteredUsers.length}</strong> users
            </span>

            {/* Page buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="hbtn" style={{ opacity: currentPage === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={13} />
                </button>

                {getPageNumbers().map((page, i) =>
                  page === "..." ? (
                    <span key={`dots-${i}`} style={{ padding: "0 4px", color: "var(--tx3)" }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="hbtn"
                      style={
                        currentPage === page
                          ? {
                              background: "var(--abg)",
                              borderColor: "var(--accent)",
                              color: "var(--accent)",
                              width: 28,
                              height: 28,
                              fontSize: 12,
                            }
                          : {
                              width: 28,
                              height: 28,
                              fontSize: 12,
                              color: "var(--tx2)",
                            }
                      }
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
    </MainLayout>
  );
}
