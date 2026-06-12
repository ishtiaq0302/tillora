# Frontend Structure
src/
│
├── layout/
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   ├── Footer.jsx
│   ├── HorizontalNav.jsx
│   └── MainLayout.jsx
│
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   │
│   ├── dashboard/
│   │   └── Dashboard.jsx
│   │
│   ├── master/                     👈 ALL MASTER DATA
│   │   ├── Categories.jsx
│   │   ├── Suppliers.jsx
│   │   ├── Customers.jsx
│   │   ├── Units.jsx
│   │   ├── Taxes.jsx
│   │   └── Brands.jsx
│   │
│   ├── products/
│   │   ├── Products.jsx
│   │   └── ProductForm.jsx
│   │
│   ├── sales/
│   │   ├── Sales.jsx
│   │   └── POS.jsx
│   │
│   ├── purchases/
│   │   └── Purchases.jsx
│   │
│   ├── reports/
│   │   └── Reports.jsx
│   │
│   └── settings/
│       └── Settings.jsx
│
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   └── Loader.jsx
│   │
│   ├── table/
│   │   ├── DataTable.jsx          👈 GENERIC TABLE
│   │   └── TableActions.jsx
│   │
│   ├── form/
│   │   ├── FormModal.jsx          👈 GENERIC CREATE/EDIT MODAL
│   │   └── FormFields.jsx
│   │
│   ├── modal/
│   │   ├── DeleteModal.jsx        👈 COMMON DELETE POPUP
│   │   └── ConfirmModal.jsx
│   │
│   └── shared/
│       ├── PageHeader.jsx
│       └── SearchBar.jsx
│
├── services/
│   ├── api.js                     👈 axios instance
│   ├── authService.js
│   ├── crudService.js            👈 VERY IMPORTANT (generic API)
│   ├── productService.js
│   └── masterService.js
│
├── hooks/
│   ├── useCrud.js                👈 reusable hook for all CRUD
│   └── useAuth.js
│
├── context/
│   └── AuthContext.jsx
│
├── utils/
│   ├── format.js
│   ├── constants.js
│   └── helpers.js
│
└── routes/
    └── AppRoutes.jsx
    └── ProtectedRoute.jsx


# Backend Structure

backend/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.js
│
├── src/
│   ├── config/
│   │   └── db.js
│
│   ├── lib/
│   │   └── prisma.js
│
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── masterRoutes/
│   │   │   ├── categoryRoutes.js
│   │   │   ├── supplierRoutes.js
│   │   │   ├── unitRoutes.js
│   │   │   ├── customerRoutes.js
│   │   │   └── taxRoutes.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── master/
│   │   │   ├── categoryController.js
│   │   │   ├── supplierController.js
│   │   │   ├── unitController.js
│   │   │   ├── customerController.js
│   │   │   └── taxController.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── productService.js
│   │   └── masterService.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   │
│   └── utils/
│       ├── jwt.js
│       └── hash.js
│
├── server.js
└── package.json

# Backend Second Structure
backend/
│
├── lib/
│   └── prisma.js
│
├── services/
│   └── crudService.js        ⭐ MASTER CRUD
│
├── controllers/
│   ├── categoryController.js
│   ├── productController.js
│   ├── authController.js
│   └── ...
│
├── routes/
│   ├── categoryRoutes.js
│   ├── productRoutes.js
│   └── authRoutes.js
│
├── middleware/
│
└── server.


# Advance FrontEnd Structure for Combine CRUD

frontend/src
│
├── layout/
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   ├── Footer.jsx
│   ├── HorizontalNav.jsx
│   └── MainLayout.jsx
│
├── routes/
│   ├── AppRoutes.jsx
│   └── ProtectedRoute.jsx
│
├── pages/
│   │
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   │
│   ├── dashboard/
│   │   └── Dashboard.jsx
│   │
│   ├── master/
│   │   ├── Categories.jsx
│   │   ├── Brands.jsx
│   │   ├── Units.jsx
│   │   ├── Customers.jsx
│   │   ├── Suppliers.jsx
│   │   ├── Taxes.jsx
│   │   └── ExpenseCategories.jsx
│   │
│   ├── products/
│   │   ├── Products.jsx
│   │   ├── ProductForm.jsx
│   │   └── ProductTable.jsx
│   │
│   ├── sales/
│   │   ├── POS.jsx
│   │   ├── Sales.jsx
│   │   └── SaleDetails.jsx
│   │
│   ├── purchases/
│   │   ├── Purchases.jsx
│   │   └── PurchaseForm.jsx
│   │
│   ├── reports/
│   │   ├── SalesReport.jsx
│   │   ├── PurchaseReport.jsx
│   │   ├── ProfitLoss.jsx
│   │   └── StockReport.jsx
│   │
│   └── settings/
│       ├── GeneralSettings.jsx
│       ├── StoreSettings.jsx
│       └── PrinterSettings.jsx
│
├── components/
│   │
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Loader.jsx
│   │   ├── Badge.jsx
│   │   └── EmptyState.jsx
│   │
│   ├── table/
│   │   ├── DataTable.jsx
│   │   ├── TableActions.jsx
│   │   ├── TablePagination.jsx
│   │   └── SearchFilter.jsx
│   │
│   ├── form/
│   │   ├── FormModal.jsx
│   │   ├── DynamicForm.jsx
│   │   └── FormFields.jsx
│   │
│   ├── modal/
│   │   ├── DeleteModal.jsx
│   │   └── ConfirmModal.jsx
│   │
│   ├── cards/
│   │   ├── StatCard.jsx
│   │   └── SummaryCard.jsx
│   │
│   └── shared/
│       ├── PageHeader.jsx
│       ├── SearchBar.jsx
│       └── Breadcrumb.jsx
│
├── hooks/
│   ├── useCrud.js
│   ├── useAuth.js
│   └── useModal.js
│
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── crudService.js
│   ├── productService.js
│   └── reportService.js
│
├── context/
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
│
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   ├── format.js
│   └── permissions.js
│
├── styles/
│   ├── globals.css
│   ├── table.css
│   ├── form.css
│   └── modal.css
│
├── App.jsx
└── main.jsx



# ---------------------------------------------------------------
18 May 2026 Structure

Phase 1 — Authentication-> Signup Login JWT Me API Auth middleware"
Phase 2 — Tenant Base-> Stores, Roles, Users
Phase 3 — Master Data -> Categories, Brands, Units, Taxes
Phase 4 — Products -> Products, Variants, Attributes, Stock
Phase 5 — Sales/Purchases

server/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── prisma.js
│   │
│   ├── controllers/
│   │   └── authController.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── routes/
│   │   └── authRoutes.js
│   │
│   ├── utils/
│   │   └── generateToken.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── package.json



src/
│
├── hooks/
│   └── useAuth.js
│
├── services/
│   └── authService.js
│
├── pages/
│   └── auth/
│       ├── Login.jsx
│       └── Signup.jsx

# ---------------------------------------------------------------
# Above Structure showed folder structure
backend/
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── utils/
│
├── prisma/
├── package.json
└── .env

src/
│
├── api/
│   └── axios.js
│
├── hooks/
│   └── useAuth.js
│
├── services/
│   └── authService.js
│
├── context/
│   └── AuthContext.jsx
│
├── pages/
│   └── auth/
│       ├── Login.jsx
│       └── Signup.jsx
│
├── components/
│   └── ProtectedRoute.jsx
│
├── App.jsx
├── main.jsx
└── styles.css