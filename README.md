# SwasthiQ — Pharmacy Module

## Demo Video

A short demonstration of the application — including inventory updates, sales deduction, dashboard updates, and UI interactions — can be viewed here:

https://youtu.be/FwG7yynRumM


**Note:** The backend is hosted on Render's free tier, which spins down after periods of inactivity. The first request may take 30–60 seconds as the server cold-starts. Subsequent requests will respond normally.

---

## Technical Explanation

---

### 1. REST API Structure

The backend is built with **FastAPI** and follows RESTful conventions. I split the API into three router modules, each responsible for a clear domain:

- **`/medicines`** — Inventory operations: listing, creation, update, status changes, and sale creation.
- **`/sales`** — Sales records: listing all sales and retrieving individual sale details.
- **`/dashboard`** — Aggregated analytics: sales summary, items sold, low-stock alerts, purchase overview, and recent sales.

HTTP methods are used according to their semantic purpose:

| Method  | Purpose                          | Example                        |
|---------|----------------------------------|--------------------------------|
| `GET`   | Retrieve data without mutation   | `GET /medicines`               |
| `POST`  | Create a new resource            | `POST /medicines`              |
| `PUT`   | Fully replace an existing record | `PUT /medicines/{id}`          |
| `PATCH` | Partially update a single field  | `PATCH /medicines/{id}/status` |

**Complete endpoint reference:**

**Medicines** (`/medicines`)

| Method  | Endpoint                   | Description                                      |
|---------|----------------------------|--------------------------------------------------|
| `GET`   | `/medicines`               | List all medicines (supports `?search=` and `?status=` filters) |
| `POST`  | `/medicines`               | Add a new medicine                               |
| `PUT`   | `/medicines/{id}`          | Update all fields of an existing medicine         |
| `PATCH` | `/medicines/{id}/status`   | Update only the status field                     |
| `POST`  | `/medicines/sales`         | Create a sale (validates stock, deducts quantity) |

**Sales** (`/sales`)

| Method  | Endpoint         | Description                              |
|---------|------------------|------------------------------------------|
| `GET`   | `/sales`         | List all sales, most recent first        |
| `GET`   | `/sales/{id}`    | Retrieve a single sale by ID             |

**Dashboard** (`/dashboard`)

| Method  | Endpoint                        | Description                              |
|---------|---------------------------------|------------------------------------------|
| `GET`   | `/dashboard/sales-summary`      | Total revenue and transaction count      |
| `GET`   | `/dashboard/items-sold`         | Total quantity of items sold             |
| `GET`   | `/dashboard/low-stock`          | Medicines with low or zero stock         |
| `GET`   | `/dashboard/purchase-summary`   | Total inventory count and stock value    |
| `GET`   | `/dashboard/recent-sales`       | Last 10 sales with customer details      |

All endpoints return a **structured JSON response** using a consistent envelope:

```json
{
  "success": true,
  "data": ...
}
```

This keeps frontend integration predictable and consistent across endpoints.

**Request validation** is handled through **Pydantic schemas**. Every incoming payload is checked against a typed model before it reaches any business logic. Fields have constraints like minimum lengths, value bounds, and regex patterns — if something doesn't match, FastAPI rejects it with a `422 Unprocessable Entity` before my code even runs.

**Response serialization** works the same way — dedicated output schemas (`MedicineOut`, `SaleOut`, `RecentSale`, etc.) make sure only the right fields are sent back to the client. No accidental data leakage.

**Database interaction** is managed through **SQLAlchemy ORM**, with models defined separately from schemas and routers:

```
backend/
  main.py          — Application entry point, CORS, router mounting
  database.py      — Engine, session factory, dependency injection
  models.py        — SQLAlchemy ORM models (Medicine, Sale)
  schemas.py       — Pydantic request/response schemas
  routers/
    medicines.py   — Inventory and sale creation endpoints
    sales.py       — Sales listing and retrieval endpoints
    dashboard.py   — Analytics and aggregation endpoints
```

I kept things separated this way so that changes to the database schema, validation rules, or routing logic don't bleed into each other.

---

### 2. Data Consistency and Business Logic

Rather than letting status be set manually (which is easy to get wrong), I made it **computed automatically** through a single `compute_status()` function:

```python
def compute_status(quantity: int, expiry_date: date) -> str:
    if quantity == 0:
        return "out_of_stock"
    if expiry_date < date.today():
        return "expired"
    if quantity < 10:
        return "low_stock"
    return "active"
```

This function runs at every point where medicine state could change:

- **Creation** — Status is set based on the initial quantity and expiry date.
- **Update** — Status is recalculated after any field modification.
- **Sale deduction** — After reducing stock, status is recomputed to reflect the new quantity.

