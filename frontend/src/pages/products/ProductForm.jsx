import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Button from "../component/Button";
import toast from "react-hot-toast";
import productService from "../../services/productService";
import masterService from "../../services/masterService";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const SERVER_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const EMPTY = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  product_type: "simple",
  category_id: "",
  brand_id: "",
  unit_id: "",
  tax_id: "",
  cost_price: "",
  selling_price: "",
  stock_quantity: "",
  stock_alert_quantity: "",
  has_expiry: false,
  has_batch: false,
  is_active: true,
  is_global: true,
  store_id: "",
};

const EMPTY_VARIANT = {
  variant_name: "",
  sku: "",
  barcode: "",
  cost_price: "",
  selling_price: "",
  stock_quantity: "",
};

export default function ProductForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { user, currentStore } = useAuth();
  const stores = user?.stores || [];

  const [form, setForm] = useState({
    ...EMPTY,
    is_global: !currentStore?.id,
    store_id: currentStore?.id || "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [attributeValues, setAttributeValues] = useState([]);

  const [existingVariants, setExistingVariants] = useState([]);
  const [newVariants, setNewVariants] = useState([{ ...EMPTY_VARIANT }]);
  const [deletingVariantId, setDeletingVariantId] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([
      masterService.getAll("categories"),
      masterService.getAll("brands"),
      masterService.getAll("units"),
      masterService.getAll("taxes"),
      masterService.getAll("attribute-values"),
    ])
      .then(([cat, brd, unt, tax, atv]) => {
        setCategories(cat.data?.data || cat.data || []);
        setBrands(brd.data?.data || brd.data || []);
        setUnits(unt.data?.data || unt.data || []);
        setTaxes(tax.data?.data || tax.data || []);
        setAttributeValues(atv.data?.data || atv.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    productService
      .getById(id)
      .then((res) => {
        const p = res.data;
        setForm({
          name: p.name || "",
          sku: p.sku || "",
          barcode: p.barcode || "",
          description: p.description || "",
          product_type: p.product_type || "simple",
          category_id: p.category_id || "",
          brand_id: p.brand_id || "",
          unit_id: p.unit_id || "",
          tax_id: p.tax_id || "",
          cost_price: p.cost_price ?? "",
          selling_price: p.selling_price ?? "",
          stock_quantity: p.stock_quantity ?? "",
          stock_alert_quantity: p.stock_alert_quantity ?? "",
          has_expiry: p.has_expiry || false,
          has_batch: p.has_batch || false,
          is_active: p.is_active ?? true,
          is_global: p.is_global ?? true,
          store_id: p.store_id || "",
        });
        if (p.image) {
          setImagePreview(`${SERVER_URL}${p.image}`);
          setExistingImage(p.image);
        }
        if (p.product_type === "variant") {
          masterService
            .getAll("product-variants", { product_id: id })
            .then((r) => setExistingVariants(r.data?.data || r.data || []))
            .catch(() => {});
        }
      })
      .catch(() => toast.error(t("failed_to_load", "common")))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (form.product_type === "variant" && newVariants.length === 0) {
      setNewVariants([{ ...EMPTY_VARIANT }]);
    }
  }, [form.product_type]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let v = type === "checkbox" ? checked : value;
    if (name === "is_active") v = value === "true";
    setForm((f) => ({ ...f, [name]: v }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleVariantChange = (index, field, value) => {
    setNewVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const addVariantRow = () =>
    setNewVariants((prev) => [...prev, { ...EMPTY_VARIANT }]);

  const removeVariantRow = (index) => {
    if (newVariants.length === 1) setNewVariants([{ ...EMPTY_VARIANT }]);
    else setNewVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingVariant = async (variantId) => {
    setDeletingVariantId(variantId);
    try {
      await masterService.delete("product-variants", variantId);
      setExistingVariants((prev) => prev.filter((v) => v.id !== variantId));
      toast.success("Variant removed");
    } catch {
      toast.error("Failed to delete variant");
    } finally {
      setDeletingVariantId(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((p) => ({ ...p, image: "Only JPG, PNG or WEBP allowed" }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((p) => ({ ...p, image: "Image must be under 2MB" }));
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageRemoved(false);
    setErrors((p) => ({ ...p, image: undefined }));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    if (isEdit && existingImage) setImageRemoved(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t("product_name_required", "product_form");
    if (form.product_type !== "variant") {
      if (form.selling_price === "" || form.selling_price === null)
        e.selling_price = t("selling_price_required", "product_form");
      else if (
        isNaN(Number(form.selling_price)) ||
        Number(form.selling_price) < 0
      )
        e.selling_price = t("selling_price_invalid", "product_form");
    } else {
      const filledVariants = newVariants.filter((v) => v.variant_name.trim());
      if (filledVariants.length === 0 && existingVariants.length === 0) {
        e.variants = t("add_variant_required", "product_form");
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("sku", form.sku || "");
      fd.append("barcode", form.barcode || "");
      fd.append("description", form.description || "");
      fd.append("product_type", form.product_type);
      fd.append("category_id", form.category_id || "");
      fd.append("brand_id", form.brand_id || "");
      fd.append("unit_id", form.unit_id || "");
      fd.append("tax_id", form.tax_id || "");
      fd.append("cost_price", form.cost_price === "" ? 0 : Number(form.cost_price));
      fd.append("selling_price", Number(form.selling_price));
      fd.append("stock_quantity", form.stock_quantity === "" ? 0 : Number(form.stock_quantity));
      fd.append("stock_alert_quantity", form.stock_alert_quantity === "" ? 0 : Number(form.stock_alert_quantity));
      fd.append("has_expiry", form.has_expiry);
      fd.append("has_batch", form.has_batch);
      fd.append("is_active", form.is_active);
      fd.append("is_global", form.is_global);
      fd.append("store_id", form.is_global ? "" : form.store_id || "");
      if (imageFile) {
        fd.append("image", imageFile);
      } else if (isEdit && imageRemoved) {
        fd.append("removeImage", "true");
      }

      let productId = id;
      if (isEdit) {
        await productService.update(id, fd);
        toast.success("Product updated");
      } else {
        const res = await productService.create(fd);
        productId = res.data?.id;
        toast.success("Product created");
      }

      if (form.product_type === "variant" && productId) {
        const filledVariants = newVariants.filter((v) => v.variant_name.trim());
        if (filledVariants.length > 0) {
          await Promise.all(
            filledVariants.map((v) =>
              masterService.create("product-variants", {
                product_id: productId,
                variant_name: v.variant_name.trim(),
                sku: v.sku || null,
                barcode: v.barcode || null,
                cost_price: Number(v.cost_price || 0),
                selling_price: Number(v.selling_price || 0),
                stock_quantity: Number(v.stock_quantity || 0),
              }),
            ),
          );
          toast.success(`${filledVariants.length} variant(s) saved`);
        }
      }

      navigate("/products");
    } catch (err) {
      toast.error(err?.response?.data?.message || t("save_failed", "common"));
    } finally {
      setSaving(false);
    }
  };

  const err = (name) => (errors[name] ? { borderColor: "var(--red)" } : {});
  const errMsg = (name) =>
    errors[name] ? (
      <span style={{ fontSize: 11, color: "var(--red)" }}>{errors[name]}</span>
    ) : null;

  if (loading)
    return (
      <MainLayout>
        <div style={{ padding: 24, color: "var(--tx3)" }}>
          {t("loading", "product_form")}
        </div>
      </MainLayout>
    );

  const isVariant = form.product_type === "variant";

  return (
    <MainLayout>
      <div className="fcard">
        <div className="ch">
          <div className="ct relative flex items-center justify-center w-full">
            <div className="absolute left-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/products")}
              >
                <ArrowLeft size={14} />
                <span>{t("back", "products")}</span>
              </Button>
            </div>
            <strong className="text-base sm:text-xl font-semibold">
              {isEdit
                ? t("edit_product", "product_form")
                : t("create_product", "product_form")}
            </strong>
          </div>
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 16px" }} />

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* BASIC INFO */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--tx3)",
                marginBottom: 12,
                borderBottom: "1px solid var(--bd)",
                paddingBottom: 6,
              }}
            >
              {t("basic_info", "product_form")}
            </p>
          </div>

          {/* PRODUCT IMAGE */}
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
              Product Image
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "var(--r2)",
                  border: `1px dashed ${errors.image ? "var(--red)" : "var(--bd2)"}`,
                  background: "var(--bg3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Product"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
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
                  <Upload size={22} style={{ color: "var(--tx3)" }} />
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
                  {imagePreview ? "Change Image" : "Upload Image"}
                </button>
                <p style={{ fontSize: 10.5, color: "var(--tx3)" }}>
                  JPG, PNG or WEBP — max 2 MB
                </p>
                {errors.image && (
                  <p style={{ fontSize: 10.5, color: "var(--red)", marginTop: 2 }}>
                    {errors.image}
                  </p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <div className="fg col-span-1 sm:col-span-2">
            <label>
              {t("product_name", "product_form")}{" "}
              <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              autoFocus
              style={err("name")}
              placeholder="e.g. Pepsi 1L"
            />
            {errMsg("name")}
          </div>

          <div className="fg">
            <label>{t("product_type", "product_form")}</label>
            <select
              name="product_type"
              value={form.product_type}
              onChange={handleChange}
            >
              <option value="simple">{t("simple", "product_form")}</option>
              <option value="variant">
                {t("with_variants", "product_form")}
              </option>
              <option value="service">{t("service", "product_form")}</option>
            </select>
          </div>

          <div className="fg">
            <label>{t("sku", "product_form")}</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="PEP-001"
            />
          </div>

          <div className="fg">
            <label>{t("barcode", "product_form")}</label>
            <input
              name="barcode"
              value={form.barcode}
              onChange={handleChange}
              placeholder="123456789"
            />
          </div>

          {/* CLASSIFICATION */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--tx3)",
                marginBottom: 12,
                borderBottom: "1px solid var(--bd)",
                paddingBottom: 6,
                marginTop: 4,
              }}
            >
              {t("classification", "product_form")}
            </p>
          </div>

          <div className="fg">
            <label>{t("category", "product_form")}</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
            >
              <option value="">{t("select_category", "product_form")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fg">
            <label>{t("brand", "product_form")}</label>
            <select
              name="brand_id"
              value={form.brand_id}
              onChange={handleChange}
            >
              <option value="">{t("select_brand", "product_form")}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fg">
            <label>{t("unit", "product_form")}</label>
            <select name="unit_id" value={form.unit_id} onChange={handleChange}>
              <option value="">{t("select_unit", "product_form")}</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.short_name})
                </option>
              ))}
            </select>
          </div>

          <div className="fg">
            <label>{t("tax", "product_form")}</label>
            <select name="tax_id" value={form.tax_id} onChange={handleChange}>
              <option value="">{t("no_tax", "product_form")}</option>
              {taxes.map((tx) => (
                <option key={tx.id} value={tx.id}>
                  {tx.name} ({tx.rate}%)
                </option>
              ))}
            </select>
          </div>

          {currentStore?.id == null && stores.length > 0 && (
            <div className="fg">
              <label>{t("store_availability", "product_form")}</label>
              <select
                value={form.is_global ? "all" : form.store_id || "all"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "all")
                    setForm((f) => ({ ...f, is_global: true, store_id: "" }));
                  else
                    setForm((f) => ({ ...f, is_global: false, store_id: val }));
                }}
              >
                <option value="all">{t("all_stores", "product_form")}</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PRICING */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--tx3)",
                marginBottom: 12,
                borderBottom: "1px solid var(--bd)",
                paddingBottom: 6,
                marginTop: 4,
              }}
            >
              {isVariant
                ? t("base_pricing", "product_form")
                : t("pricing", "product_form")}
            </p>
          </div>

          <div className="fg">
            <label>{t("cost_price", "product_form")}</label>
            <input
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={form.cost_price}
              onChange={handleChange}
              style={err("cost_price")}
              placeholder="0.00"
            />
            {errMsg("cost_price")}
          </div>

          <div className="fg">
            <label>
              {t("selling_price", "product_form")}{" "}
              {!isVariant && <span style={{ color: "var(--red)" }}>*</span>}
            </label>
            <input
              name="selling_price"
              type="number"
              step="0.01"
              min="0"
              value={form.selling_price}
              onChange={handleChange}
              style={err("selling_price")}
              placeholder="0.00"
            />
            {errMsg("selling_price")}
          </div>

          {/* STOCK */}
          {!isVariant && (
            <>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <p
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--tx3)",
                    marginBottom: 12,
                    borderBottom: "1px solid var(--bd)",
                    paddingBottom: 6,
                    marginTop: 4,
                  }}
                >
                  {t("stock", "product_form")}
                </p>
              </div>
              <div className="fg">
                <label>{t("opening_stock", "product_form")}</label>
                <input
                  name="stock_quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.stock_quantity}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div className="fg">
                <label>{t("alert_when_stock", "product_form")}</label>
                <input
                  name="stock_alert_quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.stock_alert_quantity}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </>
          )}

          <div className="fg">
            <label>{t("status", "product_form")}</label>
            <select
              name="is_active"
              value={form.is_active.toString()}
              onChange={handleChange}
            >
              <option value="true">{t("active", "product_form")}</option>
              <option value="false">{t("inactive", "product_form")}</option>
            </select>
          </div>

          {!isVariant && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex gap-6 flex-wrap">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--tx2)",
                }}
              >
                <input
                  type="checkbox"
                  name="has_expiry"
                  checked={form.has_expiry}
                  onChange={handleChange}
                  style={{
                    accentColor: "var(--accent)",
                    width: 13,
                    height: 13,
                  }}
                />
                {t("has_expiry", "product_form")}
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--tx2)",
                }}
              >
                <input
                  type="checkbox"
                  name="has_batch"
                  checked={form.has_batch}
                  onChange={handleChange}
                  style={{
                    accentColor: "var(--accent)",
                    width: 13,
                    height: 13,
                  }}
                />
                {t("has_batch", "product_form")}
              </label>
            </div>
          )}

          {/* VARIANTS */}
          {isVariant && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <div style={{ marginTop: 4 }}>
                <p
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--tx3)",
                    marginBottom: 12,
                    borderBottom: "1px solid var(--bd)",
                    paddingBottom: 6,
                  }}
                >
                  {t("variants", "product_form")}
                </p>

                {existingVariants.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--tx3)",
                        marginBottom: 8,
                      }}
                    >
                      {t("saved_variants", "product_form")}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full" style={{ fontSize: 12 }}>
                        <thead>
                          <tr>
                            {[
                              t("col_name", "product_form"),
                              t("col_sku", "product_form"),
                              t("col_cost", "product_form"),
                              t("col_price", "product_form"),
                              t("col_stock", "product_form"),
                            ].map((h) => (
                              <th
                                key={h}
                                style={{
                                  textAlign:
                                    h === t("col_name", "product_form") ||
                                    h === t("col_sku", "product_form")
                                      ? "left"
                                      : "right",
                                  padding: "4px 8px",
                                  color: "var(--tx3)",
                                  fontWeight: 600,
                                  fontSize: 11,
                                }}
                              >
                                {h}
                              </th>
                            ))}
                            <th style={{ width: 40 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {existingVariants.map((v) => (
                            <tr
                              key={v.id}
                              style={{ borderTop: "1px solid var(--bd)" }}
                            >
                              <td
                                style={{
                                  padding: "6px 8px",
                                  fontWeight: 600,
                                  color: "var(--tx)",
                                }}
                              >
                                {v.variant_name}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  fontFamily: "monospace",
                                  color: "var(--tx3)",
                                }}
                              >
                                {v.sku || "—"}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                  color: "var(--tx3)",
                                }}
                              >
                                {Number(v.cost_price).toFixed(2)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                  fontWeight: 600,
                                }}
                              >
                                {Number(v.selling_price).toFixed(2)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                }}
                              >
                                {Number(v.stock_quantity)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                }}
                              >
                                <button
                                  type="button"
                                  className="hbtn"
                                  disabled={deletingVariantId === v.id}
                                  onClick={() =>
                                    handleDeleteExistingVariant(v.id)
                                  }
                                  title={t("remove_variant", "product_form")}
                                  style={{ color: "var(--red)" }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <p
                  style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 8 }}
                >
                  {existingVariants.length > 0
                    ? t("add_more_variants", "product_form")
                    : t("add_variants", "product_form")}
                </p>

                <datalist id="variant-name-suggestions">
                  {attributeValues.map((av) => (
                    <option key={av.id} value={av.value}>
                      {av.attribute?.name
                        ? `${av.attribute.name}: ${av.value}`
                        : av.value}
                    </option>
                  ))}
                </datalist>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {newVariants.map((v, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto",
                        gap: 6,
                        alignItems: "end",
                      }}
                    >
                      <div className="fg" style={{ margin: 0 }}>
                        {index === 0 && (
                          <label style={{ fontSize: 11 }}>
                            {t("variant_name", "product_form")}{" "}
                            <span style={{ color: "var(--red)" }}>*</span>
                          </label>
                        )}
                        <input
                          list="variant-name-suggestions"
                          value={v.variant_name}
                          onChange={(e) =>
                            handleVariantChange(
                              index,
                              "variant_name",
                              e.target.value,
                            )
                          }
                          placeholder={t(
                            "variant_name_placeholder",
                            "product_form",
                          )}
                          style={{ fontSize: 12 }}
                        />
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        {index === 0 && (
                          <label style={{ fontSize: 11 }}>
                            {t("col_sku", "product_form")}
                          </label>
                        )}
                        <input
                          value={v.sku}
                          onChange={(e) =>
                            handleVariantChange(index, "sku", e.target.value)
                          }
                          placeholder={t("optional", "product_form")}
                          style={{ fontSize: 12 }}
                        />
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        {index === 0 && (
                          <label style={{ fontSize: 11 }}>
                            {t("barcode", "product_form")}
                          </label>
                        )}
                        <input
                          value={v.barcode}
                          onChange={(e) =>
                            handleVariantChange(
                              index,
                              "barcode",
                              e.target.value,
                            )
                          }
                          placeholder={t("optional", "product_form")}
                          style={{ fontSize: 12 }}
                        />
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        {index === 0 && (
                          <label style={{ fontSize: 11 }}>
                            {t("col_cost", "product_form")}
                          </label>
                        )}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.cost_price}
                          onChange={(e) =>
                            handleVariantChange(
                              index,
                              "cost_price",
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                          style={{ fontSize: 12 }}
                        />
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        {index === 0 && (
                          <label style={{ fontSize: 11 }}>
                            {t("col_price", "product_form")}
                          </label>
                        )}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.selling_price}
                          onChange={(e) =>
                            handleVariantChange(
                              index,
                              "selling_price",
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                          style={{ fontSize: 12 }}
                        />
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        {index === 0 && (
                          <label style={{ fontSize: 11 }}>
                            {t("col_stock", "product_form")}
                          </label>
                        )}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.stock_quantity}
                          onChange={(e) =>
                            handleVariantChange(
                              index,
                              "stock_quantity",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          style={{ fontSize: 12 }}
                        />
                      </div>
                      <div style={{ paddingBottom: 1 }}>
                        {index === 0 && <div style={{ height: 18 }} />}
                        <button
                          type="button"
                          className="hbtn"
                          onClick={() => removeVariantRow(index)}
                          title={t("remove_variant", "product_form")}
                          style={{ color: "var(--tx3)" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addVariantRow}
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 0,
                  }}
                >
                  <Plus size={13} /> {t("add_another_variant", "product_form")}
                </button>

                {errors.variants && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--red)",
                      display: "block",
                      marginTop: 6,
                    }}
                  >
                    {errors.variants}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="fg col-span-1 sm:col-span-2 lg:col-span-3">
            <label>{t("description", "product_form")}</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder={t("description_placeholder", "product_form")}
            />
          </div>

          {/* ACTIONS */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? t("saving", "product_form")
                : isEdit
                  ? t("update_product", "product_form")
                  : t("create_product", "product_form")}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/products")}>
              <ArrowLeft size={14} />
              <span>{t("back", "product_form")}</span>
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
