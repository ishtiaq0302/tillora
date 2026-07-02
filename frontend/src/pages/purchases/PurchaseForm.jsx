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

const EMPTY_INGREDIENT_ITEM = {
  ingredient_id: "",
  quantity: 1,
  cost_price: 0,
  discount: 0,
  tax: 0,
  total: 0,
};

const EMPTY_VARIANT_ITEM = {
  variant_id: "",
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
  // All ingredients fetched on load; shown in the Ingredients section
  const [ingredients, setIngredients] = useState([]);
  // All multi-select variants (from Variant master, not ProductVariant) for the Variant Add-ons section
  const [multiSelectVariants, setMultiSelectVariants] = useState([]);
  // Per-product variants fetched lazily when a product is selected in the Products table
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
  const [ingredientItems, setIngredientItems] = useState([]);
  const [variantItems, setVariantItems] = useState([]);
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
    // Load all ingredients once; shown in the Ingredients section
    masterService
      .getAll("ingredients")
      .then((r) => setIngredients(r.data?.data || r.data || []))
      .catch(() => {});
    // Load multi-select variants from the Variant master table (standalone add-ons, no product link)
    masterService
      .getAll("variants", { multi_select: true })
      .then((r) => setMultiSelectVariants(r.data?.data || r.data || []))
      .catch(() => {});
    masterService
      .getAll("purchases/next-invoice-no")
      .then((r) => {
        const no = r.data?.invoice_no || r.data;
        if (no) setForm((f) => ({ ...f, invoice_no: no }));
      })
      .catch(() => {});
    if (currentStore?.id) setForm((f) => ({ ...f, store_id: currentStore.id }));
  }, []);

  // Fetch variants for a specific product (used by the Products table sub-selector)
  const fetchVariantsForProduct = (productId) => {
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
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [field]: value };

        if (field === "product_id") {
          newItem.product_variant_id = "";
          const product = products.find((p) => String(p.id) === String(value));
          if (product) newItem.cost_price = Number(product.cost_price);
          if (value) fetchVariantsForProduct(value);
        }

        if (field === "product_variant_id") {
          if (value) {
            const vars = variantsByProduct[item.product_id] || [];
            const variant = vars.find((v) => String(v.id) === String(value));
            if (variant) newItem.cost_price = Number(variant.cost_price);
          } else {
            // Cleared: revert to base product cost
            const product = products.find((p) => String(p.id) === String(item.product_id));
            if (product) newItem.cost_price = Number(product.cost_price);
          }
        }

        const qty = Number(newItem.quantity) || 0;
        const cost = Number(newItem.cost_price) || 0;
        const disc = Number(newItem.discount) || 0;
        const tax = Number(newItem.tax) || 0;
        newItem.total = qty * cost - disc + tax;
        return newItem;
      })
    );
  };

  const handleIngredientItemChange = (idx, field, value) => {
    setIngredientItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [field]: value };
        if (field === "ingredient_id") {
          const ingredient = ingredients.find((ig) => String(ig.id) === String(value));
          if (ingredient) newItem.cost_price = Number(ingredient.cost_price);
        }
        const qty = Number(newItem.quantity) || 0;
        const cost = Number(newItem.cost_price) || 0;
        const disc = Number(newItem.discount) || 0;
        const tax = Number(newItem.tax) || 0;
        newItem.total = qty * cost - disc + tax;
        return newItem;
      })
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const addIngredientItem = () =>
    setIngredientItems((prev) => [...prev, { ...EMPTY_INGREDIENT_ITEM }]);
  const removeIngredientItem = (idx) =>
    setIngredientItems((prev) => prev.filter((_, i) => i !== idx));

  const handleVariantItemChange = (idx, field, value) => {
    setVariantItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [field]: value };
        if (field === "variant_id") {
          const v = multiSelectVariants.find((mv) => String(mv.id) === String(value));
          if (v) newItem.cost_price = Number(v.cost_price || 0);
        }
        const qty = Number(newItem.quantity) || 0;
        const cost = Number(newItem.cost_price) || 0;
        const disc = Number(newItem.discount) || 0;
        const tax = Number(newItem.tax) || 0;
        newItem.total = qty * cost - disc + tax;
        return newItem;
      })
    );
  };

  const addVariantItem = () =>
    setVariantItems((prev) => [...prev, { ...EMPTY_VARIANT_ITEM }]);
  const removeVariantItem = (idx) =>
    setVariantItems((prev) => prev.filter((_, i) => i !== idx));

  const filledItems = items.filter((it) => it.product_id);
  const filledIngredients = ingredientItems.filter((it) => it.ingredient_id);
  const filledVariantItems = variantItems.filter((it) => it.variant_id);

  const subtotal =
    filledItems.reduce((s, it) => s + Number(it.quantity) * Number(it.cost_price), 0) +
    filledIngredients.reduce((s, it) => s + Number(it.quantity) * Number(it.cost_price), 0) +
    filledVariantItems.reduce((s, it) => s + Number(it.quantity) * Number(it.cost_price), 0);
  const itemsDiscount =
    filledItems.reduce((s, it) => s + Number(it.discount), 0) +
    filledIngredients.reduce((s, it) => s + Number(it.discount), 0) +
    filledVariantItems.reduce((s, it) => s + Number(it.discount), 0);
  const itemsTax =
    filledItems.reduce((s, it) => s + Number(it.tax), 0) +
    filledIngredients.reduce((s, it) => s + Number(it.tax), 0) +
    filledVariantItems.reduce((s, it) => s + Number(it.tax), 0);
  const grandTotal =
    subtotal - itemsDiscount + itemsTax - Number(form.discount) + Number(form.shipping);

  const validate = () => {
    const e = {};
    if (!currentStore?.id && !form.store_id)
      e.store_id = t("store_required", "purchase_form");
    if (filledItems.length === 0 && filledIngredients.length === 0 && filledVariantItems.length === 0)
      e.items = t("add_at_least_one_item", "purchase_form");
    const invalidItems = filledItems.some((it) => {
      if (Number(it.quantity) <= 0) return true;
      // Product has single-select variants → a specific variant must be chosen
      const singleVars = (variantsByProduct[it.product_id] || []).filter(
        (v) => !v.multi_select
      );
      if (singleVars.length > 0 && !it.product_variant_id) return true;
      return false;
    });
    const invalidIngredients = filledIngredients.some((it) => Number(it.quantity) <= 0);
    const invalidVariants = filledVariantItems.some((it) => Number(it.quantity) <= 0);
    if (invalidItems || invalidIngredients || invalidVariants) e.items = t("items_invalid", "purchase_form");
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
        items: filledItems.map((it) => ({
          product_id: it.product_id,
          product_variant_id: it.product_variant_id || null,
          batch_no: it.batch_no || null,
          quantity: Number(it.quantity),
          cost_price: Number(it.cost_price),
          discount: Number(it.discount),
          tax: Number(it.tax),
          total: it.total,
        })),
        ingredient_items: filledIngredients.map((it) => ({
          ingredient_id: it.ingredient_id,
          quantity: Number(it.quantity),
          cost_price: Number(it.cost_price),
          discount: Number(it.discount),
          tax: Number(it.tax),
          total: it.total,
        })),
        variant_items: filledVariantItems.map((it) => ({
          variant_id: it.variant_id,
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
        err?.response?.data?.message || t("failed_to_create", "purchase_form")
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (hasError) => (hasError ? { borderColor: "var(--red)" } : {});

  const totalsRows = [
    [t("subtotal", "purchase_form"), subtotal],
    [t("items_discount", "purchase_form"), -itemsDiscount],
    [t("tax", "purchase_form"), itemsTax],
    [t("extra_discount", "purchase_form"), -Number(form.discount)],
    [t("shipping", "purchase_form"), Number(form.shipping)],
  ];

  const sectionLabel = {
    fontSize: 10.5,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "var(--tx3)",
    margin: 0,
  };

  return (
    <MainLayout>
      <div className="fcard">
        <div className="ch">
          <div className="ct relative flex items-center justify-center w-full">
            <div className="absolute left-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/purchases")}>
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
              <label>{t("invoice_no", "purchase_form")}</label>
              <input
                name="invoice_no"
                value={form.invoice_no}
                onChange={handleFormChange}
                placeholder="Auto-generated"
                autoFocus
              />
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
                <option value="">{t("select_supplier", "purchase_form")}</option>
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
                <option value="received">{t("received", "purchase_form")}</option>
                <option value="pending">{t("pending", "purchase_form")}</option>
                <option value="partial">{t("partial", "purchase_form")}</option>
                <option value="cancelled">{t("cancelled", "purchase_form")}</option>
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

          {/* SECTION HEADER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <p style={sectionLabel}>{t("line_items", "purchase_form")}</p>
            <div style={{ display: "flex", gap: 6 }}>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                <Plus size={12} />
                <span>{t("add_item", "purchase_form")}</span>
              </Button>
              {ingredients.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addIngredientItem}
                >
                  <Plus size={12} />
                  <span>Add Ingredient</span>
                </Button>
              )}
              {multiSelectVariants.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addVariantItem}
                >
                  <Plus size={12} />
                  <span>Add Variant Add-on</span>
                </Button>
              )}
            </div>
          </div>

          {errors.items && (
            <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 6 }}>
              {errors.items}
            </p>
          )}

          {/* PRODUCTS TABLE */}
          <div style={{ marginBottom: 16 }}>
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
                    <th style={{ width: 80 }}>{t("col_qty", "purchase_form")}</th>
                    <th style={{ width: 100 }}>{t("col_cost", "purchase_form")}</th>
                    <th style={{ width: 90 }}>{t("col_discount", "purchase_form")}</th>
                    <th style={{ width: 80 }}>{t("col_tax", "purchase_form")}</th>
                    <th style={{ width: 100 }}>{t("col_total", "purchase_form")}</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    // Only single-select variants belong in the Products table sub-selector
                    const singleSelectVars = (
                      variantsByProduct[item.product_id] || []
                    ).filter((v) => !v.multi_select);
                    const needsVariant =
                      item.product_id && singleSelectVars.length > 0 && !item.product_variant_id;

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
                              {t("select_product", "purchase_form")}
                            </option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>

                          {/* Single-select variant sub-selector (defines which version of the product) */}
                          {item.product_id && singleSelectVars.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {item.product_variant_id ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      padding: "2px 9px",
                                      borderRadius: 4,
                                      background: "#f0fdf4",
                                      border: "1px solid #86efac",
                                      color: "#16a34a",
                                      fontWeight: 600,
                                    }}
                                  >
                                    ✓{" "}
                                    {
                                      singleSelectVars.find(
                                        (v) => v.id === item.product_variant_id
                                      )?.variant_name
                                    }
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleItemChange(idx, "product_variant_id", "")
                                    }
                                    title="Clear variant"
                                    style={{
                                      fontSize: 14,
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "var(--tx3)",
                                      lineHeight: 1,
                                      padding: "0 2px",
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: "var(--red)",
                                      fontWeight: 600,
                                      marginBottom: 3,
                                    }}
                                  >
                                    ⚠ Select a variant (required)
                                  </div>
                                  <select
                                    value={item.product_variant_id}
                                    onChange={(e) =>
                                      handleItemChange(
                                        idx,
                                        "product_variant_id",
                                        e.target.value
                                      )
                                    }
                                    style={{ ...cellInput, borderColor: "var(--red)" }}
                                  >
                                    <option value="">— Select variant —</option>
                                    {singleSelectVars.map((v) => (
                                      <option key={v.id} value={v.id}>
                                        {v.variant_name}
                                        {v.cost_price
                                          ? ` (cost: ${Number(v.cost_price).toLocaleString()})`
                                          : ""}
                                      </option>
                                    ))}
                                  </select>
                                </>
                              )}
                            </div>
                          )}

                          <input
                            value={item.batch_no}
                            onChange={(e) =>
                              handleItemChange(idx, "batch_no", e.target.value)
                            }
                            placeholder={t("batch_no", "purchase_form", "Batch No.")}
                            style={{ ...cellInput, marginTop: 6 }}
                          />
                        </td>
                        {["quantity", "cost_price", "discount", "tax"].map((field) => (
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
                        ))}
                        <td
                          style={{
                            fontWeight: 600,
                            color: needsVariant ? "var(--tx3)" : "var(--green)",
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* INGREDIENTS TABLE — standalone purchasable ingredients */}
          {ingredientItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <p style={sectionLabel}>Ingredients</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addIngredientItem}
                >
                  <Plus size={12} />
                  <span>Add Ingredient</span>
                </Button>
              </div>
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
                      <th>Ingredient</th>
                      <th style={{ width: 80 }}>{t("col_qty", "purchase_form")}</th>
                      <th style={{ width: 100 }}>{t("col_cost", "purchase_form")}</th>
                      <th style={{ width: 90 }}>{t("col_discount", "purchase_form")}</th>
                      <th style={{ width: 80 }}>{t("col_tax", "purchase_form")}</th>
                      <th style={{ width: 100 }}>{t("col_total", "purchase_form")}</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientItems.map((item, idx) => {
                      const ing = ingredients.find(
                        (ig) => ig.id === item.ingredient_id
                      );
                      return (
                        <tr key={idx}>
                          <td>
                            <select
                              value={item.ingredient_id}
                              onChange={(e) =>
                                handleIngredientItemChange(
                                  idx,
                                  "ingredient_id",
                                  e.target.value
                                )
                              }
                              style={cellInput}
                            >
                              <option value="">— Select ingredient —</option>
                              {ingredients.map((ig) => (
                                <option key={ig.id} value={ig.id}>
                                  {ig.name}
                                  {ig.unit ? ` (${ig.unit})` : ""}
                                </option>
                              ))}
                            </select>
                            {ing?.unit && item.ingredient_id && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--tx3)",
                                  marginTop: 3,
                                }}
                              >
                                Stock: {Number(ing.stock_quantity).toLocaleString()} {ing.unit}
                              </div>
                            )}
                          </td>
                          {["quantity", "cost_price", "discount", "tax"].map((field) => (
                            <td key={field}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item[field]}
                                onChange={(e) =>
                                  handleIngredientItemChange(idx, field, e.target.value)
                                }
                                style={cellInput}
                              />
                            </td>
                          ))}
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
                            <button
                              type="button"
                              className="hbtn"
                              onClick={() => removeIngredientItem(idx)}
                            >
                              <Trash2 size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VARIANT ADD-ONS TABLE — multi-select product variants with stock tracking */}
          {variantItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <p style={sectionLabel}>Variant Add-ons</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addVariantItem}
                >
                  <Plus size={12} />
                  <span>Add Variant Add-on</span>
                </Button>
              </div>
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
                      <th>Variant</th>
                      <th style={{ width: 80 }}>{t("col_qty", "purchase_form")}</th>
                      <th style={{ width: 100 }}>{t("col_cost", "purchase_form")}</th>
                      <th style={{ width: 90 }}>{t("col_discount", "purchase_form")}</th>
                      <th style={{ width: 80 }}>{t("col_tax", "purchase_form")}</th>
                      <th style={{ width: 100 }}>{t("col_total", "purchase_form")}</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantItems.map((item, idx) => {
                      const mv = multiSelectVariants.find(
                        (v) => v.id === item.variant_id
                      );
                      return (
                        <tr key={idx}>
                          <td>
                            <select
                              value={item.variant_id}
                              onChange={(e) =>
                                handleVariantItemChange(idx, "variant_id", e.target.value)
                              }
                              style={cellInput}
                            >
                              <option value="">— Select variant —</option>
                              {multiSelectVariants.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                            {mv && item.variant_id && (
                              <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 3 }}>
                                In Stock: {Number(mv.stock_quantity).toLocaleString()}
                              </div>
                            )}
                          </td>
                          {["quantity", "cost_price", "discount", "tax"].map((field) => (
                            <td key={field}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item[field]}
                                onChange={(e) =>
                                  handleVariantItemChange(idx, field, e.target.value)
                                }
                                style={cellInput}
                              />
                            </td>
                          ))}
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
                            <button
                              type="button"
                              className="hbtn"
                              onClick={() => removeVariantItem(idx)}
                            >
                              <Trash2 size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TOTALS */}
          <div
            style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}
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
