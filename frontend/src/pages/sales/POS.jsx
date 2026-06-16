import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Minus, Trash2, X, Layers, Tag, ChevronUp, Banknote, CreditCard, Smartphone, MoreHorizontal, User, ArrowRight, Pause, RotateCcw, ShoppingCart } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import toast from "react-hot-toast";
import productService from "../../services/productService";
import masterService from "../../services/masterService";
import useStoreRefresh from "../../hooks/useStoreRefresh";
import { useAuth } from "../../context/AuthContext";

const SERVER_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

function useWindowWidth() {
  const [width, setWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1280));
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return width;
}

function VariantModal({ product, variants, onSelect, onClose }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl border border-stone-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <p className="text-sm font-bold text-stone-800">{product.name}</p>
            <p className="text-xs text-stone-400 mt-0.5">Select a variant</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors">
            <X size={13} />
          </button>
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {variants.length === 0 ? (
            <p className="text-center text-stone-400 py-8 text-xs">No variants available</p>
          ) : (
            variants.map((v) => (
              <button key={v.id} onClick={() => onSelect(product, v)} className="flex items-center justify-between w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-left hover:border-amber-400 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{v.variant_name}</p>
                  {v.stock_quantity != null && <span className={`text-[10.5px] font-semibold mt-0.5 block ${v.stock_quantity > 0 ? "text-emerald-600" : "text-red-500"}`}>{v.stock_quantity > 0 ? `${v.stock_quantity} in stock` : "Out of stock"}</span>}
                </div>
                <span className="text-sm font-bold text-stone-800 ml-4">{Number(v.selling_price).toLocaleString()}</span>
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
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

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
  const [cartOpen, setCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  const loadProducts = useCallback(() => {
    productService
      .getAll()
      .then((r) => setProducts(r.data?.data || r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
    masterService
      .getAll("categories")
      .then((r) => setCategories(r.data?.data || r.data || []))
      .catch(() => {});
    masterService
      .getAll("product-variants")
      .then((r) => setVariants(r.data?.data || r.data || []))
      .catch(() => {});
    masterService
      .getAll("customers")
      .then((r) => setCustomers(r.data?.data || r.data || []))
      .catch(() => {});
    if (!currentStore?.id)
      masterService
        .getAll("stores")
        .then((r) => setStores(r.data?.data || r.data || []))
        .catch(() => {});
  }, [loadProducts]);

  useStoreRefresh(loadProducts);

  const currencySymbol = useMemo(() => {
    const cur = currentStore?.currency || stores.find((s) => s.id === selectedStoreId)?.currency || "PKR";
    return { PKR: "Rs", USD: "$", SAR: "SR", EUR: "€", GBP: "£", AED: "AED" }[cur] ?? cur;
  }, [currentStore, stores, selectedStoreId]);

  const variantsByProduct = useMemo(() => {
    const map = {};
    variants.forEach((v) => {
      if (!map[v.product_id]) map[v.product_id] = [];
      map[v.product_id].push(v);
    });
    return map;
  }, [variants]);

  const categoryCounts = useMemo(() => {
    const map = { all: products.length };
    products.forEach((p) => {
      if (p.category_id) map[String(p.category_id)] = (map[String(p.category_id)] || 0) + 1;
    });
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory !== "all") list = list.filter((p) => String(p.category_id) === String(selectedCategory));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || (p.barcode || "").toLowerCase().includes(q));
    }
    return list.slice(0, 60);
  }, [products, search, selectedCategory]);

  const usedCategoryIds = useMemo(() => new Set(products.map((p) => String(p.category_id)).filter(Boolean)), [products]);
  const visibleCategories = useMemo(() => categories.filter((c) => usedCategoryIds.has(String(c.id))), [categories, usedCategoryIds]);

  const makeKey = (productId, variantId = null) => (variantId ? `${productId}-v${variantId}` : String(productId));

  const addToCart = (product, variant = null) => {
    const key = makeKey(product.id, variant?.id);
    const name = variant ? `${product.name} — ${variant.variant_name}` : product.name;
    const price = variant ? Number(variant.selling_price) : Number(product.selling_price);
    const taxRate = Number(product.tax?.rate || 0);
    const image = product.image || null;
    setCart((prev) => {
      const ex = prev.find((i) => i.key === key);
      if (ex) return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { key, product_id: product.id, product_variant_id: variant?.id || null, name, price, taxRate, quantity: 1, image }];
    });
    setVariantModal(null);
  };

  const handleProductClick = (product) => {
    const pv = variantsByProduct[product.id];
    if (pv && pv.length > 0) setVariantModal(product);
    else addToCart(product);
  };

  const updateQty = (key, delta) => setCart((prev) => prev.map((i) => (i.key !== key ? i : { ...i, quantity: i.quantity + delta })).filter((i) => i.quantity > 0));

  const removeFromCart = (key) => setCart((prev) => prev.filter((i) => i.key !== key));

  const resetOrder = () => {
    setCart([]);
    setDiscount(0);
    setCouponCode("");
    setCouponDiscount(0);
    setCustomerId("");
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = cart.reduce((s, i) => s + (i.price * i.quantity * (i.taxRate || 0)) / 100, 0);
  const totalDiscount = Number(discount) + couponDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount + taxAmount);
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const invoiceNo = `POS-${String(invoiceCounter).padStart(4, "0")}`;

  const applyCoupon = () => {
    const c = couponCode.trim().toUpperCase();
    if (c === "SAVE10") {
      setCouponDiscount(subtotal * 0.1);
      toast.success("10% coupon applied!");
    } else {
      setCouponDiscount(0);
      toast.error("Invalid coupon code");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!currentStore?.id && !selectedStoreId) {
      toast.error("Please select a store");
      return;
    }
    setSaving(true);
    try {
      await masterService.create("sales", {
        invoice_no: invoiceNo,
        customer_id: customerId || null,
        store_id: selectedStoreId || undefined,
        payment_status: "paid",
        sale_status: "completed",
        subtotal,
        discount: totalDiscount,
        tax: taxAmount,
        shipping: 0,
        grand_total: grandTotal,
        notes: `POS sale — payment: ${payment}`,
        items: cart.map((i) => ({
          product_id: i.product_id,
          product_variant_id: i.product_variant_id || null,
          quantity: i.quantity,
          price: i.price,
          discount: 0,
          tax: (i.price * i.quantity * (i.taxRate || 0)) / 100,
          total: i.price * i.quantity,
        })),
      });
      toast.success(`Sale ${invoiceNo} completed!`);
      resetOrder();
      setCartOpen(false);
      if (!currentStore?.id) setSelectedStoreId("");
      setInvoiceCounter((c) => c + 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Checkout failed");
    } finally {
      setSaving(false);
    }
  };

  const payMethods = [
    { label: "Quick Cash", Icon: Banknote, method: "cash" },
    { label: "Card", Icon: CreditCard, method: "card" },
    { label: "UPI / Online", Icon: Smartphone, method: "online" },
    { label: "More", Icon: MoreHorizontal, method: null },
  ];

  // ── CHANGE 2: Product card — clicking anywhere on card adds to cart, no + button ──
  const renderCard = (p) => {
    const hasVariants = (variantsByProduct[p.id] || []).length > 0;
    const variantCount = variantsByProduct[p.id]?.length || 0;
    const imgSrc = p.image ? `${SERVER_URL}${p.image}` : null;
    const minPrice = hasVariants ? Math.min(...(variantsByProduct[p.id] || []).map((v) => Number(v.selling_price))) : Number(p.selling_price);
    const cartItem = !hasVariants ? cart.find((i) => i.key === makeKey(p.id)) : null;
    const qty = cartItem?.quantity || 0;

    return (
      <div key={p.id} className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden flex flex-col cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-stone-300 transition-all duration-150 select-none" onClick={() => handleProductClick(p)}>
        {/* Square image */}
        <div className="relative w-full aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
          {hasVariants && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-amber-500 text-white text-[9px] font-bold rounded-full px-2 py-0.5">
              <Layers size={7} />
              {variantCount}
            </div>
          )}
          {qty > 0 && !hasVariants && <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-stone-800 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{qty}</div>}
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={p.name}
              className="w-4/5 h-4/5 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <Tag size={isMobile ? 22 : 28} className="text-stone-300" />
          )}
        </div>

        {/* Footer — qty controls if in cart, otherwise just name + price */}
        <div className="px-3 pt-2.5 pb-3">
          <p className="text-xs font-semibold text-stone-700 truncate leading-snug mb-2">{p.name}</p>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-sm font-bold text-stone-800">
              {currencySymbol} {minPrice.toLocaleString()}
            </span>
            {qty > 0 && !hasVariants ? (
              /* inline qty stepper when item is in cart */
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button className="w-[22px] h-[22px] rounded-md bg-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-300 transition-colors" onClick={() => updateQty(makeKey(p.id), -1)}>
                  <Minus size={9} />
                </button>
                <span className="text-xs font-bold text-stone-800 w-4 text-center">{qty}</span>
                <button className="w-[22px] h-[22px] rounded-md bg-stone-800 flex items-center justify-center text-white hover:bg-stone-700 transition-colors" onClick={() => addToCart(p)}>
                  <Plus size={9} />
                </button>
              </div>
            ) : (
              /* No + button — the whole card is clickable */
              <div className="w-2 h-2 rounded-full bg-stone-300" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Cart Panel ──
  // Key layout fix: use absolute positioning for the fixed footer so the
  // scrollable cart area always has a deterministic height and is never
  // crushed by footer content growing taller than expected.
  const CartPanel = (
    <div className="relative flex flex-col" style={{ height: "100%" }}>
      {/* ── TOP: fixed header + customer row (flex-shrink-0) ── */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100">
          {isMobile && (
            <button className="mr-2 text-stone-400 hover:text-stone-600" onClick={() => setCartOpen(false)}>
              <ChevronUp size={16} />
            </button>
          )}
          <div>
            <p className="text-sm font-bold text-stone-800">Order Details</p>
            <p className="text-[11px] text-stone-400 mt-0.5">{invoiceNo}</p>
          </div>
          <button onClick={resetOrder} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-[11px] font-semibold text-stone-600 transition-colors">
            <RotateCcw size={10} /> Reset Order
          </button>
        </div>

        {/* Customer / Store */}
        <div className="px-4 py-2.5 border-b border-stone-100 flex gap-2 items-center">
          {currentStore?.id == null && stores.length > 0 && (
            <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 outline-none focus:border-amber-400">
              <option value="">Store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 outline-none focus:border-amber-400">
            <option value="">Walk-in customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center flex-shrink-0 text-stone-400">
            <User size={14} />
          </div>
        </div>
      </div>

      {/* ── MIDDLE: scrollable cart items ── */}
      {/* Uses a fixed min/max height so it always has visible space regardless of footer size */}
      <div className="overflow-y-auto border-b border-stone-100" style={{ minHeight: 120, maxHeight: 280 }}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-stone-300">
            <ShoppingCart size={28} className="mb-2 opacity-25" />
            <p className="text-xs font-medium text-stone-400">No items added yet</p>
            <p className="text-[11px] text-stone-300 mt-0.5">Tap a product to add it</p>
          </div>
        ) : (
          cart.map((item) => {
            const imgSrc = item.image ? `${SERVER_URL}${item.image}` : null;
            return (
              <div key={item.key} className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 hover:bg-stone-50/60 transition-colors">
                {/* Thumbnail */}
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">{imgSrc ? <img src={imgSrc} alt={item.name} className="w-[85%] h-[85%] object-contain" /> : <Tag size={12} className="text-stone-300" />}</div>

                {/* Info + qty */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-stone-800 truncate leading-tight">{item.name}</p>
                  <p className="text-[10.5px] text-stone-400 mt-0.5">
                    {currencySymbol} {item.price.toLocaleString()} each
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button className="w-5 h-5 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors" onClick={() => updateQty(item.key, -1)}>
                      <Minus size={8} />
                    </button>
                    <span className="text-xs font-bold text-stone-800 w-5 text-center">{item.quantity}</span>
                    <button className="w-5 h-5 rounded-md bg-stone-800 flex items-center justify-center text-white hover:bg-stone-700 transition-colors" onClick={() => updateQty(item.key, 1)}>
                      <Plus size={8} />
                    </button>
                  </div>
                </div>

                {/* Line total + delete */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-[12px] font-bold text-stone-800">
                    {currencySymbol} {(item.price * item.quantity).toLocaleString()}
                  </span>
                  <button className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors" onClick={() => removeFromCart(item.key)}>
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── BOTTOM: payment methods + coupon + totals + action buttons ── */}
      {/* This section is also scrollable if viewport is very short */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Payment method buttons */}
        <div className="grid grid-cols-4 gap-1.5 px-3 pt-3 pb-2.5">
          {payMethods.map(({ label, Icon, method }) => {
            const active = method && payment === method;
            return (
              <button
                key={label}
                onClick={() => (method ? setPayment(method) : toast("More payment options coming soon"))}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-center transition-all duration-150 ${active ? "bg-stone-800 border-stone-800" : "bg-stone-50 border-stone-200 hover:border-stone-300"}`}
              >
                <Icon size={13} className={active ? "text-white" : "text-stone-400"} />
                <span className={`text-[9.5px] font-semibold leading-tight ${active ? "text-white" : "text-stone-500"}`}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Coupon */}
        <div className="px-3 pb-2.5 flex gap-2">
          <input
            type="text"
            placeholder="Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
            className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-700 outline-none focus:border-amber-400 placeholder:text-stone-300"
          />
          <button onClick={applyCoupon} className="px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 transition-colors whitespace-nowrap">
            Apply
          </button>
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-t border-stone-100 space-y-2">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Sub Total</span>
            <span className="font-medium text-stone-700">
              {currencySymbol} {subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-xs text-stone-500">Discount</span>
            <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-24 text-right text-xs bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-700 outline-none focus:border-amber-400" placeholder="0" />
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-xs text-red-500">
              <span>Coupon</span>
              <span>
                −{currencySymbol} {couponDiscount.toFixed(0)}
              </span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-xs text-stone-500">
              <span>Tax</span>
              <span className="font-medium text-stone-700">
                {currencySymbol} {taxAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-stone-100">
            <span className="text-sm font-bold text-stone-800">Total Payment</span>
            <span className="text-sm font-bold text-stone-800">
              {currencySymbol} {grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Hold + Pay Now */}
        <div className="px-3 pb-4 pt-1 space-y-2">
          <button
            onClick={() => {
              if (!cart.length) return;
              setCart([]);
              setDiscount(0);
              setCouponCode("");
              setCouponDiscount(0);
              toast("Order on hold");
            }}
            className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 flex items-center justify-center gap-2 transition-colors"
          >
            <Pause size={12} /> Hold Order
          </button>
          <button
            onClick={handleCheckout}
            disabled={saving || cart.length === 0}
            className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-between px-4 transition-all ${cart.length === 0 || saving ? "bg-stone-200 text-stone-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-sm"}`}
          >
            <span>{saving ? "Processing…" : "Pay Now"}</span>
            <span className="flex items-center gap-1.5 font-extrabold">
              {currencySymbol} {grandTotal.toFixed(2)}
              <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout forceSidebarClosed>
      {variantModal && <VariantModal product={variantModal} variants={variantsByProduct[variantModal.id] || []} onSelect={addToCart} onClose={() => setVariantModal(null)} />}

      {/* Mobile cart drawer */}
      {isMobile && cartOpen && (
        <div className="fixed inset-0 z-[150] flex flex-col justify-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-2xl border-t border-stone-100 h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-1 rounded-full bg-stone-200" />
            </div>
            {CartPanel}
          </div>
        </div>
      )}

      {/* Main 2-col layout */}
      <div className={`grid gap-3.5 ${isMobile ? "grid-cols-1" : "grid-cols-[1fr_340px]"}`} style={{ height: isMobile ? "calc(100vh - 110px)" : "calc(100vh - 120px)", minHeight: 400 }}>
        {/* ── LEFT: Products — CHANGE 4: scrollable ── */}
        <div className="flex flex-col gap-3 overflow-hidden">
          {/* Category tabs — fixed, horizontally scrollable */}
          <div className="flex gap-2 overflow-x-auto flex-shrink-0 pb-0.5 scrollbar-none">
            {[{ id: "all", name: "All" }, ...visibleCategories].map((cat) => {
              const active = selectedCategory === String(cat.id);
              const count = categoryCounts[String(cat.id)] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-150 border ${
                    active ? "bg-stone-800 text-white border-stone-800" : "bg-transparent border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700"
                  }`}
                >
                  {cat.name}
                  <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${active ? "bg-white/20 text-white" : "bg-stone-100 text-stone-400"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search — fixed */}
          <div className="relative flex-shrink-0">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by name, SKU or barcode…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2.5 text-stone-700 outline-none focus:border-stone-400 placeholder:text-stone-300 transition-colors"
            />
          </div>

          {/* Product grid — CHANGE 4: this scrolls vertically */}
          <div
            className={`grid gap-2.5 flex-1 min-h-0 overflow-y-auto content-start ${isMobile ? "pb-20" : "pb-2"}`}
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 130 : isTablet ? 145 : 155}px, 1fr))`,
            }}
          >
            {filtered.map(renderCard)}
            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-14 text-stone-300">
                <Search size={28} className="opacity-20 mb-3" />
                <p className="text-sm text-stone-400">No products found</p>
              </div>
            )}
          </div>
          {/* CHANGE 1: payment bar removed from here */}
        </div>

        {/* ── RIGHT: Cart sidebar ── */}
        {!isMobile && <div className="bg-white border border-stone-200 rounded-2xl overflow-y-auto flex flex-col">{CartPanel}</div>}
      </div>

      {/* Mobile FAB */}
      {isMobile && !cartOpen && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-5 right-4 z-[140] flex items-center gap-2 bg-stone-800 text-white rounded-full px-5 py-3 text-sm font-bold shadow-lg hover:bg-stone-700 transition-colors">
          <ShoppingCart size={15} />
          {cartItemCount > 0 ? (
            <>
              <span>{cartItemCount} items</span>
              <span className="opacity-60 text-xs">
                {currencySymbol} {grandTotal.toFixed(0)}
              </span>
            </>
          ) : (
            <span>Cart</span>
          )}
        </button>
      )}
    </MainLayout>
  );
}
