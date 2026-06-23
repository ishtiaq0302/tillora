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
  product_variant_id: null,
  variant_ids: null,
  checkedVariantIds: [],
  selectedSingleVariantId: null,
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
  const [storeVariants, setStoreVariants] = useState([]);
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
    masterService
      .getAll("variants")
      .then((r) => setStoreVariants((r.data?.data || r.data || []).filter((v) => v.multi_select)))
      .catch(() => {});
    // Prefill next invoice number
    masterService
      .getAll("sales/next-invoice-no")
      .then((r) => {
        const no = r.data?.invoice_no || r.data;
        if (no) setForm((f) => ({ ...f, invoice_no: no }));
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
          newItem.product_variant_id = null;
          newItem.variant_ids = null;
          newItem.checkedVariantIds = [];
          newItem.selectedSingleVariantId = null;
          newItem.selected_options = {};
          const product = products.find((p) => String(p.id) === String(value));
          if (product) {
            newItem.price = Number(product.selling_price);
            fetchVariants(value);
          }
        }

        // Attribute option selection (optional, no variant auto-matching)
        if (field.startsWith("opt_")) {
          const attrId = field.slice(4);
          const isMultiMode = storeAttributes[attrId]?.allow_multi_select;
          const rawCurrent = item.selected_options?.[attrId];
          const currentArr = Array.isArray(rawCurrent) ? rawCurrent : (rawCurrent ? [rawCurrent] : []);
          let nextArr;
          if (isMultiMode) {
            nextArr = currentArr.includes(value) ? currentArr.filter((v) => v !== value) : (value ? [...currentArr, value] : currentArr);
          } else {
            nextArr = currentArr[0] === value ? [] : (value ? [value] : []);
          }
          newItem.selected_options = { ...(item.selected_options || {}), [attrId]: nextArr };
        }

        // Toggle a multi-select variant (checkbox)
        if (field === "toggle_multi_variant") {
          const varId = value;
          const existing = item.checkedVariantIds || [];
          const newChecked = existing.includes(varId) ? existing.filter((id) => id !== varId) : [...existing, varId];
          newItem.checkedVariantIds = newChecked;
          const allVarIds = [...(item.selectedSingleVariantId ? [item.selectedSingleVariantId] : []), ...newChecked];
          const baseProduct = products.find((p) => String(p.id) === String(item.product_id));
          const basePrice = baseProduct ? Number(baseProduct.selling_price) : 0;
          const pvars = variantsByProduct[item.product_id] || [];
          const pvByNameMap = Object.fromEntries(pvars.map((v) => [(v.variant_name || "").toLowerCase().trim(), v]));
          // multi-select ids are standalone Variant IDs — look up price by name from ProductVariant
          const multiPrice = newChecked.reduce((s, svId) => {
            const sv = storeVariants.find((v) => v.id === svId);
            if (!sv) return s;
            const pv = pvByNameMap[(sv.name || "").toLowerCase().trim()];
            return s + (pv ? Number(pv.selling_price) : 0);
          }, 0);
          // single-select id is still a ProductVariant ID
          const singlePv = pvars.find((v) => v.id === item.selectedSingleVariantId);
          const singlePrice = singlePv ? Number(singlePv.selling_price) : 0;
          newItem.price = basePrice + multiPrice + singlePrice;
          newItem.variant_ids = allVarIds.length > 0 ? allVarIds : null;
          newItem.product_variant_id = null;
        }

        // Select/deselect a single-select variant (radio)
        if (field === "select_single_variant") {
          const varId = value;
          const newSingleId = item.selectedSingleVariantId === varId ? null : varId;
          newItem.selectedSingleVariantId = newSingleId;
          const allVarIds = [...(newSingleId ? [newSingleId] : []), ...(item.checkedVariantIds || [])];
          const baseProduct = products.find((p) => String(p.id) === String(item.product_id));
          const basePrice = baseProduct ? Number(baseProduct.selling_price) : 0;
          const pvars = variantsByProduct[item.product_id] || [];
          const pvByNameMap = Object.fromEntries(pvars.map((v) => [(v.variant_name || "").toLowerCase().trim(), v]));
          // single-select id is a ProductVariant ID — direct price lookup
          const singlePv = pvars.find((v) => v.id === newSingleId);
          const singlePrice = singlePv ? Number(singlePv.selling_price) : 0;
          // multi-select ids are standalone Variant IDs — look up price by name
          const multiPrice = (item.checkedVariantIds || []).reduce((s, svId) => {
            const sv = storeVariants.find((v) => v.id === svId);
            if (!sv) return s;
            const pv = pvByNameMap[(sv.name || "").toLowerCase().trim()];
            return s + (pv ? Number(pv.selling_price) : 0);
          }, 0);
          newItem.price = basePrice + singlePrice + multiPrice;
          newItem.variant_ids = allVarIds.length > 0 ? allVarIds : null;
          newItem.product_variant_id = null;
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
        items: items.map((it) => {
          // Remap ProductVariant IDs to standalone Variant IDs so Variant.stockQuantity is decremented on sale
          const pvars = variantsByProduct[it.product_id] || [];
          const svByName = Object.fromEntries(storeVariants.map((sv) => [sv.name.toLowerCase().trim(), sv]));
          const resolvedVariantIds = (it.variant_ids || []).map((varId) => {
            const pv = pvars.find((v) => v.id === varId);
            if (pv) {
              const match = svByName[(pv.variant_name || "").toLowerCase().trim()];
              if (match) return match.id;
            }
            return varId;
          });
          return {
            product_id: it.product_id,
            product_variant_id: it.product_variant_id || null,
            variant_ids: resolvedVariantIds.length > 0 ? resolvedVariantIds : null,
            quantity: Number(it.quantity),
            price: Number(it.price),
            discount: Number(it.discount),
            tax: Number(it.tax),
            total: it.total,
          };
        }),
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
                placeholder="Auto-generated"
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
                    const pvByName = Object.fromEntries(allVariants.map((v) => [(v.variant_name || "").toLowerCase().trim(), v]));
                    // Use standalone Variant IDs directly so variant.stockQuantity is decremented on sale
                    const multiSelectVariants = storeVariants.map((sv) => {
                      const pv = pvByName[(sv.name || "").toLowerCase().trim()];
                      return {
                        id: sv.id,
                        variant_name: sv.name,
                        selling_price: pv ? Number(pv.selling_price) : 0,
                        stock_quantity: sv.stock_quantity,
                        multi_select: true,
                      };
                    });
                    const singleSelectVariants = allVariants.filter((v) => !v.multi_select);

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

                          {/* Multi-select variants — checkboxes, pick many */}
                          {item.product_id && multiSelectVariants.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              <div style={{ fontSize: 10, color: "var(--tx3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                                Select Multiple
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {multiSelectVariants.map((v) => {
                                  const isChecked = (item.checkedVariantIds || []).includes(v.id);
                                  return (
                                    <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", padding: "3px 8px", borderRadius: 6, border: `1px solid ${isChecked ? "var(--accent, #f59e0b)" : "var(--bd)"}`, background: isChecked ? "var(--accent-bg, #fef3c7)" : "var(--bg3)", fontSize: 11.5, color: "var(--tx)", transition: "all 0.12s" }}>
                                      <input type="checkbox" checked={isChecked} onChange={() => handleItemChange(idx, "toggle_multi_variant", v.id)} style={{ width: 12, height: 12, accentColor: "var(--accent, #f59e0b)", flexShrink: 0 }} />
                                      <span style={{ fontWeight: 600 }}>{v.variant_name}</span>
                                      {Number(v.selling_price) > 0 && <span style={{ color: "var(--tx3)", fontSize: 10 }}>+{Number(v.selling_price).toLocaleString()}</span>}
                                      {v.stock_quantity != null && <span style={{ fontSize: 9.5, color: v.stock_quantity > 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{v.stock_quantity > 0 ? `${v.stock_quantity}` : "Out"}</span>}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Single-select variants — radios, pick one */}
                          {item.product_id && singleSelectVariants.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              <div style={{ fontSize: 10, color: "var(--tx3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                                Select One
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {singleSelectVariants.map((v) => {
                                  const isSelected = item.selectedSingleVariantId === v.id;
                                  return (
                                    <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", padding: "3px 8px", borderRadius: 6, border: `1px solid ${isSelected ? "var(--accent, #f59e0b)" : "var(--bd)"}`, background: isSelected ? "var(--accent-bg, #fef3c7)" : "var(--bg3)", fontSize: 11.5, color: "var(--tx)", transition: "all 0.12s" }}>
                                      <input type="radio" name={`sale_single_variant_${idx}`} checked={isSelected} onChange={() => {}} onClick={() => handleItemChange(idx, "select_single_variant", v.id)} style={{ width: 12, height: 12, accentColor: "var(--accent, #f59e0b)", flexShrink: 0 }} />
                                      <span style={{ fontWeight: 600 }}>{v.variant_name}</span>
                                      {Number(v.selling_price) > 0 && <span style={{ color: "var(--tx3)", fontSize: 10 }}>+{Number(v.selling_price).toLocaleString()}</span>}
                                      {v.stock_quantity != null && <span style={{ fontSize: 9.5, color: v.stock_quantity > 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{v.stock_quantity > 0 ? `${v.stock_quantity}` : "Out"}</span>}
                                    </label>
                                  );
                                })}
                              </div>
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
