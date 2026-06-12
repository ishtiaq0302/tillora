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
  batch_no: "",
  quantity: 1,
  cost_price: 0,
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

export default function PurchaseForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentStore } = useAuth();
  const [saving, setSaving] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [variantsByProduct, setVariantsByProduct] = useState({});

  const [form, setForm] = useState({
    supplier_id: "",
    invoice_no: "",
    payment_status: "paid",
    purchase_status: "received",
    discount: 0,
    shipping: 0,
    notes: "",
    store_id: "",
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    masterService
      .getAll("suppliers")
      .then((r) => setSuppliers(r.data?.data || r.data || []))
      .catch(() => {});
    productService
      .getAll()
      .then((r) => setProducts(r.data?.data || r.data || []))
      .catch(() => {});
    masterService
      .getAll("stores")
      .then((r) => setStores(r.data?.data || r.data || []))
      .catch(() => {});
    if (currentStore?.id) setForm((f) => ({ ...f, store_id: currentStore.id }));
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

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

  const handleItemChange = (idx, field, value) => {
    setItems((prev) => {
      const updated = prev.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [field]: value };
        if (field === "product_id") {
          newItem.product_variant_id = "";
          newItem.batch_no = "";
          const product = products.find((p) => String(p.id) === String(value));
          if (product) {
            newItem.cost_price = Number(product.cost_price);
            fetchVariants(value);
          }
        }
        if (field === "product_variant_id" && value) {
          const variants = variantsByProduct[item.product_id] || [];
          const variant = variants.find((v) => String(v.id) === String(value));
          if (variant) newItem.cost_price = Number(variant.cost_price);
        }
        const qty = Number(newItem.quantity) || 0;
        const cost = Number(newItem.cost_price) || 0;
        const disc = Number(newItem.discount) || 0;
        const tax = Number(newItem.tax) || 0;
        newItem.total = qty * cost - disc + tax;
        return newItem;
      });
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce(
    (s, it) => s + Number(it.quantity) * Number(it.cost_price),
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
    if (!form.invoice_no.trim())
      e.invoice_no = t("invoice_required", "purchase_form");
    if (!currentStore?.id && !form.store_id)
      e.store_id = t("store_required", "purchase_form");
    if (items.length === 0)
      e.items = t("add_at_least_one_item", "purchase_form");
    const invalidItems = items.some(
      (it) => !it.product_id || Number(it.quantity) <= 0,
    );
    if (invalidItems) e.items = t("items_invalid", "purchase_form");
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
        supplier_id: form.supplier_id || null,
        store_id: form.store_id || undefined,
        subtotal,
        discount: Number(form.discount),
        tax: itemsTax,
        shipping: Number(form.shipping),
        grand_total: grandTotal,
        items: items.map((it) => ({
          product_id: it.product_id,
          product_variant_id: it.product_variant_id || null,
          batch_no: it.batch_no || null,
          quantity: Number(it.quantity),
          cost_price: Number(it.cost_price),
          discount: Number(it.discount),
          tax: Number(it.tax),
          total: it.total,
        })),
      };
      await masterService.create("purchases", payload);
      toast.success(t("created_successfully", "purchase_form"));
      navigate("/purchases");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || t("failed_to_create", "purchase_form"),
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (hasError) =>
    hasError ? { borderColor: "var(--red)" } : {};

  const totalsRows = [
    [t("subtotal", "purchase_form"), subtotal],
    [t("items_discount", "purchase_form"), -itemsDiscount],
    [t("tax", "purchase_form"), itemsTax],
    [t("extra_discount", "purchase_form"), -Number(form.discount)],
    [t("shipping", "purchase_form"), Number(form.shipping)],
  ];

  return (
    <MainLayout>
      <div className="fcard">
        <div className="ch">
          <div className="ct relative flex items-center justify-center w-full">
            <div className="absolute left-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/purchases")}
              >
                <ArrowLeft size={14} />
                <span>{t("back", "purchase_form")}</span>
              </Button>
            </div>
            <strong className="text-base sm:text-xl font-semibold">
              {t("new_purchase", "purchase_form")}
            </strong>
          </div>
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 16px" }} />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div className="fg">
              <label>
                {t("invoice_no", "purchase_form")}{" "}
                <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <input
                name="invoice_no"
                value={form.invoice_no}
                onChange={handleFormChange}
                style={inputStyle(errors.invoice_no)}
                placeholder="PO-0001"
                autoFocus
              />
              {errors.invoice_no && (
                <span style={{ fontSize: 11, color: "var(--red)" }}>
                  {errors.invoice_no}
                </span>
              )}
            </div>

            {currentStore?.id == null && stores.length > 0 && (
              <div className="fg">
                <label>
                  {t("store", "purchase_form")}{" "}
                  <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <select
                  name="store_id"
                  value={form.store_id}
                  onChange={handleFormChange}
                  style={inputStyle(errors.store_id)}
                >
                  <option value="">{t("select_store", "purchase_form")}</option>
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
              <label>{t("supplier", "purchase_form")}</label>
              <select
                name="supplier_id"
                value={form.supplier_id}
                onChange={handleFormChange}
              >
                <option value="">
                  {t("select_supplier", "purchase_form")}
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="fg">
              <label>{t("payment_status", "purchase_form")}</label>
              <select
                name="payment_status"
                value={form.payment_status}
                onChange={handleFormChange}
              >
                <option value="paid">{t("paid", "purchase_form")}</option>
                <option value="pending">{t("pending", "purchase_form")}</option>
                <option value="partial">{t("partial", "purchase_form")}</option>
              </select>
            </div>

            <div className="fg">
              <label>{t("purchase_status", "purchase_form")}</label>
              <select
                name="purchase_status"
                value={form.purchase_status}
                onChange={handleFormChange}
              >
                <option value="received">
                  {t("received", "purchase_form")}
                </option>
                <option value="pending">{t("pending", "purchase_form")}</option>
                <option value="partial">{t("partial", "purchase_form")}</option>
                <option value="cancelled">
                  {t("cancelled", "purchase_form")}
                </option>
              </select>
            </div>

            <div className="fg">
              <label>{t("extra_discount", "purchase_form")}</label>
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
              <label>{t("shipping", "purchase_form")}</label>
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
                {t("line_items", "purchase_form")}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addItem}
              >
                <Plus size={12} />
                <span>{t("add_item", "purchase_form")}</span>
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
                    <th>{t("col_product", "purchase_form")}</th>
                    <th style={{ width: 80 }}>
                      {t("col_qty", "purchase_form")}
                    </th>
                    <th style={{ width: 100 }}>
                      {t("col_cost", "purchase_form")}
                    </th>
                    <th style={{ width: 90 }}>
                      {t("col_discount", "purchase_form")}
                    </th>
                    <th style={{ width: 80 }}>
                      {t("col_tax", "purchase_form")}
                    </th>
                    <th style={{ width: 100 }}>
                      {t("col_total", "purchase_form")}
                    </th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          value={item.product_id}
                          onChange={(e) =>
                            handleItemChange(idx, "product_id", e.target.value)
                          }
                          style={cellInput}
                        >
                          <option value="">
                            {t("select_product", "purchase_form")}
                          </option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {variantsByProduct[item.product_id]?.length > 0 && (
                          <select
                            value={item.product_variant_id}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "product_variant_id",
                                e.target.value,
                              )
                            }
                            style={{ ...cellInput, marginTop: 3 }}
                          >
                            <option value="">
                              —{" "}
                              {t(
                                "select_variant",
                                "purchase_form",
                                "Select Variant",
                              )}{" "}
                              —
                            </option>
                            {variantsByProduct[item.product_id].map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.variant_name} {v.sku ? `(${v.sku})` : ""}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          value={item.batch_no}
                          onChange={(e) =>
                            handleItemChange(idx, "batch_no", e.target.value)
                          }
                          placeholder={t(
                            "batch_no",
                            "purchase_form",
                            "Batch No.",
                          )}
                          style={{ ...cellInput, marginTop: 3 }}
                        />
                      </td>
                      {["quantity", "cost_price", "discount", "tax"].map(
                        (field) => (
                          <td key={field}>
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
                        }}
                      >
                        {Number(item.total).toLocaleString()}
                      </td>
                      <td>
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
                  ))}
                </tbody>
              </table>
            </div>
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
                <span>{t("grand_total", "purchase_form")}</span>
                <span style={{ color: "var(--green)" }}>
                  {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="fg mb-4">
            <label>{t("notes", "purchase_form")}</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              rows={2}
              placeholder={t("optional_notes", "purchase_form")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? t("saving", "purchase_form")
                : t("create_purchase", "purchase_form")}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/purchases")}>
              <ArrowLeft size={14} />
              <span>{t("cancel", "purchase_form")}</span>
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
