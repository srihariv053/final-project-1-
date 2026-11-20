# DineFlow – Production-Grade Restaurant Management System

A modern, centralized SaaS platform designed for small-to-medium sized restaurants to streamline daily operations, including tables, orders, kitchen display, raw inventory, billing & payments, staff roles, and analytics from one unified dashboard.

---

## 🌟 Key Highlights & Business Capabilities

1. **Role-Based Access Control (RBAC):**
   - **Restaurant Owner:** Full access to all business modules, P&L reports, staff, and system configuration.
   - **Manager:** Comprehensive operational controls, inventory restocks, supplier POs, table assignments, and staff.
   - **Cashier:** Point of Sale, table checks, invoice generation, discount application, and payment settlement (Cash, Card, UPI).
   - **Waiter:** Tableside POS order taking, custom dish notes, table status updates, and guest reservations.
   - **Kitchen Staff:** Dedicated Kitchen Display System (KDS), ticket tracking, delayed order alerts, and dish preparation updates.
   - *Instant 1-Click Role Switcher included in both Login and Header for effortless evaluation of every role.*

2. **15 Fully-Fledged Operational Modules:**
   - **Login:** Role-based authentication with quick-access demo credentials.
   - **Dashboard:** Real-time metrics computed directly from database records (Today's revenue, active orders, table occupancy, low stock alerts, weekly sales chart, and recent orders stream).
   - **Table Management:** Visual floor plan across 4 sections (Main Dining, Balcony, Rooftop Lounge, Private Room) with live occupancy badges, assigned waiter, and 1-click order opening.
   - **Order Management & POS:** Visual dish selector, categories, dietary indicators (Veg/Non-Veg), special instructions, automated tax (5%) and discount calculation, and order tracking.
   - **Kitchen Display System (KDS):** Live digital ticket cards with timer progression (New → Preparing → Ready → Served), late ticket warnings (>15m yellow, >20m red), and chime alert controls.
   - **Menu Catalog:** 40 dishes across 6 categories (Starters, Main Course, Rice & Noodles, Breads, Desserts, Beverages) with image previews, preparation times, availability toggles, and recipe ingredient linkages.
   - **Inventory Management:** Tracks 26 raw ingredients with units, min stock levels, costs, stock bars, manual usage/waste records, restock logging, and audit history.
   - **Automatic Inventory Deduction:** When an order is served or completed, required ingredients are automatically deducted from stock based on recipe definitions, triggering low-stock alerts if stock falls below minimum threshold.
   - **Supplier Management:** 10 wholesale vendors with contacts, supplied item tags, and multi-line Purchase Order restocks.
   - **Customer Database:** 20 guest profiles with phone numbers, lifetime spending, VIP tags, visit frequency, and past order history.
   - **Reservations:** Guest booking system with table conflict check to prevent double-booking, party size, and automatic seating status.
   - **Billing & Settlement:** Settle bills via Cash, Card, or UPI, calculate cash change, apply discounts, and generate printable & downloadable itemized tax invoices.
   - **Staff Management:** Employee directory with active/inactive status toggle and role permissions matrix.
   - **Reports & Analytics:** Date range filters (Today, 7D, 30D, 90D, Year, Custom), revenue trend area chart, category breakdown donut chart, peak business hours bar chart, and ingredient consumption breakdown.
   - **Notifications Center:** Live notifications for new orders, kitchen-ready tickets, low stock warnings, new bookings, and payments.
   - **Settings:** Restaurant profile, address, operating hours, tax rate, and demo data re-seed trigger.

---

## 🛠️ Technology Stack

- **Frontend:**
  - React 19 (Modern Hooks, Context API)
  - Vite 6
  - Tailwind CSS v4
  - Lucide React (Icons)
  - Recharts (Interactive SVG Charts)
- **Backend:**
  - Python 3.14 / Flask 3.1
  - SQLAlchemy 2.0 ORM (clean abstraction ready for SQLite, PostgreSQL, or MongoDB)
  - Flask-CORS
  - PBKDF2 Password Hashing & JWT Token Authentication
- **Database:**
  - SQLite (default `backend/dineflow.db`), fully swappable with PostgreSQL via `DATABASE_URL`.

---

## 📁 Project Folder Structure

```
c:\final project(1)\
├── backend/
│   ├── routes/
│   │   ├── auth_routes.py          # Authentication & demo role switcher
│   │   ├── dashboard_routes.py     # Live KPIs & sales charts
│   │   ├── tables_routes.py        # Table floor plan & status
│   │   ├── menu_routes.py          # Dishes & recipe mappings
│   │   ├── orders_routes.py        # POS orders & lifecycle
│   │   ├── kitchen_routes.py       # Kitchen Display System
│   │   ├── billing_routes.py       # Bills, invoices & checkout
│   │   ├── inventory_routes.py     # Stock, restock & movements
│   │   ├── suppliers_routes.py     # Vendors & purchase orders
│   │   ├── customers_routes.py     # Customer CRM & order history
│   │   ├── reservations_routes.py  # Bookings & collision prevention
│   │   ├── staff_routes.py         # Staff management & status
│   │   ├── reports_routes.py       # Analytics, AOV & peak hours
│   │   ├── notifications_routes.py # Real-time alerts
│   │   └── settings_routes.py      # Restaurant configuration
│   ├── auth_helper.py              # JWT token generation & role decorators
│   ├── database.py                 # SQLAlchemy engine & session maker
│   ├── inventory_service.py        # Auto-deduction business logic
│   ├── models.py                   # 15 SQLAlchemy database models
│   ├── seed.py                     # Realistic seed data generator
│   ├── requirements.txt            # Python dependencies
│   └── app.py                      # Flask application factory
├── frontend/
│   ├── src/
│   │   ├── components/             # Sidebar, Header, Modal, ReceiptModal, Badges
│   │   ├── context/                # AuthContext, ToastContext
│   │   ├── pages/                  # 15 complete responsive page views
│   │   ├── api.js                  # Centralized REST API client
│   │   ├── App.jsx                 # Main layout & route state
│   │   ├── main.jsx                # React root
│   │   └── index.css               # Tailwind CSS v4 styling & print styles
│   ├── package.json
│   ├── vite.config.js              # Vite config & API proxy to port 5000
│   └── index.html
├── tests/
│   └── test_api_e2e.py             # Automated end-to-end test suite
├── run_backend.py                  # Backend startup launcher
└── README.md
```

---

## 🔑 Demo Login Credentials

You can log in manually or use the **1-Click Quick Demo Login** buttons on the login screen or in the top header:

| Role | Username | Password | Full Name | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | `owner` | `password123` | Vikram Sharma | Super Admin, Full Access, All Modules |
| **Manager** | `manager` | `password123` | Ananya Roy | Daily Operations, Menus, Staff, Analytics |
| **Cashier** | `cashier` | `password123` | Rahul Verma | POS, Bill Settlement, Invoices, Customers |
| **Waiter** | `waiter` | `password123` | Karan Singh | Tableside Orders, Table Status, Reservations |
| **Kitchen Staff** | `chef` | `password123` | Sanjay Kapoor | KDS Active Tickets, Prep States, Inventory |

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 2. Backend Setup & Startup
In a terminal at the project root (`c:\final project(1)`):
```bash
# Install Python packages
python -m pip install -r backend/requirements.txt

# (Optional) Re-seed fresh realistic database:
python -m backend.seed

# Start the Flask API server (runs on http://127.0.0.1:5000):
python run_backend.py
```

### 3. Frontend Setup & Startup
In a separate terminal:
```bash
cd frontend

# Start the Vite development server (runs on http://localhost:5173):
npm run dev
```

Open your browser to **`http://localhost:5173`** and explore!

---

## 🧪 Automated Testing

To run the end-to-end test suite verifying authentication, role boundaries, database models, orders, kitchen transitions, automatic inventory deduction, reservations collision prevention, and billing:
```bash
python -m unittest tests.test_api_e2e
```

---

## 🌐 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `GET` | `/api/dashboard/stats` | Real-time sales, order counts, table occupancy |
| `GET/POST`| `/api/tables` | List tables / Create new table |
| `POST` | `/api/tables/<id>/status` | Update table status (`available`, `occupied`, `reserved`, `cleaning`) |
| `GET/POST`| `/api/menu` | List catalog / Create dish with recipe links |
| `POST` | `/api/menu/<id>/toggle-availability` | Toggle dish available/unavailable |
| `GET/POST`| `/api/orders` | List orders / Create POS order |
| `PUT` | `/api/orders/<id>/status` | Advance status (`new` → `preparing` → `ready` → `served` → `completed`) |
| `GET` | `/api/kitchen/orders` | Active KDS tickets with waiting timers |
| `POST` | `/api/billing/generate` | Compute subtotal, discount, tax, final total |
| `POST` | `/api/billing/<id>/pay` | Process payment via Cash/Card/UPI, free up table |
| `GET/POST`| `/api/inventory` | Stock list with low-stock flags / Add raw item |
| `POST` | `/api/inventory/<id>/restock` | Restock ingredient & log movement audit |
| `POST` | `/api/inventory/<id>/usage` | Record kitchen usage, waste, or trim loss |
| `GET/POST`| `/api/suppliers` | Suppliers list / Add supplier |
| `POST` | `/api/suppliers/purchases` | Create purchase order & restock multiple items |
| `GET/POST`| `/api/customers` | Customer directory & lifetime spend |
| `GET/POST`| `/api/reservations` | Bookings list / Create booking with conflict check |
| `GET/POST`| `/api/staff` | Staff directory / Create staff user |
| `GET` | `/api/reports/analytics` | Financial sales timeline, category share, peak hours |
| `GET` | `/api/notifications` | Unread notifications & real-time triggers |
| `GET/PUT` | `/api/settings` | Restaurant profile, tax rates, operating hours |
