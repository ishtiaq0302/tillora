import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  LayoutDashboard, ShoppingCart, Receipt, TrendingDown, Package,
  ClipboardList, Shuffle, Banknote, User, Factory, FolderOpen,
  UtensilsCrossed, BarChart2, Store, ShieldCheck, Users, Globe,
  Settings, LogOut, CreditCard,
} from "lucide-react";

const NavItem = ({ to, icon, label, location, exact = false }) => {
  const active =
    exact || to === "/"
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(to + "/");
  return (
    <Link to={to} className={`ni ${active ? "active" : ""}`}>
      <div className="nic">{icon}</div>
      <span className="nl">{label}</span>
    </Link>
  );
};

const NavSection = ({ label }) => <div className="ns">{label}</div>;

const SubMenu = ({ icon, label, openKey, openSubs, toggleSub, children, location, paths = [] }) => {
  const isActive = paths.some((p) => location.pathname.startsWith(p));
  const isOpen = !!openSubs[openKey];
  return (
    <>
      <div className={`ni ${isActive ? "active" : ""}`} onClick={() => toggleSub(openKey)}>
        <div className="nic">{icon}</div>
        <span className="nl">{label}</span>
        <div className="carr" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
          <svg className="hn-arr" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      {isOpen && <div className="submenu-group">{children}</div>}
    </>
  );
};

const SubLink = ({ to, label, location }) => (
  <Link to={to} className={`si ${location.pathname === to ? "active" : ""}`}>
    <span className="sdot"></span>
    {label}
  </Link>
);

