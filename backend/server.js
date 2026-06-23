import dotenv from "dotenv";
dotenv.config();                                    // load .env (production defaults)
dotenv.config({ path: ".env.local", override: true }); // override with local values if file exists

import app from "./app.js";

// Dashboard
import dashboardRoutes from "./routes/dashboardRoutes.js";

// Auth / Core
import storeRoutes from "./routes/storeRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import storeUserRoutes from "./routes/storeUserRoutes.js";

// Master data
import categoryRoutes from "./routes/categoryRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import taxRoutes from "./routes/taxRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";

// Attributes
import attributeRoutes from "./routes/attributeRoutes.js";
import attributeValueRoutes from "./routes/attributeValueRoutes.js";

// Products
import productRoutes from "./routes/productRoutes.js";
import variantRoutes from "./routes/variantRoutes.js";
import productVariantRoutes from "./routes/productVariantRoutes.js";
import productBatchRoutes from "./routes/productBatchRoutes.js";
import productTranslationRoutes from "./routes/productTranslationRoutes.js";
import productAttributeValueRoutes from "./routes/productAttributeValueRoutes.js";

// Ingredients
import ingredientRoutes from "./routes/ingredientRoutes.js";

// Transactions
import saleRoutes from "./routes/saleRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";

// Inventory
import stockMovementRoutes from "./routes/stockMovementRoutes.js";
import storeProductRoutes from "./routes/storeProductRoutes.js";

// Restaurant
import restaurantTableRoutes from "./routes/restaurantTableRoutes.js";

// Expenses
import expenseCategoryRoutes from "./routes/expenseCategoryRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";

// Languages & Translations
import languageRoutes from "./routes/languageRoutes.js";
import storeLanguageRoutes from "./routes/storeLanguageRoutes.js";
import translationRoutes from "./routes/translationRoutes.js";
import categoryTranslationRoutes from "./routes/categoryTranslationRoutes.js";

// Subscriptions
import subscriptionPlanRoutes from "./routes/subscriptionPlanRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import paddleRoutes from "./routes/paddleRoutes.js";
import storeSubscriptionPlanRoutes from "./routes/storeSubscriptionPlanRoutes.js";
import storeSubscriptionRoutes from "./routes/storeSubscriptionRoutes.js";

// POS / Cash
import cashRegisterRoutes from "./routes/cashRegisterRoutes.js";

// Admin
import auditLogRoutes from "./routes/auditLogRoutes.js";

const PORT = process.env.PORT || 5000;

// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// Core
app.use("/api/stores", storeRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/store-users", storeUserRoutes);

// Master data
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/taxes", taxRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);

// Attributes
app.use("/api/attributes", attributeRoutes);
app.use("/api/attribute-values", attributeValueRoutes);

// Products
app.use("/api/products", productRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/product-variants", productVariantRoutes);
app.use("/api/product-batches", productBatchRoutes);
app.use("/api/product-translations", productTranslationRoutes);
app.use("/api/product-attribute-values", productAttributeValueRoutes);

// Ingredients
app.use("/api/ingredients", ingredientRoutes);

// Transactions
app.use("/api/sales", saleRoutes);
app.use("/api/purchases", purchaseRoutes);

// Inventory
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/store-products", storeProductRoutes);

// Restaurant
app.use("/api/restaurant-tables", restaurantTableRoutes);

// Expenses
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api/expenses", expenseRoutes);

// Languages & Translations
app.use("/api/languages", languageRoutes);
app.use("/api/store-languages", storeLanguageRoutes);
app.use("/api/translations", translationRoutes);
app.use("/api/category-translations", categoryTranslationRoutes);

// Subscriptions
app.use("/api/subscription-plans", subscriptionPlanRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/paddle", paddleRoutes);
app.use("/api/store-subscription-plans", storeSubscriptionPlanRoutes);
app.use("/api/store-subscriptions", storeSubscriptionRoutes);

// POS / Cash
app.use("/api/cash-registers", cashRegisterRoutes);

// Admin
app.use("/api/audit-logs", auditLogRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
