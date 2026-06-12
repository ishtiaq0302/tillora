import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, X } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Button from "../component/Button";
import toast from "react-hot-toast";
import productService from "../../services/productService";
import masterService from "../../services/masterService";
import useStoreRefresh from "../../hooks/useStoreRefresh";
import { useAuth } from "../../context/AuthContext";

const SERVER_URL = "http://localhost:5000";

const inlineInput = {
  background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)",
  padding: "5px 10px", fontSize: 12, color: "var(--tx)", outline: "none", width: "100%",
  fontFamily: "var(--font)",
};

function VariantModal({ product, variants, onSelect, onClose }) {
  if (!product) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--bd)", borderRadius: "var(--r2)",
        width: "100%", maxWidth: 420, maxHeight: "80vh", display: "flex", flexDirection: "column",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--bd)" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>{product.name}</div>
            <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 2 }}>Select a variant</div>
          </div>
          <button className="hbtn" onClick={onClose}><X size={13} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "8px 12px 12px" }}>
          {variants.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0", fontSize: 12 }}>No variants available</div>
          ) : (
            variants.map((v) => (
              <button key={v.id} onClick={() => onSelect(product, v)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                  padding: "10px 12px", marginBottom: 4, background: "var(--bg3)", border: "1px solid var(--bd)",
                  borderRadius: "var(--r)", cursor: "pointer", textAlign: "left", transition: "border-color .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bd)"; }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>{v.variant_name}</div>
                  {v.sku && <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 1 }}>SKU: {v.sku}</div>}
                  {v.stock_quantity != null && (
                    <div style={{ fontSize: 11, color: v.stock_quantity > 0 ? "var(--green)" : "var(--red)", marginTop: 1 }}>
                      Stock: {v.stock_quantity}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)", marginLeft: 12, flexShrink: 0 }}>
                  {Number(v.selling_price).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function POS() {
  const { currentStore } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [invoiceCounter, setInvoiceCounter] = useState(1);
  const [variantModal, setVariantModal] = useState(null);

  const loadProducts = useCallback(() => {
    productService.getAll().then((r) => setProducts(r.data?.data || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
    masterService.getAll("categories").then((r) => setCategories(r.data?.data || r.data || [])).catch(() => {});
    masterService.getAll("product-variants").then((r) => setVariants(r.data?.data || r.data || [])).catch(() => {});
    masterService.getAll("customers").then((r) => setCustomers(r.data?.data || r.data || [])).catch(() => {});
    if (!currentStore?.id) {
      masterService.getAll("stores").then((r) => setStores(r.data?.data || r.data || [])).catch(() => {});
    }
  }, [loadProducts]);

  useStoreRefresh(loadProducts);

  // Group variants by product_id
  const variantsByProduct = useMemo(() => {
    const map = {};
    variants.forEach((v) => {
      if (!map[v.product_id]) map[v.product_id] = [];
      map[v.product_id].push(v);
    });
    return map;
  }, [variants]);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory !== "all") {
      list = list.filter((p) => String(p.category_id) === String(selectedCategory));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q)
      );
    }
    return list.slice(0, 60);
  }, [products, search, selectedCategory]);

  // Cart key: for variants use "productId-variantId", for base product use "productId"
  const makeKey = (productId, variantId = null) => variantId ? `${productId}-v${variantId}` : String(productId);

  const addToCart = (product, variant = null) => {
    const key = makeKey(product.id, variant?.id);
    const name = variant ? `${product.name} — ${variant.variant_name}` : product.name;
    const price = variant ? Number(variant.selling_price) : Number(product.selling_price);
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => i.key === key ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        key, product_id: product.id, product_variant_id: variant?.id || null,
        name, price, quantity: 1,
      }];
    });
    setVariantModal(null);
  };

  const handleProductClick = (product) => {
    const productVariants = variantsByProduct[product.id];
    if (productVariants && productVariants.length > 0) {
      setVariantModal(product);
    } else {
      addToCart(product);
    }
  };

  const updateQty = (key, delta) => {
    setCart((prev) => prev.map((i) => {
      if (i.key !== key) return i;
      return { ...i, quantity: Math.max(1, i.quantity + delta) };
    }));
  };

  const removeFromCart = (key) => setCart((prev) => prev.filter((i) => i.key !== key));

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const grandTotal = Math.max(0, subtotal - Number(discount));

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (!currentStore?.id && !selectedStoreId) { toast.error("Please select a store"); return; }
    setSaving(true);
    const invoiceNo = `POS-${String(invoiceCounter).padStart(4, "0")}`;
    try {
      const payload = {
        invoice_no: invoiceNo,
        customer_id: customerId || null,
        store_id: selectedStoreId || undefined,
        payment_status: "paid",
        sale_status: "completed",
        subtotal,
        discount: Number(discount),
        tax: 0,
        shipping: 0,
        grand_total: grandTotal,
        notes: `POS sale — payment: ${payment}`,
        items: cart.map((i) => ({
          product_id: i.product_id,
          product_variant_id: i.product_variant_id || null,
          quantity: i.quantity,
          price: i.price,
          discount: 0,
          tax: 0,
          total: i.price * i.quantity,
        })),
      };
      await masterService.create("sales", payload);
      toast.success(`Sale ${invoiceNo} completed!`);
      setCart([]);
      setDiscount(0);
      setCustomerId("");
      if (!currentStore?.id) setSelectedStoreId("");
      setInvoiceCounter((c) => c + 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Checkout failed");
    } finally {
      setSaving(false);
    }
  };

  // Distinct categories that have products
  const usedCategoryIds = useMemo(() => new Set(products.map((p) => String(p.category_id)).filter(Boolean)), [products]);
  const visibleCategories = useMemo(() => categories.filter((c) => usedCategoryIds.has(String(c.id))), [categories, usedCategoryIds]);

  return (
    <MainLayout>
      {variantModal && (
        <VariantModal
          product={variantModal}
          variants={variantsByProduct[variantModal.id] || []}
          onSelect={addToCart}
          onClose={() => setVariantModal(null)}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, height: "calc(100vh - 120px)", minHeight: 500 }}>
        {/* PRODUCTS PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
          {/* Search */}
          <div className="srch" style={{ flexShrink: 0 }}>
            <span className="srch-ic"><Search size={13} /></span>
            <input type="text" placeholder="Search by name, SKU, barcode..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Category filter pills */}
          {visibleCategories.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flexShrink: 0 }}>
              <button
                onClick={() => setSelectedCategory("all")}
                style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 500, cursor: "pointer", border: "none",
                  background: selectedCategory === "all" ? "var(--accent)" : "var(--bg3)",
                  color: selectedCategory === "all" ? "#fff" : "var(--tx2)",
                  fontFamily: "var(--font)", transition: "all .15s",
                }}
              >
                All
              </button>
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 500, cursor: "pointer", border: "none",
                    background: selectedCategory === String(cat.id) ? "var(--accent)" : "var(--bg3)",
                    color: selectedCategory === String(cat.id) ? "#fff" : "var(--tx2)",
                    fontFamily: "var(--font)", transition: "all .15s",
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Product grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, overflowY: "auto", paddingRight: 4 }}>
            {filtered.map((p) => {
              const hasVariants = (variantsByProduct[p.id] || []).length > 0;
              const imgSrc = p.image ? `${SERVER_URL}${p.image}` : null;
              return (
                <button key={p.id} onClick={() => handleProductClick(p)}
                  style={{
                    background: "var(--bg2)", border: "1px solid var(--bd)", borderRadius: "var(--r)",
                    padding: 0, cursor: "pointer", textAlign: "center", transition: "border-color 0.15s", overflow: "hidden",
                    display: "flex", flexDirection: "column",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bd)"; }}
                >
                  {/* Product image */}
                  {imgSrc ? (
                    <img src={imgSrc} alt={p.name}
                      style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: 80, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, stroke: "var(--tx3)", fill: "none", strokeWidth: 1.5, strokeLinecap: "round" }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  <div style={{ padding: "8px 8px 10px" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--tx)", marginBottom: 3, lineHeight: 1.3 }}>{p.name}</div>
                    {p.sku && <div style={{ fontSize: 10, color: "var(--tx3)", marginBottom: 3 }}>{p.sku}</div>}
                    {hasVariants ? (
                      <div style={{ fontSize: 10.5, color: "var(--accent)", fontWeight: 500 }}>
                        {(variantsByProduct[p.id] || []).length} variants
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>{Number(p.selling_price).toLocaleString()}</div>
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--tx3)", padding: "24px 0", fontSize: 12 }}>No products found</div>
            )}
          </div>
        </div>

        {/* CART PANEL */}
        <div className="fcard" style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 8 }}>
            <ShoppingCart size={15} style={{ color: "var(--tx3)" }} />
            <strong style={{ fontSize: 13, color: "var(--tx)" }}>Cart</strong>
            {cart.length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 11, background: "var(--accent)", color: "#fff", borderRadius: 99, padding: "1px 7px", fontWeight: 600 }}>
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>

          {/* Cart items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--tx3)", padding: "32px 0", fontSize: 12 }}>Cart is empty</div>
            ) : cart.map((item) => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--bd)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tx)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "var(--green)", marginTop: 1 }}>{item.price.toLocaleString()} × {item.quantity}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <button className="hbtn" style={{ width: 22, height: 22, fontSize: 14 }} onClick={() => updateQty(item.key, -1)}><Minus size={11} /></button>
                  <span style={{ fontSize: 12, width: 20, textAlign: "center", color: "var(--tx)" }}>{item.quantity}</span>
                  <button className="hbtn" style={{ width: 22, height: 22, fontSize: 14 }} onClick={() => updateQty(item.key, 1)}><Plus size={11} /></button>
                  <button className="hbtn" style={{ width: 22, height: 22, color: "var(--red)", marginLeft: 2 }} onClick={() => removeFromCart(item.key)}><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart footer */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--bd)", display: "flex", flexDirection: "column", gap: 10 }}>
            {currentStore?.id == null && stores.length > 0 && (
              <div className="fg" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, color: "var(--tx3)" }}>Store <span style={{ color: "var(--red)" }}>*</span></label>
                <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} style={inlineInput}>
                  <option value="">Select store...</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div className="fg" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: "var(--tx3)" }}>Customer</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={inlineInput}>
                <option value="">Walk-in</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="fg" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, color: "var(--tx3)" }}>Discount</label>
                <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} style={inlineInput} placeholder="0.00" />
              </div>
              <div className="fg" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, color: "var(--tx3)" }}>Payment</label>
                <select value={payment} onChange={(e) => setPayment(e.target.value)} style={inlineInput}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--tx2)" }}>
              <span>Subtotal</span><span>{subtotal.toLocaleString()}</span>
            </div>
            {Number(discount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--tx2)" }}>
                <span>Discount</span><span style={{ color: "var(--red)" }}>-{Number(discount).toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "var(--tx)" }}>
              <span>Total</span><span style={{ color: "var(--green)" }}>{grandTotal.toLocaleString()}</span>
            </div>
            <Button variant="primary" disabled={saving || cart.length === 0} onClick={handleCheckout}
              style={{ width: "100%", justifyContent: "center", fontSize: 13 }}>
              {saving ? "Processing..." : "Checkout"}
            </Button>
            {cart.length > 0 && (
              <button onClick={() => { setCart([]); setDiscount(0); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--tx3)", textAlign: "center" }}>
                Clear cart
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
