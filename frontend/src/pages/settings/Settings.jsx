import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Button from "../component/Button";
import toast from "react-hot-toast";
import { getSettings, saveSetting } from "../../services/settingsService";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const CURRENCY_SYMBOL_MAP = {
  PKR: "₨", USD: "$", EUR: "€", GBP: "£", SAR: "﷼",
  AED: "د.إ", INR: "₹", CAD: "CA$", AUD: "A$", JPY: "¥",
  CNY: "¥", MYR: "RM", SGD: "S$", TRY: "₺", BRL: "R$",
  KWD: "KD", QAR: "﷼", OMR: "﷼", BHD: "BD",
};

function buildSettingGroups(t) {
  return [
    {
      key: "currency_tax",
      label: t("currency_tax", "settings"),
      keys: [
        {
          key: "currency",
          label: t("currency", "settings"),
          type: "select",
          options: [
            { value: "PKR", label: "PKR — Pakistani Rupee" },
            { value: "USD", label: "USD — US Dollar" },
            { value: "EUR", label: "EUR — Euro" },
            { value: "GBP", label: "GBP — British Pound" },
            { value: "SAR", label: "SAR — Saudi Riyal" },
            { value: "AED", label: "AED — UAE Dirham" },
            { value: "KWD", label: "KWD — Kuwaiti Dinar" },
            { value: "QAR", label: "QAR — Qatari Riyal" },
            { value: "OMR", label: "OMR — Omani Rial" },
            { value: "BHD", label: "BHD — Bahraini Dinar" },
            { value: "INR", label: "INR — Indian Rupee" },
            { value: "CAD", label: "CAD — Canadian Dollar" },
            { value: "AUD", label: "AUD — Australian Dollar" },
            { value: "JPY", label: "JPY — Japanese Yen" },
            { value: "CNY", label: "CNY — Chinese Yuan" },
            { value: "MYR", label: "MYR — Malaysian Ringgit" },
            { value: "SGD", label: "SGD — Singapore Dollar" },
            { value: "TRY", label: "TRY — Turkish Lira" },
            { value: "BRL", label: "BRL — Brazilian Real" },
          ],
        },
        {
          key: "currency_symbol",
          label: t("currency_symbol", "settings"),
          type: "text",
          placeholder: "$",
          hint: t("auto_filled", "settings"),
        },
        { key: "tax_rate", label: t("tax_rate", "settings"), type: "number", placeholder: "0" },
      ],
    },
    {
      key: "invoice",
      label: t("invoice_group", "settings"),
      keys: [
        { key: "invoice_prefix", label: t("invoice_prefix", "settings"), type: "text", placeholder: "INV-" },
        { key: "invoice_footer", label: t("invoice_footer", "settings"), type: "textarea", placeholder: "Thank you for your business!" },
      ],
    },
    {
      key: "system",
      label: t("system", "settings"),
      keys: [
        {
          key: "date_format",
          label: t("date_format", "settings"),
          type: "select",
          options: [
            { value: "d-m-Y", label: "DD-MM-YYYY (e.g. 08-06-2025)" },
            { value: "m-d-Y", label: "MM-DD-YYYY (e.g. 06-08-2025)" },
            { value: "Y-m-d", label: "YYYY-MM-DD (e.g. 2025-06-08)" },
            { value: "d/m/Y", label: "DD/MM/YYYY (e.g. 08/06/2025)" },
            { value: "m/d/Y", label: "MM/DD/YYYY (e.g. 06/08/2025)" },
            { value: "Y/m/d", label: "YYYY/MM/DD (e.g. 2025/06/08)" },
            { value: "d.m.Y", label: "DD.MM.YYYY (e.g. 08.06.2025)" },
          ],
        },
        {
          key: "timezone",
          label: t("timezone", "settings"),
          type: "select",
          options: [
            { value: "UTC", label: "UTC — Coordinated Universal Time" },
            { value: "Asia/Karachi", label: "Asia/Karachi — PKT (UTC+5)" },
            { value: "Asia/Dubai", label: "Asia/Dubai — GST (UTC+4)" },
            { value: "Asia/Riyadh", label: "Asia/Riyadh — AST (UTC+3)" },
            { value: "Asia/Kuwait", label: "Asia/Kuwait — AST (UTC+3)" },
            { value: "Asia/Qatar", label: "Asia/Qatar — AST (UTC+3)" },
            { value: "Asia/Muscat", label: "Asia/Muscat — GST (UTC+4)" },
            { value: "Asia/Bahrain", label: "Asia/Bahrain — AST (UTC+3)" },
            { value: "Asia/Kolkata", label: "Asia/Kolkata — IST (UTC+5:30)" },
            { value: "Asia/Dhaka", label: "Asia/Dhaka — BST (UTC+6)" },
            { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur — MYT (UTC+8)" },
            { value: "Asia/Singapore", label: "Asia/Singapore — SGT (UTC+8)" },
            { value: "Asia/Tokyo", label: "Asia/Tokyo — JST (UTC+9)" },
            { value: "Asia/Shanghai", label: "Asia/Shanghai — CST (UTC+8)" },
            { value: "Asia/Istanbul", label: "Asia/Istanbul — TRT (UTC+3)" },
            { value: "America/New_York", label: "America/New_York — EST (UTC-5)" },
            { value: "America/Chicago", label: "America/Chicago — CST (UTC-6)" },
            { value: "America/Denver", label: "America/Denver — MST (UTC-7)" },
            { value: "America/Los_Angeles", label: "America/Los_Angeles — PST (UTC-8)" },
            { value: "Europe/London", label: "Europe/London — GMT (UTC+0)" },
            { value: "Europe/Paris", label: "Europe/Paris — CET (UTC+1)" },
            { value: "Europe/Berlin", label: "Europe/Berlin — CET (UTC+1)" },
            { value: "Australia/Sydney", label: "Australia/Sydney — AEDT (UTC+11)" },
          ],
        },
        {
          key: "language",
          label: t("language", "settings"),
          type: "select",
          options: [
            { value: "en", label: "English" },
            { value: "ar", label: "Arabic — عربي" },
            { value: "ur", label: "Urdu — اردو" },
            { value: "fr", label: "French — Français" },
            { value: "de", label: "German — Deutsch" },
            { value: "es", label: "Spanish — Español" },
            { value: "zh", label: "Chinese — 中文" },
            { value: "ja", label: "Japanese — 日本語" },
            { value: "tr", label: "Turkish — Türkçe" },
            { value: "ms", label: "Malay — Bahasa Melayu" },
            { value: "id", label: "Indonesian — Bahasa Indonesia" },
            { value: "pt", label: "Portuguese — Português" },
            { value: "ru", label: "Russian — Русский" },
          ],
        },
      ],
    },
  ];
}

function SettingField({ fieldDef, value, onChange }) {
  const { key, label, type, placeholder, hint, options } = fieldDef;

  const input =
    type === "select" ? (
      <select value={value ?? ""} onChange={(e) => onChange(key, e.target.value)}>
        <option value="">— Select —</option>
        {options.map(({ value: v, label: l }) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    ) : type === "textarea" ? (
      <textarea value={value ?? ""} onChange={(e) => onChange(key, e.target.value)} rows={2} placeholder={placeholder} />
    ) : (
      <input type={type} value={value ?? ""} onChange={(e) => onChange(key, e.target.value)} placeholder={placeholder} />
    );

  return (
    <div className="fg">
      <label>{label}</label>
      {input}
      {hint && <span style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 2 }}>{hint}</span>}
    </div>
  );
}

export default function Settings() {
  const { user, currentStore } = useAuth();
  const { t, setLanguage } = useLanguage();
  const stores = user?.stores || [];
  const isSpecificStore = currentStore?.id != null;

  const [selectedStoreId, setSelectedStoreId] = useState(
    isSpecificStore ? currentStore.id : (stores[0]?.id || null)
  );
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (isSpecificStore && currentStore.id !== selectedStoreId) {
      setValues({});
      setSelectedStoreId(currentStore.id);
    }
  }, [currentStore?.id]);

  useEffect(() => {
    if (!selectedStoreId) return;
    setLoading(true);
    getSettings(selectedStoreId)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        const map = {};
        list.forEach((s) => { map[s.key] = s.value; });
        setValues(map);
      })
      .catch(() => { toast.error(t("failed_to_save", "settings")); })
      .finally(() => setLoading(false));
  }, [selectedStoreId]);

  const handleStoreChange = (e) => { setValues({}); setSelectedStoreId(e.target.value || null); };

  const handleChange = (key, val) => {
    if (key === "currency") {
      setValues((prev) => ({
        ...prev,
        currency: val,
        currency_symbol: CURRENCY_SYMBOL_MAP[val] ?? prev.currency_symbol ?? "",
      }));
    } else {
      setValues((prev) => ({ ...prev, [key]: val }));
    }
  };

  const handleSaveGroup = async (groupKey, groupLabel, keys) => {
    if (!selectedStoreId) {
      toast.error(t("select_store_first", "settings"));
      return;
    }
    setSaving(groupKey);
    try {
      await Promise.all(keys.map(({ key }) => saveSetting({ key, value: values[key] ?? "" }, selectedStoreId)));
      // Apply language immediately if the system group was saved
      if (groupKey === "system" && values.language) {
        setLanguage(values.language);
      }
      toast.success(`${groupLabel} ${t("settings_saved", "settings")}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("failed_to_save", "settings"));
    } finally {
      setSaving(null);
    }
  };

  const activeStore = stores.find((s) => s.id === selectedStoreId);
  const SETTING_GROUPS = buildSettingGroups(t);

  return (
    <MainLayout>
      <div style={{ marginBottom: 20 }}>
        <strong style={{ fontSize: 15, color: "var(--tx)" }}>{t("title", "settings")}</strong>
        <p style={{ fontSize: 12, color: "var(--tx3)", marginTop: 4 }}>
          {t("subtitle", "settings")}
        </p>
      </div>

      {/* ── STORE CONTEXT ── */}
      {isSpecificStore ? (
        <div className="fcard" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: "#fff", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>{activeStore?.name || currentStore?.name}</div>
              <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 1 }}>{t("switch_from_header", "settings")}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="fcard" style={{ marginBottom: 16 }}>
          <div className="fg">
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: "var(--accent)", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              {t("select_store_label", "settings")}
            </label>
            {stores.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--tx3)" }}>{t("no_stores", "settings")}</p>
            ) : (
              <select value={selectedStoreId || ""} onChange={handleStoreChange}>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            {activeStore && (
              <span style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 2, display: "block" }}>
                {t("settings_apply_to", "settings")}{" "}
                <strong style={{ color: "var(--tx2)" }}>{activeStore.name}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {!selectedStoreId ? (
        <div style={{ textAlign: "center", color: "var(--tx3)", padding: "40px 0" }}>{t("select_store_configure", "settings")}</div>
      ) : loading ? (
        <div style={{ textAlign: "center", color: "var(--tx3)", padding: "40px 0" }}>{t("loading_settings", "settings")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {SETTING_GROUPS.map((group) => (
            <div key={group.key} className="fcard">
              <div className="ch" style={{ marginBottom: 16 }}>
                <strong className="ct" style={{ fontSize: 13 }}>{group.label}</strong>
              </div>
              <div style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", display: "grid", gap: 16, marginBottom: 16 }}>
                {group.keys.map((fieldDef) => (
                  <div key={fieldDef.key} style={fieldDef.type === "textarea" ? { gridColumn: "1 / -1" } : {}}>
                    <SettingField fieldDef={fieldDef} value={values[fieldDef.key]} onChange={handleChange} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={saving === group.key}
                  onClick={() => handleSaveGroup(group.key, group.label, group.keys)}
                >
                  <Save size={13} />
                  <span>{saving === group.key ? t("saving_group", "settings") : `${t("save_group", "settings")} ${group.label}`}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