const Sidebar = ({ sidebarOpen }) => {
  const location = useLocation();
  const { logout, hasPermission } = useAuth();
  const { t } = useLanguage();
  const [openSubs, setOpenSubs] = useState({});

  const toggleSub = (key) =>
    setOpenSubs((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <div className={`sbar ${sidebarOpen ? "" : "closed"}`} id="sbar">
        {/* MAIN */}
        <NavSection label={t("main", "nav")} />
        <NavItem to="/" icon={<LayoutDashboard size={18} />} label={t("dashboard", "nav")} location={location} exact />
        <NavItem to="/pos" icon={<ShoppingCart size={18} />} label={t("pos_terminal", "nav")} location={location} />

        {/* SALES */}
        <NavSection label={t("sales_section", "nav")} />
        <NavItem to="/sales" icon={<Receipt size={18} />} label={t("sales", "nav")} location={location} exact />
        <NavItem to="/expenses" icon={<TrendingDown size={18} />} label={t("expenses", "nav")} location={location} exact />

        {/* PURCHASES */}
        <NavSection label={t("purchases_section", "nav")} />
        <NavItem to="/purchases" icon={<Package size={18} />} label={t("purchases", "nav")} location={location} exact />

        {/* INVENTORY */}
        <NavSection label={t("inventory_section", "nav")} />
        <SubMenu
          icon={<ClipboardList size={18} />}
          label={t("products", "nav")}
          openKey="products"
          openSubs={openSubs}
          toggleSub={toggleSub}
          location={location}
          paths={["/products"]}
        >
          <SubLink to="/products" label={t("product_list", "nav")} location={location} />
          <SubLink to="/products/create" label={t("add_product", "nav")} location={location} />
        </SubMenu>
        <SubMenu
          icon={<Package size={18} />}
          label={t("inventory", "nav")}
          openKey="inventory"
          openSubs={openSubs}
          toggleSub={toggleSub}
          location={location}
          paths={["/inventory"]}
        >
          <SubLink to="/inventory/stock-movements" label={t("stock_movements", "nav")} location={location} />
          <SubLink to="/inventory/store-products" label={t("store_inventory", "nav")} location={location} />
        </SubMenu>
        <SubMenu
          icon={<Shuffle size={18} />}
          label={t("variants_batches", "nav")}
          openKey="variants"
          openSubs={openSubs}
          toggleSub={toggleSub}
          location={location}
          paths={["/products/variants", "/products/batches", "/products/attribute-values"]}
        >
          <SubLink to="/products/variants" label={t("product_variants", "nav")} location={location} />
          <SubLink to="/products/batches" label={t("product_batches", "nav")} location={location} />
          <SubLink to="/products/attribute-values" label={t("attribute_values", "nav")} location={location} />
        </SubMenu>
        <NavItem to="/cash-registers" icon={<Banknote size={18} />} label={t("cash_registers", "nav")} location={location} />

        {/* MASTER DATA */}
        <NavSection label={t("master_data", "nav")} />
        <NavItem to="/customers" icon={<User size={18} />} label={t("customers", "nav")} location={location} />
        <NavItem to="/suppliers" icon={<Factory size={18} />} label={t("suppliers", "nav")} location={location} />
        <SubMenu
          icon={<FolderOpen size={18} />}
          label={t("catalog", "nav")}
          openKey="catalog"
          openSubs={openSubs}
          toggleSub={toggleSub}
          location={location}
          paths={["/categories", "/brands", "/units", "/taxes", "/expense-categories", "/master/attributes"]}
        >
          <SubLink to="/categories" label={t("categories", "nav")} location={location} />
          <SubLink to="/brands" label={t("brands", "nav")} location={location} />
          <SubLink to="/units" label={t("units", "nav")} location={location} />
          <SubLink to="/taxes" label={t("taxes", "nav")} location={location} />
          <SubLink to="/expense-categories" label={t("expense_categories", "nav")} location={location} />
          <SubLink to="/master/attributes" label={t("attributes", "nav")} location={location} />
        </SubMenu>

        {/* RESTAURANT */}
        <NavSection label={t("restaurant", "nav")} />
        <NavItem to="/restaurant/tables" icon={<UtensilsCrossed size={18} />} label={t("tables", "nav")} location={location} />

        {/* REPORTS */}
        <NavSection label={t("reports_section", "nav")} />
        <NavItem to="/reports" icon={<BarChart2 size={18} />} label={t("reports", "nav")} location={location} />

        {/* ADMIN */}
        {(hasPermission("stores.view") || hasPermission("roles.view") || hasPermission("users.view")) && (
          <>
            <NavSection label={t("admin", "nav")} />
            {hasPermission("stores.view") && (
              <NavItem to="/stores" icon={<Store size={18} />} label={t("stores", "nav")} location={location} />
            )}
            {hasPermission("roles.view") && (
              <SubMenu
                icon={<ShieldCheck size={18} />}
                label={t("roles", "nav")}
                openKey="roles"
                openSubs={openSubs}
                toggleSub={toggleSub}
                location={location}
                paths={["/roles"]}
              >
                <SubLink to="/roles" label={t("all_roles", "nav")} location={location} />
                <SubLink to="/roles/create" label={t("create_role", "nav")} location={location} />
                <SubLink to="/roles/permissions" label={t("permissions", "nav")} location={location} />
              </SubMenu>
            )}
            {hasPermission("users.view") && (
              <SubMenu
                icon={<Users size={18} />}
                label={t("users", "nav")}
                openKey="users"
                openSubs={openSubs}
                toggleSub={toggleSub}
                location={location}
                paths={["/users"]}
              >
                <SubLink to="/users" label={t("all_users", "nav")} location={location} />
                <SubLink to="/users/create" label={t("create_user", "nav")} location={location} />
                <SubLink to="/users/stores" label={t("user_stores", "nav")} location={location} />
              </SubMenu>
            )}
            <SubMenu
              icon={<Globe size={18} />}
              label={t("system", "nav")}
              openKey="system"
              openSubs={openSubs}
              toggleSub={toggleSub}
              location={location}
              paths={["/admin"]}
            >
              <SubLink to="/admin/languages" label={t("languages", "nav")} location={location} />
              <SubLink to="/admin/store-languages" label={t("store_languages", "nav")} location={location} />
              <SubLink to="/admin/translations" label={t("ui_translations", "nav")} location={location} />
              <SubLink to="/admin/product-translations" label={t("product_translations", "nav")} location={location} />
              <SubLink to="/admin/category-translations" label={t("category_translations", "nav")} location={location} />
              <SubLink to="/admin/subscription-plans" label={t("subscription_plans", "nav")} location={location} />
              <SubLink to="/admin/subscriptions" label={t("subscriptions", "nav")} location={location} />
              <SubLink to="/admin/audit-logs" label={t("audit_logs", "nav")} location={location} />
            </SubMenu>
          </>
        )}

        {/* SYSTEM */}
        <NavSection label={t("system", "nav")} />
        <NavItem to="/billing" icon={<CreditCard size={18} />} label="Billing" location={location} />
        <NavItem to="/settings" icon={<Settings size={18} />} label={t("settings", "nav")} location={location} />
        <div className="ni logout-item" onClick={logout} style={{ cursor: "pointer" }}>
          <div className="nic"><LogOut size={18} /></div>
          <span className="nl">{t("logout", "nav")}</span>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
