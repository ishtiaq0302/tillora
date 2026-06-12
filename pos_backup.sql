--
-- PostgreSQL database dump
--

\restrict bHK0cgvGMoHzjKnDW7CWi1HkDlaNqNDZasCFJysm2Zi9xHfCmsSCf47etirxu4Q

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: attribute_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attribute_values (
    id text NOT NULL,
    "attributeId" text NOT NULL,
    value text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.attribute_values OWNER TO postgres;

--
-- Name: attributes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attributes (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.attributes OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "tenantId" text,
    "userId" text,
    module text,
    action text,
    "recordId" text,
    "oldValues" jsonb,
    "newValues" jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.brands OWNER TO postgres;

--
-- Name: cash_registers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cash_registers (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "storeId" text NOT NULL,
    "userId" text,
    "openingBalance" numeric(65,30) DEFAULT 0 NOT NULL,
    "closingBalance" numeric(65,30),
    "openedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "closedAt" timestamp(3) without time zone,
    status text DEFAULT 'open'::text NOT NULL
);


ALTER TABLE public.cash_registers OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "parentId" text,
    name text NOT NULL,
    image text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: category_translations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category_translations (
    id text NOT NULL,
    "categoryId" text NOT NULL,
    "languageId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.category_translations OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    city text,
    country text,
    loyalty_points integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "storeId" text,
    "categoryId" text,
    amount numeric(65,30) NOT NULL,
    notes text,
    "expenseDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: languages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.languages (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "nativeName" text,
    "isRtl" boolean DEFAULT false NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.languages OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    name text NOT NULL,
    module text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: product_attribute_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_attribute_values (
    id text NOT NULL,
    "productId" text NOT NULL,
    "attributeId" text NOT NULL,
    "attributeValueId" text NOT NULL
);


ALTER TABLE public.product_attribute_values OWNER TO postgres;

--
-- Name: product_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_batches (
    id text NOT NULL,
    "productId" text NOT NULL,
    "batchNo" text NOT NULL,
    "manufactureDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    quantity numeric(65,30) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_batches OWNER TO postgres;

--
-- Name: product_translations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_translations (
    id text NOT NULL,
    "productId" text NOT NULL,
    "languageId" text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_translations OWNER TO postgres;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variants (
    id text NOT NULL,
    "productId" text NOT NULL,
    "variantName" text NOT NULL,
    sku text,
    barcode text,
    "costPrice" numeric(65,30) DEFAULT 0 NOT NULL,
    "sellingPrice" numeric(65,30) DEFAULT 0 NOT NULL,
    "stockQuantity" numeric(65,30) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_variants OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "categoryId" text,
    "brandId" text,
    "unitId" text,
    "taxId" text,
    name text NOT NULL,
    sku text,
    barcode text,
    "productType" text DEFAULT 'simple'::text NOT NULL,
    "costPrice" numeric(65,30) DEFAULT 0 NOT NULL,
    "sellingPrice" numeric(65,30) DEFAULT 0 NOT NULL,
    "stockQuantity" numeric(65,30) DEFAULT 0 NOT NULL,
    "stockAlertQuantity" numeric(65,30) DEFAULT 0 NOT NULL,
    "hasExpiry" boolean DEFAULT false NOT NULL,
    "hasBatch" boolean DEFAULT false NOT NULL,
    image text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_items (
    id text NOT NULL,
    "purchaseId" text NOT NULL,
    "productId" text,
    quantity numeric(65,30) DEFAULT 1 NOT NULL,
    "costPrice" numeric(65,30) DEFAULT 0 NOT NULL,
    tax numeric(65,30) DEFAULT 0 NOT NULL,
    discount numeric(65,30) DEFAULT 0 NOT NULL,
    total numeric(65,30) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.purchase_items OWNER TO postgres;

--
-- Name: purchases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchases (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "storeId" text NOT NULL,
    "supplierId" text,
    "invoiceNo" text,
    subtotal numeric(65,30) DEFAULT 0 NOT NULL,
    discount numeric(65,30) DEFAULT 0 NOT NULL,
    tax numeric(65,30) DEFAULT 0 NOT NULL,
    "grandTotal" numeric(65,30) DEFAULT 0 NOT NULL,
    "paymentStatus" text DEFAULT 'pending'::text NOT NULL,
    notes text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.purchases OWNER TO postgres;

--
-- Name: restaurant_tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_tables (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "storeId" text NOT NULL,
    "tableName" text NOT NULL,
    capacity integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.restaurant_tables OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_items (
    id text NOT NULL,
    "saleId" text NOT NULL,
    "productId" text,
    "productVariantId" text,
    quantity numeric(65,30) DEFAULT 1 NOT NULL,
    price numeric(65,30) DEFAULT 0 NOT NULL,
    discount numeric(65,30) DEFAULT 0 NOT NULL,
    tax numeric(65,30) DEFAULT 0 NOT NULL,
    total numeric(65,30) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sale_items OWNER TO postgres;

--
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    "invoiceNo" text NOT NULL,
    subtotal numeric(65,30) DEFAULT 0 NOT NULL,
    discount numeric(65,30) DEFAULT 0 NOT NULL,
    tax numeric(65,30) DEFAULT 0 NOT NULL,
    shipping numeric(65,30) DEFAULT 0 NOT NULL,
    "grandTotal" numeric(65,30) DEFAULT 0 NOT NULL,
    "paymentStatus" text DEFAULT 'pending'::text NOT NULL,
    "saleStatus" text DEFAULT 'completed'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "storeId" uuid NOT NULL,
    "customerId" uuid,
    "createdBy" uuid
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "storeId" uuid,
    "settingKey" text NOT NULL,
    "settingValue" text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "storeId" text,
    "productId" text NOT NULL,
    "movementType" text NOT NULL,
    quantity numeric(65,30) NOT NULL,
    "referenceType" text,
    "referenceId" text,
    notes text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: store_languages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.store_languages (
    id text NOT NULL,
    "storeId" text NOT NULL,
    "languageId" text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.store_languages OWNER TO postgres;

--
-- Name: stores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stores (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    code text,
    "storeType" text NOT NULL,
    address text,
    city text,
    state text,
    country text,
    "zipCode" text,
    phone text,
    email text,
    currency text DEFAULT 'PKR'::text NOT NULL,
    timezone text DEFAULT 'Asia/Karachi'::text NOT NULL,
    "dateFormat" text DEFAULT 'd-m-Y'::text NOT NULL,
    "taxNumber" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.stores OWNER TO postgres;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    price numeric(65,30) DEFAULT 0 NOT NULL,
    "durationDays" integer DEFAULT 30 NOT NULL,
    "maxUsers" integer DEFAULT 5 NOT NULL,
    "maxStores" integer DEFAULT 1 NOT NULL,
    features jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscription_plans OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "subscriptionPlanId" text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    amount numeric(65,30) DEFAULT 0 NOT NULL,
    "paymentStatus" text DEFAULT 'pending'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: taxes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.taxes (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    rate numeric(65,30) NOT NULL,
    "taxType" text DEFAULT 'percentage'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.taxes OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id text NOT NULL,
    "subscriptionPlanId" text,
    "businessName" text NOT NULL,
    slug text NOT NULL,
    email text,
    phone text,
    logo text,
    "subscriptionStatus" text DEFAULT 'trial'::text NOT NULL,
    "trialStartsAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "trialEndsAt" timestamp(3) without time zone,
    "subscribedAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: translations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.translations (
    id uuid NOT NULL,
    "tenantId" uuid,
    "languageId" uuid NOT NULL,
    translation_group text NOT NULL,
    translation_key text NOT NULL,
    translation_value text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.translations OWNER TO postgres;

--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "shortName" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.units OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    "userId" text NOT NULL,
    "roleId" text NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    phone text,
    avatar text,
    "lastLoginAt" timestamp(3) without time zone,
    "isSuperAdmin" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: attribute_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attribute_values (id, "attributeId", value, "createdAt") FROM stdin;
\.


--
-- Data for Name: attributes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attributes (id, "tenantId", name, "createdAt") FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, "tenantId", "userId", module, action, "recordId", "oldValues", "newValues", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (id, "tenantId", name, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: cash_registers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cash_registers (id, "tenantId", "storeId", "userId", "openingBalance", "closingBalance", "openedAt", "closedAt", status) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, "tenantId", "parentId", name, image, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: category_translations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.category_translations (id, "categoryId", "languageId", name, "createdAt") FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, "tenantId", name, phone, email, address, city, country, loyalty_points, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_categories (id, "tenantId", name, "createdAt") FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, "tenantId", "storeId", "categoryId", amount, notes, "expenseDate", "createdBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: languages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.languages (id, code, name, "nativeName", "isRtl", "isDefault", "isActive", "createdAt") FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, module, "createdAt") FROM stdin;
db59ed29-6fbb-4de8-b38a-4661c377587a	stores.view	stores	2026-05-19 12:10:06.922
357c87cb-acf9-4dbd-acba-9e0c4df5bdff	stores.create	stores	2026-05-19 12:10:07.016
cc8c7d51-dd90-4db6-991f-4827e02c39bf	stores.update	stores	2026-05-19 12:10:07.02
ce22aa57-fe41-42b5-8037-439f922821e3	stores.delete	stores	2026-05-19 12:10:07.024
3d71fb4b-2cb4-45fb-b9ed-841b90a1da9a	users.view	users	2026-05-19 12:10:07.028
9430a5f0-d8e4-47d9-ac6e-b0c16b6e007b	users.create	users	2026-05-19 12:10:07.033
f0644c4c-8fb2-44be-b34f-cbc109b986ce	users.update	users	2026-05-19 12:10:07.038
cf093170-67f0-4dcf-a66d-4e73ec15f9d5	users.delete	users	2026-05-19 12:10:07.042
f7147726-2872-4066-9228-58e5991e326a	roles.view	roles	2026-05-19 12:10:07.046
e46c12d2-8644-4679-8469-741ae5b11532	roles.create	roles	2026-05-19 12:10:07.05
a0879a96-7e2d-48cf-875a-9e73ff776cb3	roles.update	roles	2026-05-19 12:10:07.054
a2fa4a22-e119-416a-b7b4-8af7d19cca06	roles.delete	roles	2026-05-19 12:10:07.057
43aa37f1-cd8a-4309-a069-3462a3cffc0d	products.view	products	2026-05-19 12:10:07.061
ed0c3d53-6226-4aa2-a19a-1e37abb60bb5	products.create	products	2026-05-19 12:10:07.064
ba585fbe-89a2-4eea-8980-587f51b19aa0	products.update	products	2026-05-19 12:10:07.067
2dcc5d37-12e7-4a2b-afc7-83739fa7c69e	products.delete	products	2026-05-19 12:10:07.071
795a3d7c-24b0-4f88-96e0-657f2686bb21	sales.view	sales	2026-05-19 12:10:07.077
3cd60e1e-bfd3-4e19-8677-f042622fd66e	sales.create	sales	2026-05-19 12:10:07.08
dcc36eb6-44e7-410a-b219-a525bed1d840	sales.update	sales	2026-05-19 12:10:07.084
2ecec908-54c6-48f6-87c4-8fcb2d6d9aa0	sales.delete	sales	2026-05-19 12:10:07.087
\.


--
-- Data for Name: product_attribute_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_attribute_values (id, "productId", "attributeId", "attributeValueId") FROM stdin;
\.


--
-- Data for Name: product_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_batches (id, "productId", "batchNo", "manufactureDate", "expiryDate", quantity, "createdAt") FROM stdin;
\.


--
-- Data for Name: product_translations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_translations (id, "productId", "languageId", name, description, "createdAt") FROM stdin;
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variants (id, "productId", "variantName", sku, barcode, "costPrice", "sellingPrice", "stockQuantity", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, "tenantId", "categoryId", "brandId", "unitId", "taxId", name, sku, barcode, "productType", "costPrice", "sellingPrice", "stockQuantity", "stockAlertQuantity", "hasExpiry", "hasBatch", image, description, "isActive", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_items (id, "purchaseId", "productId", quantity, "costPrice", tax, discount, total, "createdAt") FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchases (id, "tenantId", "storeId", "supplierId", "invoiceNo", subtotal, discount, tax, "grandTotal", "paymentStatus", notes, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: restaurant_tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.restaurant_tables (id, "tenantId", "storeId", "tableName", capacity, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions ("roleId", "permissionId") FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, "tenantId", name, description, "createdAt", "updatedAt") FROM stdin;
f13ec85e-ce23-415f-bba6-d60fdfa9f663	5ab12801-505c-431f-8871-e271442df006	Admin	Full system access	2026-05-18 09:33:27.633	2026-05-18 09:33:27.633
2eadf718-2232-42b1-bd71-03eaf09bf713	a7833289-a4d3-4898-ae68-06ef9af6899e	Admin	Full system access	2026-05-18 09:42:36.996	2026-05-18 09:42:36.996
0f66d3c8-c28f-49df-949b-8fbcf56901c0	b65189fd-1e78-4bdb-b2b6-a6c3afcb3f75	Admin	Full system access	2026-05-18 10:25:06.034	2026-05-18 10:25:06.034
ab44aaa5-c651-468b-8122-df3b6ce118fa	95b43a3d-8c3f-4969-91af-f195d7005978	Admin	Full system access	2026-05-18 11:04:16.418	2026-05-18 11:04:16.418
11158534-090f-4fb5-b2a6-1bead8bb468c	a7833289-a4d3-4898-ae68-06ef9af6899e	Super Admin	Full system control\nManage tenants, plans, everything	2026-05-19 14:01:42.329	2026-05-19 14:01:42.329
8f0e8e85-5b04-4b73-bd51-3d7db04a7710	a7833289-a4d3-4898-ae68-06ef9af6899e	Tenant Admin (Business Owner)	Owns a company/store group\nManages users, stores, products	2026-05-19 14:02:00.594	2026-05-19 14:02:00.594
4ab52161-c463-4466-b3a7-3a9392b8c207	a7833289-a4d3-4898-ae68-06ef9af6899e	Store Manager	Manages one or multiple stores\nInventory, sales, reports	2026-05-19 14:02:17.873	2026-05-19 14:02:17.873
12a660c2-584f-45ad-a4a4-f9b3a4325834	a7833289-a4d3-4898-ae68-06ef9af6899e	Cashier	POS billing / sales only\nLimited access	2026-05-19 14:02:32.092	2026-05-19 14:02:32.092
b6afeb21-23ca-40c9-a664-b3aefe3567b4	a7833289-a4d3-4898-ae68-06ef9af6899e	Inventory Manager	Products, stock, purchase management	2026-05-19 14:02:51.602	2026-05-19 14:02:51.602
517b8669-37bf-4c7d-a756-b9e3531eca76	a7833289-a4d3-4898-ae68-06ef9af6899e	Viewer / Auditor	Read-only access (reports, sales view)	2026-05-19 14:03:08.194	2026-05-19 14:03:08.194
c4ea564e-4adf-44d2-882a-38fe92cca68f	a7833289-a4d3-4898-ae68-06ef9af6899e	Accountant	Expenses, purchases, financial reports	2026-05-19 14:03:21.713	2026-05-19 14:03:21.713
992a0e9a-c5b2-4702-9721-e5e0a808dd99	a7833289-a4d3-4898-ae68-06ef9af6899e	Waiter / Staff (Restaurant mode)	Orders only (if restaurant POS enabled)	2026-05-19 14:03:41.281	2026-05-19 14:03:41.281
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale_items (id, "saleId", "productId", "productVariantId", quantity, price, discount, tax, total, "createdAt") FROM stdin;
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales ("invoiceNo", subtotal, discount, tax, shipping, "grandTotal", "paymentStatus", "saleStatus", notes, "createdAt", "updatedAt", id, "tenantId", "storeId", "customerId", "createdBy") FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, "tenantId", "storeId", "settingKey", "settingValue", created_at) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, "tenantId", "storeId", "productId", "movementType", quantity, "referenceType", "referenceId", notes, "createdBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: store_languages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.store_languages (id, "storeId", "languageId", "isDefault", "createdAt") FROM stdin;
\.


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stores (id, "tenantId", name, code, "storeType", address, city, state, country, "zipCode", phone, email, currency, timezone, "dateFormat", "taxNumber", "isActive", "createdAt", "updatedAt") FROM stdin;
373e8b8d-1dad-4dd9-aff2-d0585003b5fe	5ab12801-505c-431f-8871-e271442df006	Khan Super Store Main Store	\N	retail	\N	\N	\N	\N	\N	\N	\N	PKR	Asia/Karachi	d-m-Y	\N	t	2026-05-18 09:33:27.623	2026-05-18 09:33:27.623
61eb015c-a9f4-43fc-8e04-d96bdbcf2da1	b65189fd-1e78-4bdb-b2b6-a6c3afcb3f75	Pizza Store Main Store	\N	retail	\N	\N	\N	\N	\N	\N	\N	PKR	Asia/Karachi	d-m-Y	\N	t	2026-05-18 10:25:06.025	2026-05-18 10:25:06.025
fdf3774e-5119-4b8e-a119-46ee3f2ce452	95b43a3d-8c3f-4969-91af-f195d7005978	Retail Store Main Store	\N	retail	\N	\N	\N	\N	\N	\N	\N	PKR	Asia/Karachi	d-m-Y	\N	t	2026-05-18 11:04:16.408	2026-05-18 11:04:16.408
f8cae0c1-0758-403b-b29d-a74e354b3835	a7833289-a4d3-4898-ae68-06ef9af6899e	A-Z Store Main Store	AZ-001	retail	Haji camp peshawar	Peshawar	KPK	Pakistan	25000	03022241162	azstore@gmail.com	PKR	Asia/Karachi	d-m-Y	4	t	2026-05-18 09:42:36.988	2026-05-19 02:59:44.745
35603b7a-8fd7-4f9a-85cc-ec34483fd63d	a7833289-a4d3-4898-ae68-06ef9af6899e	A-Z Branch Second Store	STORE-001	pharmacy	A-Z Branch One address here...	Peshawar	KPK	Pakistan	25000	0333333333	branchone@gmail.com	PKR	Asia/Karachi	d-m-Y	5	t	2026-05-18 12:32:36.157	2026-05-20 09:19:39.039
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_plans (id, name, code, price, "durationDays", "maxUsers", "maxStores", features, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, "tenantId", "subscriptionPlanId", "startDate", "endDate", amount, "paymentStatus", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, "tenantId", name, phone, email, address, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: taxes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.taxes (id, "tenantId", name, rate, "taxType", "isActive", "createdAt") FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, "subscriptionPlanId", "businessName", slug, email, phone, logo, "subscriptionStatus", "trialStartsAt", "trialEndsAt", "subscribedAt", "isActive", "createdAt", "updatedAt") FROM stdin;
5ab12801-505c-431f-8871-e271442df006	\N	Khan Super Store	khan-super-store-1779096807421	ishtiaq@gmail.com	\N	\N	trial	2026-05-18 09:33:27.598	2026-05-25 09:33:27.595	\N	t	2026-05-18 09:33:27.598	2026-05-18 09:33:27.598
a7833289-a4d3-4898-ae68-06ef9af6899e	\N	A-Z Store	a-z-store-1779097356820	admin@gmail.com	\N	\N	trial	2026-05-18 09:42:36.982	2026-05-25 09:42:36.977	\N	t	2026-05-18 09:42:36.982	2026-05-18 09:42:36.982
b65189fd-1e78-4bdb-b2b6-a6c3afcb3f75	\N	Pizza Store	pizza-store-1779099905822	ahmad@gmail.com	\N	\N	trial	2026-05-18 10:25:06.002	2026-05-25 10:25:06.002	\N	t	2026-05-18 10:25:06.006	2026-05-18 10:25:06.006
95b43a3d-8c3f-4969-91af-f195d7005978	\N	Retail Store	retail-store-1779102256201	idrees@gmail.com	\N	\N	trial	2026-05-18 11:04:16.388	2026-05-25 11:04:16.388	\N	t	2026-05-18 11:04:16.392	2026-05-18 11:04:16.392
\.


--
-- Data for Name: translations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.translations (id, "tenantId", "languageId", translation_group, translation_key, translation_value, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.units (id, "tenantId", name, "shortName", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles ("userId", "roleId") FROM stdin;
e336c8e4-4c17-46c0-ac81-1d748a4e6990	f13ec85e-ce23-415f-bba6-d60fdfa9f663
f22bbaea-59a3-4c15-b7e8-599eeaee3773	2eadf718-2232-42b1-bd71-03eaf09bf713
a82c8fc5-c4a8-426f-83ce-62876a07f240	0f66d3c8-c28f-49df-949b-8fbcf56901c0
d1527b60-6876-4517-9606-9a957aac7d54	ab44aaa5-c651-468b-8122-df3b6ce118fa
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, "tenantId", "firstName", "lastName", email, "passwordHash", phone, avatar, "lastLoginAt", "isSuperAdmin", "isActive", "createdAt", "updatedAt") FROM stdin;
e336c8e4-4c17-46c0-ac81-1d748a4e6990	5ab12801-505c-431f-8871-e271442df006	Ishtiaq	Ahmad	ishtiaq@gmail.com	$2b$10$tB5ckooT9WnITbSRwV29z.l3TX7ASii0YRFjiCN6nfUiTjh2kCSce	\N	\N	2026-05-18 11:31:08.492	t	t	2026-05-18 09:33:27.64	2026-05-18 11:31:08.494
f22bbaea-59a3-4c15-b7e8-599eeaee3773	a7833289-a4d3-4898-ae68-06ef9af6899e	Super	Admin	admin@gmail.com	$2b$10$ApBcum.HlT3NOOA7USj3zOG3cuKkAQ6B0BKJG7HTnFJQp4R0l78oO	\N	\N	2026-05-19 14:00:49.312	t	t	2026-05-18 09:42:36.999	2026-05-19 14:00:49.314
a82c8fc5-c4a8-426f-83ce-62876a07f240	b65189fd-1e78-4bdb-b2b6-a6c3afcb3f75	Ahmad	Ishtiaq	ahmad@gmail.com	$2b$10$9CqctetqOwZTJDzq02mN2eeqQ8STc8ImhGTbVzRLnpTX51Q6oT19e	\N	\N	2026-05-18 10:31:44.454	t	t	2026-05-18 10:25:06.038	2026-05-18 10:31:44.456
d1527b60-6876-4517-9606-9a957aac7d54	95b43a3d-8c3f-4969-91af-f195d7005978	idrees	ahmad	idrees@gmail.com	$2b$10$VPAwXDmsRDgVPR3hsChW6.f8hnyIFgaaeqfUlcpMyjjE/NKnPsN46	\N	\N	2026-05-18 11:23:16.561	t	t	2026-05-18 11:04:16.424	2026-05-18 11:23:16.562
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: attribute_values attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_values
    ADD CONSTRAINT attribute_values_pkey PRIMARY KEY (id);


--
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: cash_registers cash_registers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: category_translations category_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_translations
    ADD CONSTRAINT category_translations_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: product_attribute_values product_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_pkey PRIMARY KEY (id);


--
-- Name: product_batches product_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_pkey PRIMARY KEY (id);


--
-- Name: product_translations product_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_translations
    ADD CONSTRAINT product_translations_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: restaurant_tables restaurant_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY ("roleId", "permissionId");


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: store_languages store_languages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_languages
    ADD CONSTRAINT store_languages_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: taxes taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT taxes_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY ("userId", "roleId");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: brands_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "brands_tenantId_idx" ON public.brands USING btree ("tenantId");


--
-- Name: categories_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "categories_tenantId_idx" ON public.categories USING btree ("tenantId");


--
-- Name: category_translations_categoryId_languageId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "category_translations_categoryId_languageId_key" ON public.category_translations USING btree ("categoryId", "languageId");


--
-- Name: customers_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "customers_tenantId_idx" ON public.customers USING btree ("tenantId");


--
-- Name: expenses_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "expenses_tenantId_idx" ON public.expenses USING btree ("tenantId");


--
-- Name: languages_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX languages_code_key ON public.languages USING btree (code);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: product_batches_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "product_batches_productId_idx" ON public.product_batches USING btree ("productId");


--
-- Name: product_translations_productId_languageId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "product_translations_productId_languageId_key" ON public.product_translations USING btree ("productId", "languageId");


--
-- Name: product_variants_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "product_variants_productId_idx" ON public.product_variants USING btree ("productId");


--
-- Name: products_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "products_categoryId_idx" ON public.products USING btree ("categoryId");


--
-- Name: products_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "products_tenantId_idx" ON public.products USING btree ("tenantId");


--
-- Name: products_tenantId_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "products_tenantId_sku_key" ON public.products USING btree ("tenantId", sku);


--
-- Name: purchase_items_purchaseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "purchase_items_purchaseId_idx" ON public.purchase_items USING btree ("purchaseId");


--
-- Name: purchases_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "purchases_tenantId_idx" ON public.purchases USING btree ("tenantId");


--
-- Name: restaurant_tables_storeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "restaurant_tables_storeId_idx" ON public.restaurant_tables USING btree ("storeId");


--
-- Name: roles_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "roles_tenantId_idx" ON public.roles USING btree ("tenantId");


--
-- Name: roles_tenantId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "roles_tenantId_name_key" ON public.roles USING btree ("tenantId", name);


--
-- Name: sale_items_saleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sale_items_saleId_idx" ON public.sale_items USING btree ("saleId");


--
-- Name: sales_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sales_customerId_idx" ON public.sales USING btree ("customerId");


--
-- Name: sales_storeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sales_storeId_idx" ON public.sales USING btree ("storeId");


--
-- Name: sales_storeId_invoiceNo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sales_storeId_invoiceNo_key" ON public.sales USING btree ("storeId", "invoiceNo");


--
-- Name: sales_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sales_tenantId_idx" ON public.sales USING btree ("tenantId");


--
-- Name: settings_tenantId_storeId_settingKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "settings_tenantId_storeId_settingKey_key" ON public.settings USING btree ("tenantId", "storeId", "settingKey");


--
-- Name: stock_movements_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stock_movements_tenantId_idx" ON public.stock_movements USING btree ("tenantId");


--
-- Name: store_languages_storeId_languageId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "store_languages_storeId_languageId_key" ON public.store_languages USING btree ("storeId", "languageId");


--
-- Name: stores_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stores_tenantId_idx" ON public.stores USING btree ("tenantId");


--
-- Name: subscription_plans_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX subscription_plans_code_key ON public.subscription_plans USING btree (code);


--
-- Name: subscriptions_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "subscriptions_tenantId_idx" ON public.subscriptions USING btree ("tenantId");


--
-- Name: suppliers_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "suppliers_tenantId_idx" ON public.suppliers USING btree ("tenantId");


--
-- Name: taxes_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "taxes_tenantId_idx" ON public.taxes USING btree ("tenantId");


--
-- Name: tenants_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenants_email_key ON public.tenants USING btree (email);


--
-- Name: tenants_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);


--
-- Name: translations_languageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "translations_languageId_idx" ON public.translations USING btree ("languageId");


--
-- Name: translations_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "translations_tenantId_idx" ON public.translations USING btree ("tenantId");


--
-- Name: translations_tenantId_languageId_translation_group_translat_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "translations_tenantId_languageId_translation_group_translat_key" ON public.translations USING btree ("tenantId", "languageId", translation_group, translation_key);


--
-- Name: units_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "units_tenantId_idx" ON public.units USING btree ("tenantId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_tenantId_idx" ON public.users USING btree ("tenantId");


--
-- Name: brands brands_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT "brands_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_batches product_batches_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT "product_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_taxId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES public.taxes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles roles_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stores stores_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT "stores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: taxes taxes_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT "taxes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenants tenants_subscriptionPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT "tenants_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES public.subscription_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: units units_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT "units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict bHK0cgvGMoHzjKnDW7CWi1HkDlaNqNDZasCFJysm2Zi9xHfCmsSCf47etirxu4Q

