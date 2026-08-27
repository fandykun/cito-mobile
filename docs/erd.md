# Vet Clinic Management System — ERD & Architecture Flow

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    OWNER ||--o{ PET : owns
    PET ||--o{ VISIT : has
    PET ||--o{ VACCINATION : has
    VISIT ||--o{ VISIT_ITEM : includes
    INVENTORY_ITEM ||--o{ VISIT_ITEM : "used in"
    INVENTORY_ITEM ||--o{ RETAIL_TRANSACTION_ITEM : "sold in"
    RETAIL_TRANSACTION ||--o{ RETAIL_TRANSACTION_ITEM : includes
    VISIT ||--o| DAILY_SUMMARY : "rolls into"
    RETAIL_TRANSACTION ||--o| DAILY_SUMMARY : "rolls into"
    EXPENSE ||--o| DAILY_SUMMARY : "rolls into"
    DAILY_SUMMARY ||--o| MONTHLY_SUMMARY : "rolls into"
    OWNER_DRAW ||--o| MONTHLY_SUMMARY : "rolls into"

    APP_USER {
        uuid id PK
        string username
        string password_hash
        int session_duration_hours "configurable, e.g. 24-72"
        datetime last_login_at
        datetime created_at
    }

    OWNER {
        uuid id PK
        string name
        string contact
        datetime created_at
    }

    PET {
        uuid id PK
        uuid owner_id FK
        string name
        string species
        string breed
        date dob
        decimal current_weight
        text allergies
        text chronic_conditions
        datetime created_at
        datetime updated_at
    }

    VACCINATION {
        uuid id PK
        uuid pet_id FK
        string vaccine_type
        date date_given
        date next_due_date
    }

    INVENTORY_ITEM {
        uuid id PK
        string name
        string category
        string unit
        decimal cost_price
        decimal selling_price
        int stock_quantity
        int low_stock_threshold
        date expiry_date
        datetime updated_at
    }

    VISIT {
        uuid id PK
        uuid pet_id FK
        date visit_date
        text reason
        text clinical_observations
        text diagnosis
        text treatment_plan
        text vet_notes
        decimal service_fee
        decimal visit_income
        decimal visit_cost
        decimal visit_profit
        boolean synced
        datetime created_at
        datetime updated_at
    }

    VISIT_ITEM {
        uuid id PK
        uuid visit_id FK
        uuid inventory_item_id FK
        int quantity
        decimal cost_price_at_time
        decimal selling_price_at_time
    }

    RETAIL_TRANSACTION {
        uuid id PK
        date transaction_date
        decimal total_amount
        string payment_method
        string receipt_number
        string pdf_receipt_path
        boolean synced
        datetime created_at
    }

    RETAIL_TRANSACTION_ITEM {
        uuid id PK
        uuid transaction_id FK
        uuid inventory_item_id FK
        int quantity
        decimal cost_price_at_time
        decimal selling_price_at_time
    }

    EXPENSE {
        uuid id PK
        date expense_date
        string category
        decimal amount
        text note
        boolean synced
    }

    OWNER_DRAW {
        uuid id PK
        date draw_date
        decimal amount
        text note
        boolean synced
    }

    DAILY_SUMMARY {
        date summary_date PK
        decimal medical_income
        decimal retail_income
        decimal total_expense
        decimal net
        decimal cash_opening
        decimal cash_expected_closing
        decimal cash_actual_closing
    }

    MONTHLY_SUMMARY {
        string month_key PK
        decimal gross_income
        decimal operating_expenses
        decimal net_profit
        decimal total_draw
        decimal retained
    }
```

**Notes on the ERD:**
- `VISIT_ITEM` and `RETAIL_TRANSACTION_ITEM` both snapshot `cost_price_at_time` / `selling_price_at_time` from `INVENTORY_ITEM` — so historical records stay accurate even if prices change later.
- `DAILY_SUMMARY` and `MONTHLY_SUMMARY` are **derived/computed** tables (materialized for fast reads), not manually entered — rebuilt from `VISIT`, `RETAIL_TRANSACTION`, `EXPENSE`, and `OWNER_DRAW` records.
- `synced` boolean fields exist on records created offline, to track what's pending upload to the backend.
- `PET` and `VISIT` include `updated_at` since both are editable after creation (correcting profile info, amending a diagnosis/notes) — `created_at` is preserved as the original record date, `updated_at` reflects the latest edit.
- `APP_USER` is a standalone entity (not connected by foreign key to clinic data) — it exists purely to gate login access. Since there's only one user and no roles/scopes, clinic records don't need a `user_id` ownership column; the account is provisioned manually (no self-registration flow) and simply controls whether the app can be opened at all.

---

## 2. System Architecture Flow

### 2.1 High-Level Architecture

```mermaid
flowchart TB
    subgraph Mobile["Mobile App (Android/iOS — React Native)"]
        UI[UI Layer<br/>Screens & Navigation]
        LOGIC[App Logic<br/>State Management]
        LOCALDB[(Local DB<br/>Expo SQLite + SQLCipher<br/>Encrypted)]
        PDFGEN[PDF Receipt<br/>Generator]
        SYNCQ[Sync Queue<br/>Manager]
    end

    subgraph Backend["Backend (Go API)"]
        API[REST API<br/>Gin/Echo]
        AUTH[Auth Middleware<br/>Username/Password + JWT]
        BIZLOGIC[Business Logic<br/>Services]
        SYNCSVC[Sync Service<br/>Conflict-free, single-user]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL<br/>Encrypted at rest)]
        BACKUP[(Automated Backups)]
    end

    UI --> LOGIC
    LOGIC --> LOCALDB
    LOGIC --> PDFGEN
    LOGIC --> SYNCQ
    SYNCQ -.->|when online| API
    API --> AUTH
    AUTH --> BIZLOGIC
    BIZLOGIC --> SYNCSVC
    SYNCSVC --> PG
    PG --> BACKUP

    style Mobile fill:#e8f0fe
    style Backend fill:#fef3e8
    style Data fill:#e8fef0
```

### 2.2 Medical Visit Flow

```mermaid
sequenceDiagram
    participant Owner as Owner (App User)
    participant App as Mobile App
    participant Local as Local Encrypted DB
    participant Sync as Sync Queue
    participant API as Backend API
    participant DB as PostgreSQL

    Owner->>App: Open pet profile, start new visit
    App->>Local: Load pet history (offline-capable)
    Owner->>App: Enter clinical observations, diagnosis, treatment
    Owner->>App: Select medicine/items used
    App->>Local: Auto-fetch cost/selling price, deduct stock
    App->>App: Calculate visit income, cost, profit
    App->>Local: Save visit record (marked unsynced)
    Local->>Sync: Queue for sync
    alt Online
        Sync->>API: POST /visits
        API->>DB: Persist visit + update inventory
        API-->>Sync: Ack
        Sync->>Local: Mark synced
    else Offline
        Sync-->>App: Remains queued
        Note over App,Sync: Retries automatically on reconnect
    end
    App->>Local: Update daily summary (medical income)
```

### 2.3 Retail Transaction Flow (Fast Checkout)

```mermaid
sequenceDiagram
    participant Owner as Owner (App User)
    participant App as Mobile App
    participant Local as Local Encrypted DB
    participant PDF as PDF Generator
    participant Sync as Sync Queue
    participant API as Backend API

    Owner->>App: Open Retail Checkout
    Owner->>App: Search/select item(s), set quantity
    App->>Local: Fetch selling price, running total
    Owner->>App: Confirm payment method & complete sale
    App->>Local: Deduct stock, save transaction (unsynced)
    App->>PDF: Generate receipt PDF (offline-capable)
    PDF-->>Owner: Receipt ready to view/share
    App->>Local: Update daily summary (retail income)
    Local->>Sync: Queue for sync
    Sync-->>API: POST /retail-transactions (when online)
```

### 2.4 Monthly Financial Rollup Flow

```mermaid
flowchart LR
    A[Visit Records] --> D[Daily Summary]
    B[Retail Transactions] --> D
    C[Expenses] --> D
    D --> E[Monthly Summary]
    F[Owner's Draw entries] --> E
    E --> G{Owner reviews}
    G --> H[Gross Income]
    G --> I[Operating Expenses]
    G --> J[Net Profit]
    G --> K[Amount Drawn]
    G --> L[Retained in Clinic]
```

### 2.5 Offline-First Sync Strategy

- **Local-first writes**: every create/update (visit, retail transaction, expense, draw) writes to the local encrypted DB first, so the UI never blocks on network
- **Sync queue**: unsynced records are queued and pushed to the backend API in the background whenever connectivity is detected
- **Single-user simplification**: since there's only one user/device, there's no concurrent-edit conflict resolution needed — sync is a straightforward "push local changes, pull any backend-side derived data (e.g., recalculated summaries)"
- **Derived summaries**: daily/monthly summaries can be computed locally for immediate display, and recomputed/verified server-side once synced, as the source of truth
- **PDF receipts**: generated entirely on-device (no server dependency), so retail checkout speed is unaffected by connectivity

### 2.6 Security Layers

| Layer | Protection |
|---|---|
| App login | Required at launch — single, manually-provisioned account (username/password); no self-registration. Session token persists for a **configurable duration** (default ~1–3 days); supports offline login via securely cached credentials |
| Local storage | Encrypted local DB (e.g., SQLCipher) — no plaintext medical data at rest on device |
| Transport | TLS/HTTPS for all API calls |
| Backend storage | Encrypted PostgreSQL (at-rest encryption), access restricted to authenticated API |
| Backups | Automated, encrypted backups of the backend database |

---

## 3. Suggested Tech Stack (aligned with existing stack)

| Layer | Choice |
|---|---|
| Mobile framework | React Native via **Expo** (cross-platform Android/iOS, reuses React/TS knowledge) |
| Build/distribution | **Expo EAS Build** — compiles and signs iOS apps in the cloud, no Mac/Xcode required; distributes via TestFlight or direct install |
| Local DB | SQLite via Expo SQLite with SQLCipher |
| PDF generation | On-device library (e.g., `react-native-html-to-pdf` or `pdf-lib`) |
| Backend | Go (Gin or Echo framework) |
| Backend DB | PostgreSQL |
| Auth | Manually provisioned username/password login with JWT sessions |
| Hosting | Any standard cloud VM/managed Postgres — can stay minimal given single-user scale |

**Note on Expo + EAS**: Using Expo (rather than bare React Native) is recommended here specifically because of the no-Mac constraint — Expo's managed workflow plus EAS Build means iOS compilation, code signing, and even App Store/TestFlight submission all happen on Expo's cloud infrastructure. Local development and testing can still happen on Android freely; for iOS testing, builds are installed via TestFlight or Expo's development client on a physical/borrowed iPhone when needed.