The idea is simple — `quantity` and `status` should never contradict each other. By deriving status from quantity and expiry date every time, they can't fall out of sync. The low-stock threshold is **fewer than 10 units**, which gives enough early warning before stock runs out.

The **sales endpoint** enforces additional checks before processing a transaction:

1. The referenced medicine must exist (otherwise, `404 Not Found`).
2. The requested quantity must not exceed available stock (otherwise, `400 Bad Request`).
3. On success, the quantity is decremented, status is recomputed, and the sale record is persisted within a single database transaction.

This way, inventory stays accurate no matter how many sales come in or in what order.

---

### 3. Deployment Architecture and Disclaimer

The project is deployed across two platforms:

- **Backend** — Hosted on **Render**, running FastAPI with Uvicorn.
- **Frontend** — Hosted on **Vercel**, serving the production React build.

**SQLite** was chosen for its simplicity and zero-configuration setup, which fits the scope of this assignment. It still provides proper relational modeling and transactional integrity — without the overhead of provisioning a separate database server.

The database is **seeded with sample data** — a set of medicines and sales transactions — so the application demonstrates meaningful functionality on first access.

**Note on Render's free-tier ephemeral storage:**

Render's free-tier instances use ephemeral filesystems, which means the SQLite database file may reset when the service restarts or provisions a fresh container. As a result:

- Previously added data may not persist across deployments or cold starts.
- However, all API calls during a runtime session are fully functional. Any medicine created, updated, or sold through the frontend is processed through real API calls and updates the database in real time.
- **Initial load delay:** Render's free-tier instances spin down after periods of inactivity. The first request after idle may take 30–60 seconds as the server cold-starts. Subsequent requests will respond normally.

This was a **deliberate tradeoff** within the scope of this assignment. In production, I'd move to PostgreSQL or a similar persistent store. For now, the setup is enough to show that the full pipeline — frontend to API to database — works correctly.

---

### 4. Technical Challenges Faced

#### UI Matching

Getting the frontend to closely match the reference screenshots took more iteration than expected. Small details — spacing, badge colors, icon sizing, section ordering — required careful iteration. I wanted to stay faithful to the reference without ending up with messy or brittle CSS.

#### Render Deployment and Python Version Constraints

Render's default Python 3.14 environment broke the build — `pydantic-core` has Rust-based C extensions that aren't compatible with that version yet. It took some debugging to figure out, but pinning Python to **3.11.9** via `runtime.txt` fixed it cleanly.

#### Logical Integrity and Edge Cases

Making sure a medicine's status stays correct throughout its lifecycle — across creation, edits, and sales — was something I had to think through carefully. A few specific edge cases I addressed:

- **Preventing negative stock:** The sales endpoint validates available quantity before deduction.
- **Dashboard accuracy:** All dashboard endpoints query live data, ensuring summary cards and alerts reflect the current database state.

I handled these through consistent patterns in the codebase rather than patching things case by case.

---

### 5. Closing Statement

This project was built with a focus on getting the fundamentals right — clean API design, consistent data handling, and a well-structured frontend. Choices like centralized status logic, a uniform response format, and reusable components weren't over-engineering; they just made the codebase easier to work with.

I tried to stay as close to the reference design as possible, keep the backend and frontend cleanly separated, and make sure the whole system works end to end — not just individual pieces in isolation. It's a balance between doing things properly and staying within assignment scope, and I believe the result reflects that.

---

### Dev Docs — Running Locally

**Prerequisites**
- Python 3.11+
- Node.js 18+
- npm

**1. Clone the repository**

```bash
git clone https://github.com/your-username/SwasthiQ.git
cd SwasthiQ
```

**2. Start the backend**

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`. You can verify by visiting `http://127.0.0.1:8000/docs` for the auto-generated Swagger UI.

**3. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

The app will open at `http://localhost:3000` (or whichever port Vite assigns).

**4. Project structure**

```
SwasthiQ/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy engine and session
│   ├── models.py            # ORM models (Medicine, Sale)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── runtime.txt          # Python version pin for Render
│   ├── requirements.txt     # Python dependencies
│   └── routers/
│       ├── medicines.py     # Inventory + sale creation endpoints
│       ├── sales.py         # Sales listing endpoints
│       └── dashboard.py     # Analytics endpoints
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Inventory.jsx
│   │   ├── components/
│   │   │   ├── SummaryCard.jsx
│   │   │   ├── MedicineTable.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── AddMedicineModal.jsx
│   │   │   └── NewSaleModal.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

**Notes**
- The SQLite database (`pharmacy.db`) is auto-created on first backend startup. Delete it and restart to get a clean slate.
- The frontend expects the backend at `http://127.0.0.1:8000`. If you change the port, update `baseURL` in `frontend/src/services/api.js`.
- No authentication is required. All endpoints are open.
