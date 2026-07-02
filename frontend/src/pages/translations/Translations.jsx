import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Modal from "../component/Modal";
import DeleteDialog from "../component/DeleteDialog";
import Button from "../component/Button";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";
import api from "../../services/api";

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

const inpStyle = {
  background: "var(--inp)",
  border: "1px solid var(--inpbd)",
  borderRadius: "var(--r)",
  padding: "4px 8px",
  fontSize: 12,
  color: "var(--tx)",
  width: "100%",
  fontFamily: "var(--font)",
  outline: "none",
};

const EMPTY_FORM = { group: "", key: "" };

export default function Translations() {
  const [data, setData] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [langValues, setLangValues] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    group: null,
    key: null,
    label: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getAll("translations");
      setData(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load translations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    masterService
      .getAll("languages")
      .then((r) => setLanguages(r.data?.data || r.data || []))
      .catch(() => {});
  }, [load]);

  const groups = useMemo(
    () => [...new Set(data.map((r) => r.group).filter(Boolean))].sort(),
    [data],
  );

  const keysForGroup = useMemo(() => {
    const src = form.group ? data.filter((r) => r.group === form.group) : data;
    return [...new Set(src.map((r) => r.key).filter(Boolean))].sort();
  }, [data, form.group]);

  const grouped = useMemo(() => {
    const map = {};
    data.forEach((r) => {
      const k = `${r.group}||${r.key}`;
      if (!map[k]) map[k] = { group: r.group, key: r.key, langs: [] };
      map[k].langs.push(r);
    });
    return Object.values(map).sort((a, b) =>
      a.group !== b.group
        ? (a.group || "").localeCompare(b.group || "")
        : (a.key || "").localeCompare(b.key || ""),
    );
  }, [data]);

  const filtered = useMemo(
    () =>
      grouped.filter((item) => {
        const matchLang =
          !filterLang || item.langs.some((l) => l.language_id === filterLang);
        const matchGroup = !filterGroup || item.group === filterGroup;
        const q = search.trim().toLowerCase();
        const matchSearch =
          !q ||
          (item.key || "").toLowerCase().includes(q) ||
          (item.group || "").toLowerCase().includes(q) ||
          item.langs.some((l) => (l.value || "").toLowerCase().includes(q));
        return matchLang && matchGroup && matchSearch;
      }),
    [grouped, search, filterLang, filterGroup],
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );
  useEffect(
    () => setCurrentPage(1),
    [search, filterLang, filterGroup, pageSize],
  );

  const buildLangValues = useCallback(
    (group, key, langs) => {
      return langs
        .map((l) => {
          const existing = data.find(
            (d) => d.group === group && d.key === key && d.language_id === l.id,
          );
          return existing
            ? {
                language_id: l.id,
                name: l.name,
                code: l.code,
                value: existing.value || "",
              }
            : null;
        })
        .filter(Boolean);
    },
    [data],
  );

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setLangValues([]);
    setErrors({});
    setModal(true);
  };

  const openEdit = (item) => {
    setForm({ group: item.group || "", key: item.key || "" });
    setLangValues(buildLangValues(item.group, item.key, languages));
    setErrors({});
    setModal(true);
  };

  const addLangRow = () => {
    setLangValues((prev) => [
      ...prev,
      { language_id: "", name: "", code: "", value: "" },
    ]);
  };

  const removeLangRow = (index) => {
    setLangValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLangSelect = (index, langId) => {
    const lang = languages.find((l) => l.id === langId);
    setLangValues((prev) =>
      prev.map((lv, i) =>
        i === index
          ? {
              ...lv,
              language_id: langId,
              name: lang?.name || "",
              code: lang?.code || "",
            }
          : lv,
      ),
    );
  };

  const closeModal = () => setModal(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleLangValueChange = (index, value) => {
    setLangValues((prev) =>
      prev.map((lv, i) => (i === index ? { ...lv, value } : lv)),
    );
    if (errors.langs) setErrors((p) => ({ ...p, langs: undefined }));
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.group?.trim()) errs.group = "Group is required";
    if (!form.key?.trim()) errs.key = "Key is required";
    const toSave = langValues.filter(
      (lv) => lv.language_id && lv.value.trim() !== "",
    );
    if (!toSave.length)
      errs.langs = "Add at least one language row with a value";
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      await masterService.create("translations/bulk", {
        group: form.group.trim(),
        key: form.key.trim(),
        values: toSave.map((lv) => ({
          language_id: lv.language_id,
          value: lv.value,
        })),
      });
      toast.success("Translations saved");
      closeModal();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { group, key } = deleteDialog;
      await api.delete("/translations/group", { params: { group, key } });
      toast.success("Translations deleted");
      load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteDialog({ open: false, group: null, key: null, label: "" });
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
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15, flexShrink: 0 }}>
            UI Translations
          </strong>
          <div className="srch w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <span className="srch-ic">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Search key or value..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <select
              className="w-full sm:w-auto"
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              style={psStyle}
            >
              <option value="">All Languages</option>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              className="w-full sm:w-auto"
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              style={psStyle}
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <div
              className="flex items-center gap-1.5 w-full sm:w-auto"
              style={{ fontSize: 12, color: "var(--tx3)" }}
            >
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={psStyle}
              >
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={openCreate}
              className="w-full sm:w-auto justify-center"
            >
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
                <th>Group . Key</th>
                <th>Languages</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      textAlign: "center",
                      color: "var(--tx3)",
                      padding: "24px 0",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      textAlign: "center",
                      color: "var(--tx3)",
                      padding: "24px 0",
                    }}
                  >
                    No translations found
                  </td>
                </tr>
              ) : (
                paged.map((item) => (
                  <tr
                    key={`${item.group}||${item.key}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => openEdit(item)}
                  >
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "var(--tx2)",
                        }}
                      >
                        <span style={{ color: "var(--tx3)" }}>{item.group}</span>
                        <span style={{ color: "var(--tx3)", margin: "0 1px" }}>.</span>
                        {item.key}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {item.langs.map((l) => (
                          <span
                            key={l.id}
                            style={{
                              background: "var(--bg3)",
                              borderRadius: "var(--r)",
                              padding: "2px 7px",
                              fontSize: 10,
                              fontFamily: "monospace",
                              fontWeight: 600,
                            }}
                          >
                            {l.language?.code?.toUpperCase() || "?"}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{ textAlign: "right" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 4,
                        }}
                      >
                        <button
                          className="hbtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(item);
                          }}
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="hbtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({
                              open: true,
                              group: item.group,
                              key: item.key,
                              label: `${item.group}.${item.key}`,
                            });
                          }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4"
            style={{ fontSize: 12, color: "var(--tx3)" }}
          >
            <span>
              Showing{" "}
              <strong style={{ color: "var(--tx)" }}>
                {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filtered.length)}
              </strong>{" "}
              of{" "}
              <strong style={{ color: "var(--tx)" }}>{filtered.length}</strong>
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="hbtn"
                  style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
                >
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
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="hbtn"
                  style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          isOpen
          onClose={closeModal}
          title="Translation"
          width={560}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          }
        >
          <div
            className="grid gap-2 grid-cols-1 sm:grid-cols-2"
            style={{ gap: 10, marginBottom: 12 }}
          >
            <div className="fg">
              <label>
                Group <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <input
                name="group"
                value={form.group}
                onChange={handleFormChange}
                placeholder="e.g. common, nav, errors"
                list="grp-list"
                style={errors.group ? { borderColor: "var(--red)" } : {}}
              />
              <datalist id="grp-list">
                {groups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
              {errors.group && (
                <span style={{ fontSize: 11, color: "var(--red)" }}>
                  {errors.group}
                </span>
              )}
            </div>
            <div className="fg">
              <label>
                Key <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <input
                name="key"
                value={form.key}
                onChange={handleFormChange}
                placeholder="e.g. save_button"
                list="key-list"
                style={errors.key ? { borderColor: "var(--red)" } : {}}
              />
              <datalist id="key-list">
                {keysForGroup.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
              {errors.key && (
                <span style={{ fontSize: 11, color: "var(--red)" }}>
                  {errors.key}
                </span>
              )}
            </div>
          </div>

          {errors.langs && (
            <div style={{ fontSize: 11, color: "var(--red)", marginBottom: 8 }}>
              {errors.langs}
            </div>
          )}

          <div
            style={{
              border: "1px solid var(--bd)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            {langValues.length === 0 && (
              <div
                style={{
                  padding: "14px 10px",
                  fontSize: 12,
                  color: "var(--tx3)",
                }}
              >
                No language rows yet — click <strong>+ Add Language</strong>{" "}
                below.
              </div>
            )}
            {langValues.map((lv, i) => {
              const takenIds = langValues
                .map((x, xi) => (xi !== i ? x.language_id : null))
                .filter(Boolean);
              const availLangs = languages.filter(
                (l) => !takenIds.includes(l.id),
              );
              return (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    borderTop: "1px solid var(--bd)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <select
                      value={lv.language_id}
                      onChange={(e) => handleLangSelect(i, e.target.value)}
                      style={{ ...psStyle, flex: 1, padding: "4px 6px" }}
                    >
                      <option value="">— pick language —</option>
                      {availLangs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.code?.toUpperCase()} — {l.name}
                        </option>
                      ))}
                      {lv.language_id &&
                        !availLangs.find((l) => l.id === lv.language_id) && (
                          <option value={lv.language_id}>
                            {lv.code?.toUpperCase()} — {lv.name}
                          </option>
                        )}
                    </select>
                    <button
                      onClick={() => removeLangRow(i)}
                      title="Remove"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        borderRadius: "var(--r)",
                        border: "1px solid var(--bd)",
                        background: "none",
                        cursor: "pointer",
                        color: "var(--tx3)",
                        fontSize: 14,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <input
                    value={lv.value}
                    onChange={(e) => handleLangValueChange(i, e.target.value)}
                    placeholder={
                      lv.name
                        ? `${lv.name} translation...`
                        : "Translation value..."
                    }
                    style={inpStyle}
                    disabled={!lv.language_id}
                  />
                </div>
              );
            })}
          </div>

          {languages.length >
            langValues.filter((lv) => lv.language_id).length && (
            <button
              onClick={addLangRow}
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              + Add Language
            </button>
          )}

          <p style={{ fontSize: 11, color: "var(--tx3)", marginTop: 6 }}>
            Add a row for each language you want to translate. Rows without a
            selected language are skipped.
          </p>
        </Modal>
      )}

      <DeleteDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, group: null, key: null, label: "" })}
        onConfirm={handleDelete}
        label={deleteDialog.label}
      />
    </MainLayout>
  );
}
