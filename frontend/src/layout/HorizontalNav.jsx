import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../services/userService";

export default function HorizontalNav() {
  const location = useLocation();
  const { user, hasPermission, logout } = useAuth();
  const [openDrop, setOpenDrop] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userLimit, setUserLimit] = useState(null);
  const navRef = useRef(null);

  const isActive = (...paths) => paths.some((p) => (p === "/" ? location.pathname === "/" : location.pathname.startsWith(p)));

  const toggleDrop = (id) => setOpenDrop((prev) => (prev === id ? null : id));

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenDrop(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpenDrop(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    const loadUserLimit = async () => {
      try {
        const data = await getUsers();
        if (!mounted) return;
        setUserLimit({
          maxUsers: data?.maxUsers ?? null,
          currentCount: data?.currentCount ?? data?.users?.length ?? 0,
        });
      } catch {
        if (mounted) setUserLimit(null);
      }
    };

    loadUserLimit();
    return () => {
      mounted = false;
    };
  }, []);

  const DropItem = ({ to, label }) => (
    <Link to={to} className={`hn-drop-item ${location.pathname === to ? "active" : ""}`} onClick={() => setOpenDrop(null)}>
      <span>{label}</span>
    </Link>
  );

  const MpItem = ({ to, label }) => (
    <Link to={to} className={`hn-mp-item ${location.pathname === to ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
      {label}
    </Link>
  );

  const isUserLimitReached = userLimit?.maxUsers != null && userLimit.currentCount >= userLimit.maxUsers;

  return (
    <div id="hnavWrap" ref={navRef} style={{ position: "relative", flexShrink: 0, zIndex: 20 }}>
      <div className="hnav">
        {/* ── DESKTOP ITEMS WRAP ── */}
        <div className="hn-items-wrap">
          {/* Dashboard */}
          <Link to="/" className={`hn-item ${location.pathname === "/" ? "active" : ""}`}>
            <span className="hn-label">Dashboard</span>
          </Link>

          {/* POS */}
          <Link to="/pos" className={`hn-item ${isActive("/pos") ? "active" : ""}`}>
            <span className="hn-label">POS</span>
          </Link>

          <div className="hn-div" />

          {/* SALES dropdown */}
          <div className={`hn-item has-drop ${openDrop === "sales" ? "open" : ""} ${isActive("/sales", "/expenses") ? "active" : ""}`} onClick={() => toggleDrop("sales")}>
            <span className="hn-label">Sales</span>
            <svg className="hn-arr" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <div className="hn-dropdown" style={{ display: openDrop === "sales" ? "block" : "none" }}>
              <div className="hn-drop-section">Sales</div>
              <DropItem to="/sales" label="All Sales" />
              <DropItem to="/sales/create" label="New Sale" />
              <div className="hn-drop-divider" />
              <div className="hn-drop-section">Expenses</div>
              <DropItem to="/expenses" label="Expenses" />
            </div>
          </div>

          {/* PURCHASES dropdown */}
          <div className={`hn-item has-drop ${openDrop === "purchases" ? "open" : ""} ${isActive("/purchases") ? "active" : ""}`} onClick={() => toggleDrop("purchases")}>
            <span className="hn-label">Purchases</span>
            <svg className="hn-arr" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <div className="hn-dropdown" style={{ display: openDrop === "purchases" ? "block" : "none" }}>
              <DropItem to="/purchases" label="All Purchases" />
              <DropItem to="/purchases/create" label="New Purchase" />
            </div>
          </div>

          <div className="hn-div" />

          {/* INVENTORY dropdown */}
          <div className={`hn-item has-drop ${openDrop === "inventory" ? "open" : ""} ${isActive("/products", "/inventory") ? "active" : ""}`} onClick={() => toggleDrop("inventory")}>
            <span className="hn-label">Inventory</span>
            <svg className="hn-arr" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <div className="hn-dropdown" style={{ display: openDrop === "inventory" ? "block" : "none" }}>
              <div className="hn-drop-section">Products</div>
              <DropItem to="/products" label="Product List" />
              <DropItem to="/products/create" label="Add Product" />
              <div className="hn-drop-divider" />
              <div className="hn-drop-section">Stock</div>
              <DropItem to="/inventory/stock-movements" label="Stock Movements" />
            </div>
          </div>

          {/* MASTER DATA dropdown */}
          <div className={`hn-item has-drop ${openDrop === "master" ? "open" : ""} ${isActive("/customers", "/suppliers", "/categories", "/brands", "/units", "/taxes", "/expense-categories") ? "active" : ""}`} onClick={() => toggleDrop("master")}>
            <span className="hn-label">Master Data</span>
            <svg className="hn-arr" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <div className="hn-dropdown" style={{ minWidth: 210, display: openDrop === "master" ? "block" : "none" }}>
              <div className="hn-drop-section">People</div>
              <DropItem to="/customers" label="Customers" />
              <DropItem to="/suppliers" label="Suppliers" />
              <div className="hn-drop-divider" />
              <div className="hn-drop-section">Catalog</div>
              <DropItem to="/categories" label="Categories" />
              <DropItem to="/brands" label="Brands" />
              <DropItem to="/units" label="Units" />
              <DropItem to="/taxes" label="Taxes" />
              <DropItem to="/expense-categories" label="Expense Categories" />
            </div>
          </div>

          {/* RESTAURANT dropdown */}
          <div className={`hn-item has-drop ${openDrop === "restaurant" ? "open" : ""} ${isActive("/restaurant") ? "active" : ""}`} onClick={() => toggleDrop("restaurant")}>
            <span className="hn-label">Restaurant</span>
            <svg className="hn-arr" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <div className="hn-dropdown" style={{ display: openDrop === "restaurant" ? "block" : "none" }}>
              <DropItem to="/restaurant/tables" label="Tables" />
            </div>
          </div>

          <div className="hn-div" />

          {/* REPORTS */}
          <Link to="/reports" className={`hn-item ${isActive("/reports") ? "active" : ""}`}>
            <span className="hn-label">Reports</span>
          </Link>

          {/* ADMIN dropdown */}
          {(user?.isSuperAdmin || hasPermission("stores.view") || hasPermission("roles.view") || hasPermission("users.view")) && (
            <div className={`hn-item has-drop ${openDrop === "admin" ? "open" : ""} ${isActive("/stores", "/roles", "/users") ? "active" : ""}`} onClick={() => toggleDrop("admin")}>
              <span className="hn-label">Admin</span>
              <svg className="hn-arr" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <div className="hn-dropdown" style={{ minWidth: 200, display: openDrop === "admin" ? "block" : "none" }}>
                {hasPermission("stores.view") && (
                  <>
                    <div className="hn-drop-section">Stores</div>
                    <DropItem to="/stores" label="All Stores" />
                  </>
                )}
                {hasPermission("roles.view") && (
                  <>
                    <div className="hn-drop-divider" />
                    <div className="hn-drop-section">Roles</div>
                    <DropItem to="/roles" label="All Roles" />
                    <DropItem to="/roles/permissions" label="Permissions" />
                  </>
                )}
                {hasPermission("users.view") && (
                  <>
                    <div className="hn-drop-divider" />
                    <div className="hn-drop-section">Users</div>
                    <DropItem to="/users" label="All Users" />
                    {isUserLimitReached ? (
                      <Link to="/billing" className="hn-drop-item" onClick={() => setOpenDrop(null)}>
                        <span>Upgrade Plan for More Users</span>
                      </Link>
                    ) : (
                      <DropItem to="/users/create" label="Create User" />
                    )}
                    <DropItem to="/users/stores" label="User Stores" />
                  </>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          <Link to="/settings" className={`hn-item ${isActive("/settings") ? "active" : ""}`}>
            <span className="hn-label">Settings</span>
          </Link>
        </div>

        {/* ── MOBILE TOGGLE ── */}
        <button className="hn-mobile-toggle" onClick={() => setMobileOpen((p) => !p)} style={{ background: mobileOpen ? "var(--abg)" : undefined, borderColor: mobileOpen ? "var(--accent)" : undefined, color: mobileOpen ? "var(--accent)" : undefined }}>
          <svg viewBox="0 0 24 24">
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
          Menu
        </button>
      </div>

      {/* ── MOBILE FULL-SCREEN PANEL ── */}
      <div className={`hn-mobile-panel ${mobileOpen ? "open" : ""}`}>
        <div className="hn-mp-section">Main</div>
        <MpItem to="/" label="Dashboard" />
        <MpItem to="/pos" label="POS Terminal" />

        <div className="hn-mp-section">Sales</div>
        <MpItem to="/sales" label="Sales" />
        <MpItem to="/sales/create" label="New Sale" />
        <MpItem to="/expenses" label="Expenses" />

        <div className="hn-mp-section">Purchases</div>
        <MpItem to="/purchases" label="Purchases" />
        <MpItem to="/purchases/create" label="New Purchase" />

        <div className="hn-mp-section">Inventory</div>
        <MpItem to="/products" label="Products" />
        <MpItem to="/products/create" label="Add Product" />
        <MpItem to="/inventory/stock-movements" label="Stock Movements" />

        <div className="hn-mp-section">Master Data</div>
        <MpItem to="/customers" label="Customers" />
        <MpItem to="/suppliers" label="Suppliers" />
        <MpItem to="/categories" label="Categories" />
        <MpItem to="/brands" label="Brands" />
        <MpItem to="/units" label="Units" />
        <MpItem to="/taxes" label="Taxes" />
        <MpItem to="/expense-categories" label="Expense Categories" />

        <div className="hn-mp-section">Restaurant</div>
        <MpItem to="/restaurant/tables" label="Tables" />

        <div className="hn-mp-section">Reports & Settings</div>
        <MpItem to="/reports" label="Reports" />
        <MpItem to="/settings" label="Settings" />

        {(hasPermission("stores.view") || hasPermission("roles.view") || hasPermission("users.view")) && (
          <>
            <div className="hn-mp-section">Admin</div>
            {hasPermission("stores.view") && <MpItem to="/stores" label="Stores" />}
            {hasPermission("roles.view") && (
              <>
                <MpItem to="/roles" label="Roles" />
                <MpItem to="/roles/permissions" label="Permissions" />
              </>
            )}
            {hasPermission("users.view") && (
              <>
                <MpItem to="/users" label="Users" />
                {isUserLimitReached ? (
                  <Link to="/billing" className="hn-mp-item" onClick={() => setMobileOpen(false)}>
                    Upgrade Plan
                  </Link>
                ) : (
                  <MpItem to="/users/create" label="Create User" />
                )}
                <MpItem to="/users/stores" label="User Stores" />
              </>
            )}
          </>
        )}

        <div style={{ padding: "8px 10px 16px" }}>
          <button
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
            style={{ width: "100%", padding: "9px", background: "var(--rbg)", border: "1px solid var(--bd)", borderRadius: "var(--r)", color: "var(--red)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)" }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
