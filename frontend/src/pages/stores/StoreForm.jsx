import MainLayout from "../../layout/MainLayout";
import { ArrowLeft, Upload, X, AlertTriangle, CreditCard } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Button from "../component/Button";
import { useEffect, useState, useRef } from "react";
import {
  createStore,
  updateStore,
  getStore,
} from "../../services/storeService";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const SERVER_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const generateStoreCode = (name) =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12);

const Field = ({ label, name, required, errors, children }) => (
  <div className="fg">
    <label>
      {label}
      {required && (
        <span style={{ color: "var(--red)", marginLeft: 2 }}>*</span>
      )}
    </label>
    {children}
    {errors[name] && (
      <span style={{ fontSize: 10.5, color: "var(--red)", marginTop: 2 }}>
        {errors[name]}
      </span>
    )}
  </div>
);

export default function StoreForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState(null);
  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [existingLogo, setExistingLogo] = useState(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: "",
    code: "",
    storeType: "retail",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    phone: "",
    email: "",
    currency: "PKR",
    timezone: "Asia/Karachi",
    dateFormat: "d-m-Y",
    taxNumber: "",
    isActive: true,
  });

  useEffect(() => {
    if (!isEdit) return;
    const fetchStore = async () => {
      try {
        setLoading(true);
        const data = await getStore(id);
        setForm({
          name: data.name || "",
          code: data.code || "",
          storeType: data.storeType || "retail",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          zipCode: data.zipCode || "",
          phone: data.phone || "",
          email: data.email || "",
          currency: data.currency || "PKR",
          timezone: data.timezone || "Asia/Karachi",
          dateFormat: data.dateFormat || "d-m-Y",
          taxNumber: data.taxNumber || "",
          isActive: data.isActive ?? true,
        });
        if (data.logo) {
          setLogoPreview(`${SERVER_URL}${data.logo}`);
          setExistingLogo(data.logo);
        }
        if (data.code) setCodeManuallyEdited(true);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "code") setCodeManuallyEdited(true);
    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: name === "isActive" ? value === "true" : value,
      };
      if (name === "name" && !isEdit && !codeManuallyEdited) {
        updated.code = generateStoreCode(value);
      }
      return updated;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, logo: t("logo_error_type", "stores") }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: t("logo_error_size", "stores") }));
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoRemoved(false);
    setErrors((prev) => ({ ...prev, logo: "" }));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    if (isEdit && existingLogo) setLogoRemoved(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t("store_name_required", "stores");
    else if (form.name.trim().length < 2)
      e.name = t("store_name_min", "stores");
    if (!form.storeType) e.storeType = t("store_type_required", "stores");
    if (form.code && !/^[A-Za-z0-9_-]+$/.test(form.code))
      e.code = t("code_invalid", "stores");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = t("email_invalid", "stores");
    if (form.phone && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone))
      e.phone = t("phone_invalid", "stores");
    if (form.zipCode && !/^[A-Za-z0-9\s-]{3,10}$/.test(form.zipCode))
      e.zipCode = t("zip_invalid", "stores");
    if (!form.currency) e.currency = t("currency_required", "stores");
    if (!form.timezone) e.timezone = t("timezone_required", "stores");
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      document
        .querySelector(`[name="${Object.keys(validationErrors)[0]}"]`)
        ?.focus();
      return;
    }
    try {
      setLoading(true);
      const payload = new FormData();
      const finalCode =
        form.code.trim() ||
        generateStoreCode(form.name) ||
        `STR-${Date.now().toString().slice(-6)}`;
      Object.entries({ ...form, code: finalCode }).forEach(([key, val]) =>
        payload.append(key, val),
      );
      if (logoFile) {
        payload.append("logo", logoFile);
      } else if (isEdit && logoRemoved) {
        payload.append("removeLogo", "true");
      }

      if (isEdit) {
        await updateStore(id, payload);
        toast.success(t("updated_successfully", "stores"));
      } else {
        await createStore(payload);
        toast.success(t("created_successfully", "stores"));
      }
      navigate("/stores");
    } catch (err) {
      console.log(err);
      if (err?.response?.status === 403 && err?.response?.data?.code === "STORE_LIMIT_REACHED") {
        setLimitError(err.response.data);
      } else {
        toast.error(err?.response?.data?.message || t("something_went_wrong", "stores"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="fcard">
        <div className="ch">
          <div className="ct relative flex items-center justify-center w-full">
            <div className="absolute left-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/stores")}
              >
                <ArrowLeft size={14} />
                <span>{t("back", "stores")}</span>
              </Button>
            </div>
            <strong className="text-base sm:text-xl font-semibold">
              {isEdit ? t("edit_store", "stores") : t("create_store", "stores")}
            </strong>
          </div>
        </div>

        <hr className="mb-4" style={{ borderColor: "var(--bd)" }} />

        {limitError && (
          <div
            style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
              background: "var(--rbg)", border: "1px solid var(--red)", borderRadius: "var(--r)", marginBottom: 20,
            }}
          >
            <AlertTriangle size={16} style={{ color: "var(--red)", flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--red)", marginBottom: 4 }}>
                Store Limit Reached
              </p>
              <p style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 10 }}>
                {limitError.message}
              </p>
              <Link to="/billing" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
                <CreditCard size={12} />
                View Subscription Plans
              </Link>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* LOGO */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <label
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--tx2)",
                display: "block",
                marginBottom: 6,
              }}
            >
              {t("store_logo", "stores")}
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "var(--r2)",
                  border: `1px dashed ${errors.logo ? "var(--red)" : "var(--bd2)"}`,
                  background: "var(--bg3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Logo"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "var(--red)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <X size={9} color="white" />
                    </button>
                  </>
                ) : (
                  <Upload size={20} style={{ color: "var(--tx3)" }} />
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn btn-g"
                  style={{ fontSize: 12, marginBottom: 4 }}
                >
                  <Upload size={12} />
                  {logoPreview
                    ? t("change_logo", "stores")
                    : t("upload_logo", "stores")}
                </button>
                <p style={{ fontSize: 10.5, color: "var(--tx3)" }}>
                  {t("logo_hint", "stores")}
                </p>
                {errors.logo && (
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "var(--red)",
                      marginTop: 2,
                    }}
                  >
                    {errors.logo}
                  </p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <Field
            label={t("store_name", "stores")}
            name="name"
            required
            errors={errors}
          >
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              autoFocus
              style={errors.name ? { borderColor: "var(--red)" } : {}}
            />
          </Field>

          <Field label={t("store_code", "stores")} name="code" errors={errors}>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder={t("store_code_placeholder", "stores")}
              style={errors.code ? { borderColor: "var(--red)" } : {}}
            />
            {!codeManuallyEdited && !isEdit && (
              <span style={{ fontSize: 10, color: "var(--tx3)", marginTop: 2 }}>
                {t("store_code_hint", "stores")}
              </span>
            )}
          </Field>

          <Field
            label={t("store_type", "stores")}
            name="storeType"
            required
            errors={errors}
          >
            <select
              name="storeType"
              value={form.storeType}
              onChange={handleChange}
              style={errors.storeType ? { borderColor: "var(--red)" } : {}}
            >
              <option value="retail">{t("retail", "stores")}</option>
              <option value="restaurant">{t("restaurant", "stores")}</option>
              <option value="pharmacy">{t("pharmacy", "stores")}</option>
            </select>
          </Field>

          <Field label={t("address", "stores")} name="address" errors={errors}>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </Field>

          <Field label={t("city", "stores")} name="city" errors={errors}>
            <input name="city" value={form.city} onChange={handleChange} />
          </Field>

          <Field label={t("state", "stores")} name="state" errors={errors}>
            <input name="state" value={form.state} onChange={handleChange} />
          </Field>

          <Field label={t("country", "stores")} name="country" errors={errors}>
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
            />
          </Field>

          <Field label={t("zip_code", "stores")} name="zipCode" errors={errors}>
            <input
              name="zipCode"
              value={form.zipCode}
              onChange={handleChange}
              style={errors.zipCode ? { borderColor: "var(--red)" } : {}}
            />
          </Field>

          <Field label={t("phone", "stores")} name="phone" errors={errors}>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              style={errors.phone ? { borderColor: "var(--red)" } : {}}
            />
          </Field>

          <Field label={t("email", "stores")} name="email" errors={errors}>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={errors.email ? { borderColor: "var(--red)" } : {}}
            />
          </Field>

          <Field
            label={t("tax_number", "stores")}
            name="taxNumber"
            errors={errors}
          >
            <input
              name="taxNumber"
              value={form.taxNumber}
              onChange={handleChange}
            />
          </Field>

          <Field
            label={t("currency", "stores")}
            name="currency"
            required
            errors={errors}
          >
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              style={errors.currency ? { borderColor: "var(--red)" } : {}}
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="SAR">SAR</option>
            </select>
          </Field>

          <Field
            label={t("timezone", "stores")}
            name="timezone"
            required
            errors={errors}
          >
            <select
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              style={errors.timezone ? { borderColor: "var(--red)" } : {}}
            >
              <option value="Asia/Karachi">Asia/Karachi</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
            </select>
          </Field>

          <Field
            label={t("date_format", "stores")}
            name="dateFormat"
            errors={errors}
          >
            <select
              name="dateFormat"
              value={form.dateFormat}
              onChange={handleChange}
              style={errors.dateFormat ? { borderColor: "var(--red)" } : {}}
            >
              <option value="d-m-Y">DD-MM-YYYY</option>
              <option value="m-d-Y">MM-DD-YYYY</option>
            </select>
          </Field>

          <Field label={t("status", "stores")} name="isActive" errors={errors}>
            <select
              name="isActive"
              value={form.isActive}
              onChange={handleChange}
              style={errors.isActive ? { borderColor: "var(--red)" } : {}}
            >
              <option value="true">{t("active", "stores")}</option>
              <option value="false">{t("inactive", "stores")}</option>
            </select>
          </Field>

          <div
            className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2"
            style={{ borderTop: "1px solid var(--bd)" }}
          >
            <Button type="submit" variant="primary" disabled={loading}>
              {loading
                ? t("saving", "stores")
                : isEdit
                  ? t("update_store", "stores")
                  : t("create_store", "stores")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/stores")}
            >
              <ArrowLeft size={14} />
              <span>{t("cancel", "stores")}</span>
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
