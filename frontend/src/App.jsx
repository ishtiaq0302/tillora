import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

import Dashboard from "./pages/dashboard/Dashboard";

import Stores from "./pages/stores/Stores";
import StoreForm from "./pages/stores/StoreForm";

import Roles from "./pages/roles/Roles";
import RoleForm from "./pages/roles/RoleForm";
import RolePermissionsPage from "./pages/rolepermission/RolePermissionPage";

import Users from "./pages/users/Users";
import UserForm from "./pages/users/UserForm";
import UserStoresPage from "./pages/users/UserStoresPage";

import Categories from "./pages/master/Categories";
import Brands from "./pages/master/Brands";
import Units from "./pages/master/Units";
import Taxes from "./pages/master/Taxes";
import ExpenseCategories from "./pages/master/ExpenseCategories";
import Customers from "./pages/master/Customers";
import Suppliers from "./pages/master/Suppliers";
import Attributes from "./pages/master/Attributes";
import AttributeValues from "./pages/master/AttributeValues";
import Ingredients from "./pages/master/Ingredients";

import Products from "./pages/products/Products";
import ProductForm from "./pages/products/ProductForm";

import Sales from "./pages/sales/Sales";
import SaleForm from "./pages/sales/SaleForm";
import POS from "./pages/sales/POS";

import Purchases from "./pages/purchases/Purchases";
import PurchaseForm from "./pages/purchases/PurchaseForm";

import Expenses from "./pages/expenses/Expenses";
import StockMovements from "./pages/inventory/StockMovements";
import StoreProducts from "./pages/inventory/StoreProducts";
import Tables from "./pages/restaurants/Tables";

import ProductVariants from "./pages/products/ProductVariants";
import ProductBatches from "./pages/products/ProductBatches";
import ProductTranslations from "./pages/translations/ProductTranslations";
import CategoryTranslations from "./pages/translations/CategoryTranslations";
import StoreLanguages from "./pages/translations/StoreLanguages";
import Translations from "./pages/translations/Translations";

import Languages from "./pages/admin/Languages";
import SubscriptionPlans from "./pages/admin/SubscriptionPlans";
import Subscriptions from "./pages/admin/Subscriptions";
import AuditLogs from "./pages/admin/AuditLogs";
import CashRegisters from "./pages/pos/CashRegisters";

import Reports from "./pages/reports/Reports";
import Settings from "./pages/settings/Settings";
import Billing from "./pages/billing/Billing";

import Pricing from "./pages/public/Pricing";
import Terms from "./pages/public/Terms";
import Privacy from "./pages/public/Privacy";
import RefundPolicy from "./pages/public/RefundPolicy";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* DASHBOARD */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* POS */}
        <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />

        {/* SALES */}
        <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
        <Route path="/sales/create" element={<ProtectedRoute><SaleForm /></ProtectedRoute>} />

        {/* PURCHASES */}
        <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
        <Route path="/purchases/create" element={<ProtectedRoute><PurchaseForm /></ProtectedRoute>} />

        {/* EXPENSES */}
        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />

        {/* PRODUCTS */}
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/products/create" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
        <Route path="/products/edit/:id" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />

        {/* INVENTORY */}
        <Route path="/inventory/stock-movements" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
        <Route path="/inventory/store-products" element={<ProtectedRoute><StoreProducts /></ProtectedRoute>} />

        {/* PRODUCT DETAILS */}
        <Route path="/products/variants" element={<ProtectedRoute><ProductVariants /></ProtectedRoute>} />
        <Route path="/products/batches" element={<ProtectedRoute><ProductBatches /></ProtectedRoute>} />

        {/* TRANSLATIONS */}
        <Route path="/admin/product-translations" element={<ProtectedRoute><ProductTranslations /></ProtectedRoute>} />
        <Route path="/admin/category-translations" element={<ProtectedRoute><CategoryTranslations /></ProtectedRoute>} />
        <Route path="/admin/store-languages" element={<ProtectedRoute><StoreLanguages /></ProtectedRoute>} />
        <Route path="/admin/translations" element={<ProtectedRoute><Translations /></ProtectedRoute>} />

        {/* MASTER DATA */}
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/brands" element={<ProtectedRoute><Brands /></ProtectedRoute>} />
        <Route path="/units" element={<ProtectedRoute><Units /></ProtectedRoute>} />
        <Route path="/taxes" element={<ProtectedRoute><Taxes /></ProtectedRoute>} />
        <Route path="/expense-categories" element={<ProtectedRoute><ExpenseCategories /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
        <Route path="/master/attributes" element={<ProtectedRoute><Attributes /></ProtectedRoute>} />
        <Route path="/master/attributes/:id/values" element={<ProtectedRoute><AttributeValues /></ProtectedRoute>} />
        <Route path="/ingredients" element={<ProtectedRoute><Ingredients /></ProtectedRoute>} />

        {/* RESTAURANT */}
        <Route path="/restaurant/tables" element={<ProtectedRoute><Tables /></ProtectedRoute>} />

        {/* CASH REGISTERS */}
        <Route path="/cash-registers" element={<ProtectedRoute><CashRegisters /></ProtectedRoute>} />

        {/* REPORTS */}
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

        {/* SETTINGS */}
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* BILLING */}
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />

        {/* ADMIN */}
        <Route path="/admin/languages" element={<ProtectedRoute><Languages /></ProtectedRoute>} />
        <Route path="/admin/subscription-plans" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />

        {/* STORES */}
        <Route path="/stores" element={<ProtectedRoute permission="stores.view"><Stores /></ProtectedRoute>} />
        <Route path="/stores/create" element={<ProtectedRoute permission="stores.create"><StoreForm /></ProtectedRoute>} />
        <Route path="/stores/edit/:id" element={<ProtectedRoute permission="stores.edit"><StoreForm /></ProtectedRoute>} />

        {/* ROLES */}
        <Route path="/roles" element={<ProtectedRoute permission="roles.view"><Roles /></ProtectedRoute>} />
        <Route path="/roles/create" element={<ProtectedRoute permission="roles.create"><RoleForm /></ProtectedRoute>} />
        <Route path="/roles/edit/:id" element={<ProtectedRoute permission="roles.edit"><RoleForm /></ProtectedRoute>} />
        <Route path="/roles/permissions" element={<ProtectedRoute permission="roles.edit"><RolePermissionsPage /></ProtectedRoute>} />

        {/* USERS */}
        <Route path="/users" element={<ProtectedRoute permission="users.view"><Users /></ProtectedRoute>} />
        <Route path="/users/create" element={<ProtectedRoute permission="users.create"><UserForm /></ProtectedRoute>} />
        <Route path="/users/edit/:id" element={<ProtectedRoute permission="users.edit"><UserForm /></ProtectedRoute>} />
        <Route path="/users/stores" element={<UserStoresPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
