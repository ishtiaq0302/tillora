import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Button from "../component/Button";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";
import productService from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const EMPTY_ITEM = {
  product_id: "",
  product_variant_id: "",
  selected_options: {},
  quantity: 1,
  price: 0,
  discount: 0,
  tax: 0,
  total: 0,
};

const cellInput = {
  background: "var(--inp)",
  border: "1px solid var(--inpbd)",
  borderRadius: "var(--r)",
  padding: "4px 8px",
  fontSize: 11.5,
  color: "var(--tx)",
  width: "100%",
  outline: "none",
};

export default function SaleForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentStore } = useAuth();
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [variantsByProduct, setVariantsByProduct] = useState({});
  // Store-level attributes: { attrId: { id, name, allow_multi_select, values: [{id, value}] } }
  const [storeAttributes, setStoreAttributes] = useState({});

  const [form, setForm] = useState({
    customer_id: "",
    invoice_no: "",
    payment_status: "paid",
    sale_status: "completed",
    discount: 0,
    shipping: 0,
    notes: "",
    store_id: "",
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    masterService
      .getAll("customers")
      .then((r) => setCustomers(r.data?.data || r.data || []))
      .catch(() => {});
    productService
      .getAll({ limit: 1000 })
      .then((r) => setProducts(r.data?.data || r.data || []))
      .catch(() => {});
    masterService
      .getAll("stores")
      .then((r) => setStores(r.data?.data || r.data || []))
      .catch(() => {});
    // Load all store-level attributes once (not per-product)
    masterService
      .getAll("attributes")
      .then((r) => {
        const attrs = r.data?.data || r.data || [];
        const grouped = {};
        attrs.forEach((a) => {
          grouped[a.id] = {
            id: a.id,
            name: a.name,
            allow_multi_select: !!a.allow_multi_select,
            values: a.values || [],
          };
        });
        setStoreAttributes(grouped);
      })
      .catch(() => {});
    if (currentStore?.id) setForm((f) => ({ ...f, store_id: currentStore.id }));
  }, []);

  const fetchVariants = (productId) => {
    if (!productId || variantsByProduct[productId]) return;
    masterService
      .getAll("product-variants", { product_id: productId })
      .then((r) => {
        const vars = r.data?.data || r.data || [];
        setVariantsByProduct((prev) => ({ ...prev, [productId]: vars }));
      })
      .catch(() => {});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleItemChange = (idx, field, value) => {
    setItems((prev) => {
      const updated = prev.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [field]: value };

        if (field === "product_id") {
          newItem.product_variant_id = "";
          newItem.selected_options = {};
          const product = products.find((p) => String(p.id) === String(value));
          if (product) {
            newItem.price = Number(product.selling_price);
            fetchVariants(value);
          }
        }

        // Handle option selection: field format "opt_ATTRIBUTEID", value is the attributeValueId to toggle
        if (field.startsWith("opt_")) {
          const attrId = field.slice(4);
          const isMultiMode = storeAttributes[attrId]?.allow_multi_select;
          const rawCurrent = item.selected_options?.[attrId];
          const currentArr = Array.isArray(rawCurrent) ? rawCurrent : (rawCurrent ? [rawCurrent] : []);

          let nextArr;
          if (isMultiMode) {
            nextArr = currentArr.includes(value)
              ? currentArr.filter((v) => v !== value)
              : (value ? [...currentArr, value] : currentArr);
          } else {
            nextArr = currentArr[0] === value ? [] : (value ? [value] : []);
          }

          const newOpts = { ...(item.selected_options || {}), [attrId]: nextArr };
          newItem.selected_options = newOpts;
          newItem.product_variant_id = "";

          // Auto-match variant using single-select attributes only
          const singleSelectKeys = Object.keys(storeAttributes).filter(
            (aid) => !storeAttributes[aid]?.allow_multi_select
          );
          const allSinglesPicked =
            singleSelectKeys.length > 0 &&
            singleSelectKeys.every((aid) => {
              const v = newOpts[aid] || [];
              return Array.isArray(v) ? v.length > 0 : !!v;
            });
          if (allSinglesPicked) {
            const selectedValues = singleSelectKeys
              .map((aid) => {
                const v = newOpts[aid] || [];
                const vid = Array.isArray(v) ? v[0] : v;
                return vid ? storeAttributes[aid].values.find((av) => av.id === vid)?.value : null;
              })
              .filter(Boolean);
            const vars = variantsByProduct[item.product_id] || [];
            const match = vars.find((v) =>
              selectedValues.every((val) =>
                v.variant_name.toLowerCase().includes(val.toLowerCase())
              )
            );
            if (match) {
              const baseProduct = products.find((p) => String(p.id) === String(item.product_id));
              const basePrice = baseProduct ? Number(baseProduct.selling_price) : 0;
              newItem.product_variant_id = match.id;
              newItem.price = basePrice + Number(match.selling_price);
            }
          }
        }

        if (field === "product_variant_id") {
          const baseProduct = products.find((p) => String(p.id) === String(item.product_id));
          const basePrice = baseProduct ? Number(baseProduct.selling_price) : 0;
          if (value) {
            const variants = variantsByProduct[item.product_id] || [];
            const variant = variants.find((v) => String(v.id) === String(value));
            if (variant) newItem.price = basePrice + Number(variant.selling_price);
          } else {
            newItem.price = basePrice;
          }
        }

        const qty = Number(newItem.quantity) || 0;
        const price = Number(newItem.price) || 0;
        const disc = Number(newItem.discount) || 0;
        const tax = Number(newItem.tax) || 0;
        newItem.total = qty * price - disc + tax;
        return newItem;
      });
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce(
    (s, it) => s + Number(it.quantity) * Number(it.price),
    0,
  );
  const itemsDiscount = items.reduce((s, it) => s + Number(it.discount), 0);
  const itemsTax = items.reduce((s, it) => s + Number(it.tax), 0);
  const grandTotal =
    subtotal -
    itemsDiscount +
    itemsTax -
    Number(form.discount) +
    Number(form.shipping);

  const validate = () => {
    const e = {};
    if (!currentStore?.id && !form.store_id)
      e.store_id = t("store_required", "sale_form");
    if (items.length === 0) e.items = t("add_at_least_one_item", "sale_form");
    // Variant selection is optional — only require product + quantity
    const invalidItems = items.some(
      (it) => !it.product_id || Number(it.quantity) <= 0
    );
    if (invalidItems) e.items = t("items_invalid", "sale_form");
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      const payload = {
        ...form,
        invoice_no: form.invoice_no?.trim() || undefined,
        customer_id: form.customer_id || null,
        store_id: form.store_id || undefined,
        subtotal,
        discount: Number(form.discount),
        tax: itemsTax,
        shipping: Number(form.shipping),
        grand_total: grandTotal,
        items: items.map((it) => ({
          product_id: it.product_id,
          product_variant_id: it.product_variant_id || null,
          quantity: Number(it.quantity),
          price: Number(it.price),
          discount: Number(it.discount),
          tax: Number(it.tax),
          total: it.total,
        })),
      };
      await masterService.create("sales", payload);
      toast.success(t("created_successfully", "sale_form"));
      navigate("/sales");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || t("failed_to_create", "sale_form"),
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (hasError) =>
    hasError ? { borderColor: "var(--red)" } : {};

  const totalsRows = [
    [t("subtotal", "sale_form"), subtotal],
    [t("items_discount", "sale_form"), -itemsDiscount],
    [t("tax", "sale_form"), itemsTax],
    [t("extra_discount", "sale_form"), -Number(form.discount)],
    [t("shipping", "sale_form"), Number(form.shipping)],
  ];

  const attrEntries = Object.entries(storeAttributes);

  return (
    <MainLayout>
      <div className="fcard">
        <div className="ch">
          <div className="ct relative flex items-center justify-center w-full">
            <div className="absolute left-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/sales")}
              >
                <ArrowLeft size={14} />
                <span>{t("back", "sales")}</span>
              </Button>
            </div>
            <strong className="text-base sm:text-xl font-semibold">
              {t("sales", "nav")}
            </strong>
          </div>
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 16px" }} />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div className="fg">
              <label>{t("invoice_no", "sale_form")}</label>
              <input
                name="invoice_no"
                value={form.invoice_no}
                onChange={handleFormChange}
                style={inputStyle(errors.invoice_no)}
                placeholder="Auto-generated if left blank"
                autoFocus
              />
            </div>

            {currentStore?.id == null && stores.length > 0 && (
              <div className="fg">
                <label>
                  {t("store", "sale_form")}{" "}
                  <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <select
                  name="store_id"
                  value={form.store_id}
                  onChange={handleFormChange}
                  style={inputStyle(errors.store_id)}
                >
                  <option value="">{t("select_store", "sale_form")}</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.store_id && (
                  <span style={{ fontSize: 11, color: "var(--red)" }}>
                    {errors.store_id}
                  </span>
                )}
              </div>
            )}

            <div className="fg">
              <label>{t("customer", "sale_form")}</label>
              <select
                name="customer_id"
                value={form.customer_id}
                onChange={handleFormChange}
              >
                <option value="">{t("walk_in_customer", "sale_form")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="fg">
              <label>{t("payment_status", "sale_form")}</label>
              <select
                name="payment_status"
                value={form.payment_status}
                onChange={handleFormChange}
              >
                <option value="paid">{t("paid", "sale_form")}</option>
                <option value="pending">{t("pending", "sale_form")}</option>
                <option value="partial">{t("partial", "sale_form")}</option>
              </select>
            </div>

            <div className="fg">
              <label>{t("sale_status", "sale_form")}</label>
              <select
                name="sale_status"
                value={form.sale_status}
                onChange={handleFormChange}
              >
                <option value="completed">{t("completed", "sale_form")}</option>
                <option value="draft">{t("draft", "sale_form")}</option>
                <option value="cancelled">{t("cancelled", "sale_form")}</option>
              </select>
            </div>

            <div className="fg">
              <label>{t("extra_discount", "sale_form")}</label>
              <input
                name="discount"
                type="number"
                step="0.01"
                min="0"
                value={form.discount}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>

            <div className="fg">
              <label>{t("shipping", "sale_form")}</label>
              <input
                name="shipping"
                type="number"
                step="0.01"
                min="0"
                value={form.shipping}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* ITEMS */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--tx3)",
                  margin: 0,
                }}
              >
                {t("line_items", "sale_form")}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addItem}
              >
                <Plus size={12} />
                <span>{t("add_item", "sale_form")}</span>
              </Button>
            </div>
            {errors.items && (
              <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 6 }}>
                {errors.items}
              </p>
            )}
            <div
              style={{
                border: "1px solid var(--bd)",
                borderRadius: "var(--r)",
                overflow: "hidden",
              }}
            >
              <table className="w-full" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>{t("col_product", "sale_form")}</th>
                    <th style={{ width: 80 }}>{t("col_qty", "sale_form")}</th>
                    <th style={{ width: 100 }}>
                      {t("col_price", "sale_form")}
                    </th>
                    <th style={{ width: 90 }}>
                      {t("col_discount", "sale_form")}
                    </th>
                    <th style={{ width: 80 }}>{t("col_tax", "sale_form")}</th>
                    <th style={{ width: 100 }}>
                      {t("col_total", "sale_form")}
                    </th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const allVariants = variantsByProduct[item.product_id] || [];

                    // Filtered variants: only use single-select attribute selections for variant matching
                    const singleSelectFilterValues = attrEntries
                      .filter(([aid]) => !storeAttributes[aid]?.allow_multi_select)
                      .flatMap(([aid, attr]) => {
                        const selected = item.selected_options?.[aid] || [];
                        const arr = Array.isArray(selected) ? selected : [selected].filter(Boolean);
                        return arr
                          .map((vid) => attr.values.find((v) => v.id === vid)?.value)
                          .filter(Boolean);
                      });
                    const filteredVariants =
                      singleSelectFilterValues.length > 0
                        ? allVariants.filter((v) =>
                            singleSelectFilterValues.every((val) =>
                              v.variant_name.toLowerCase().includes(val.toLowerCase())
                            )
                          )
                        : allVariants;

                    return (
                      <tr key={idx}>
                        <td style={{ verticalAlign: "top", paddingTop: 6 }}>
                          <select
                            value={item.product_id}
                            onChange={(e) =>
                              handleItemChange(idx, "product_id", e.target.value)
                            }
                            style={cellInput}
                          >
                            <option value="">
                              {t("select_product", "sale_form")}
                            </option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                                {p.product_type === "variant" ? " ★" : ""}
                              </option>
                            ))}
                          </select>

                          {/* Store-level attribute option pickers */}
                          {item.product_id && attrEntries.map(([attrId, attr]) => {
                            const isMulti = attr.allow_multi_select;
                            return (
                              <div key={attrId} style={{ marginTop: 6 }}>
                                <div style={{ fontSize: 10, color: "var(--tx3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                                  {attr.name}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  {attr.values.map((av) => {
                                    const raw = item.selected_options?.[attrId];
                                    const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
                                    const isSel = arr.includes(av.id);
                                    return (
                                      <label key={av.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11.5, color: "var(--tx)" }}>
                                        <input
                                          type={isMulti ? "checkbox" : "radio"}
                                          name={isMulti ? undefined : `sale_attr_${attrId}_row_${idx}`}
                                          checked={isSel}
                                          onChange={() => handleItemChange(idx, `opt_${attrId}`, av.id)}
                                          style={{ accentColor: "var(--accent)", width: 13, height: 13, flexShrink: 0 }}
                                        />
                                        {av.value}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {/* Variant selector — always optional */}
                          {item.product_id && allVariants.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {item.product_variant_id ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 4, background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a", fontWeight: 600 }}>
                                    ✓ {allVariants.find((v) => v.id === item.product_variant_id)?.variant_name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleItemChange(idx, "product_variant_id", "")}
                                    title="Clear variant"
                                    style={{ fontSize: 14, background: "none", border: "none", cursor: "pointer", color: "var(--tx3)", lineHeight: 1, padding: "0 2px" }}
                                  >×</button>
                                </div>
                              ) : (
                                <select
                                  value={item.product_variant_id}
                                  onChange={(e) =>
                                    handleItemChange(idx, "product_variant_id", e.target.value)
                                  }
                                  style={{ ...cellInput, borderColor: "var(--bd2)" }}
                                >
                                  <option value="">{t("select_variant", "sale_form")} (optional)</option>
                                  {filteredVariants.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.variant_name}
                                      {v.selling_price ? ` (${Number(v.selling_price).toLocaleString()})` : ""}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </td>
                        {["quantity", "price", "discount", "tax"].map(
                          (field) => (
                            <td
                              key={field}
                              style={{ verticalAlign: "top", paddingTop: 6 }}
                            >
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item[field]}
                                onChange={(e) =>
                                  handleItemChange(idx, field, e.target.value)
                                }
                                style={cellInput}
                              />
                            </td>
                          ),
                        )}
                        <td
                          style={{
                            fontWeight: 600,
                            color: "var(--green)",
                            textAlign: "right",
                            verticalAlign: "top",
                            paddingTop: 10,
                          }}
                        >
                          {Number(item.total).toLocaleString()}
                        </td>
                        <td style={{ verticalAlign: "top", paddingTop: 6 }}>
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="hbtn"
                              onClick={() => removeItem(idx)}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 4 }}>
              {t("variants_indicator", "sale_form")} Attribute and variant selection is optional.
            </p>
          </div>

          {/* TOTALS */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 280,
                background: "var(--bg3)",
                borderRadius: "var(--r)",
                padding: "12px 16px",
                fontSize: 12,
              }}
            >
              {totalsRows.map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    color: "var(--tx2)",
                  }}
                >
                  <span>{label}</span>
                  <span>
                    {val >= 0 ? "" : "-"}
                    {Math.abs(val).toLocaleString()}
                  </span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid var(--bd)",
                  paddingTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  color: "var(--tx)",
                  fontSize: 14,
                }}
              >
                <span>{t("grand_total", "sale_form")}</span>
                <span style={{ color: "var(--green)" }}>
                  {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="fg mb-4">
            <label>{t("notes", "sale_form")}</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              rows={2}
              placeholder={t("optional_notes", "sale_form")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? t("saving", "sale_form")
                : t("create_sale", "sale_form")}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/sales")}>
              <ArrowLeft size={14} />
              <span>{t("cancel", "sale_form")}</span>
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
