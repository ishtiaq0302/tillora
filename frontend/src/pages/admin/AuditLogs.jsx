import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";

const psStyle = { background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)", padding: "3px 22px 3px 7px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none" };

const ACTION_COLORS = {
  create: { bg: "var(--gbg)", color: "var(--green)" },
  update: { bg: "var(--ambg)", color: "var(--amber)" },
  delete: { bg: "var(--rbg)", color: "var(--red)" },
};

export default function AuditLogs() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getAll("audit-logs", { limit: 200 });
      setData(res.data?.data || res.data || []);
    } catch { toast.error("Failed to load audit logs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const modules = useMemo(() => [...new Set(data.map((r) => r.module).filter(Boolean))].sort(), [data]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const matchSearch = !search.trim() || (r.module || "").toLowerCase().includes(search.toLowerCase()) || (r.action || "").toLowerCase().includes(search.toLowerCase());
      const matchMod = !filterModule || r.module === filterModule;
      return matchSearch && matchMod;
    });
  }, [data, search, filterModule]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  useEffect(() => setCurrentPage(1), [search, filterModule, pageSize]);

  const getPageNumbers = () => {
    const pages = []; const delta = 2;
    const left = Math.max(1, currentPage - delta); const right = Math.min(totalPages, currentPage + delta);
    if (left > 1) { pages.push(1); if (left > 2) pages.push("..."); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  return (
    <MainLayout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>Audit Logs</strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder="Search module or action..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} style={psStyle}>
              <option value="">All Modules</option>
              {modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--tx3)" }}>
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={psStyle}>
                {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>
        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th className="hidden sm:table-cell">Module</th>
                <th>Action</th>
                <th className="hidden md:table-cell">Record ID</th>
                <th className="hidden lg:table-cell">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>No audit logs found</td></tr>
              ) : paged.map((r) => {
                const ac = ACTION_COLORS[r.action] || { bg: "var(--bg3)", color: "var(--tx3)" };
                return (
                  <tr key={r.id}>
                    <td style={{ fontSize: 11, color: "var(--tx3)" }}>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                    <td style={{ color: "var(--tx2)", fontSize: 12 }}>{r.user?.name || "System"}</td>
                    <td className="hidden sm:table-cell" style={{ color: "var(--tx2)", fontSize: 12 }}>{r.module || "—"}</td>
                    <td><span style={{ background: ac.bg, color: ac.color, borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{r.action || "—"}</span></td>
                    <td className="hidden md:table-cell" style={{ fontFamily: "monospace", fontSize: 11, color: "var(--tx3)" }}>{r.record_id ? r.record_id.slice(0, 8) + "…" : "—"}</td>
                    <td className="hidden lg:table-cell" style={{ fontSize: 11, color: "var(--tx3)" }}>{r.ip_address || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4" style={{ fontSize: 12, color: "var(--tx3)" }}>
            <span>Showing <strong style={{ color: "var(--tx)" }}>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong></span>
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
