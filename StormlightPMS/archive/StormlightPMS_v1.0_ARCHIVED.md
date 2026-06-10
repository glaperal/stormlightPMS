> **ARCHIVED — provenance only. Not a build contract.**
>
> This is the original combined "v1.0" PRD / SRS / Implementation Plan for StormlightPMS, captured verbatim for the record. Despite its "v1.0" label it is **conceptually older** than `StormlightPMS_SRS_v0.2.md` (the version numbers were inverted). It was reconciled into the canonical spec on 2026-06-07.
>
> - Canonical build contract: `../StormlightPMS_SRS_v0.2.md` (now at in-document version **v0.3**).
> - Reconciliation rationale and full divergence map: `../StormlightPMS_Spec_Reconciliation.md`.
> - Its three signature PH features (PDC Vault, BIR Form 2307 / CWT, utility sub-metering) and an optional polymorphic unit-spec model were **pulled into MVP scope** (decisions D5–D8) and re-homed onto v0.2's normalized architecture. Its `landlord_id` tenancy model, single `financial_ledger` table, and Shadcn/`react-jsonschema-form` UI stack were **superseded** by v0.2's `org_id`+RLS model, normalized money tables, and Tailwind/RHF/Zod stack.
>
> Do not implement from this document. Use the canonical SRS.

---

# Stormlight Property Management System (PMS)
## Complete PRD, SRS, and Implementation Plan (v1.0)

---

# Part 1: Product Requirement Document (PRD)

## 1. Executive Summary & Vision
Stormlight PMS is a specialized B2B property management platform designed to automate the operational and financial workflows of Filipino landlords, family estates, and property management firms.

Unlike global platforms (e.g., Buildium, AppFolio) that rely on automated credit card billing and US tax structures, Stormlight natively solves the core friction points of Philippine real estate: Post-Dated Check (PDC) lifecycle management, BIR Form 2307 (Creditable Withholding Tax) reconciliation, utility sub-metering, and tracking physical, notarized lease documents for eviction compliance. Phase 1 is built strictly for internal landlord operations; there is no tenant-facing portal.

## 2. Target Audience & User Personas
*   **The Landlord / Asset Manager (Decision Maker):** Needs consolidated portfolio views, automated rent roll generation, vacancy tracking, and strict tax compliance visibility to prevent revenue leakage.
*   **The Leasing Manager (Power User):** Manages the daily pipeline of unit availability, inputs complex lease terms (escalation rates, CUSA), performs utility sub-metering calculations, and tracks the physical status of notarized contracts.
*   **The Collection & Accounting Officer (Controller):** Requires a digital vault to track PDCs, match bank deposits (InstaPay/PESONet/OTC) to tenant ledgers, and hold ledgers as "Uncleared" until the physical BIR Form 2307 is submitted by the tenant.

## 3. Core Epics & Feature Requirements

### Epic 1: Polymorphic Inventory Management
The system must support diverse asset classes without requiring distinct database tables for each, preventing schema bloat.
*   **FR-1.1:** Standardize parent properties (e.g., *Residential Building, Commercial Building, Warehouse, Raw Land*).
*   **FR-1.2:** Implement dynamic, schema-driven UI inputs for sub-units (e.g., a "Warehouse" unit form asks for *Apex Height* and *Loading Docks*; a "Condo" form asks for *Floor Number* and *Balcony Sqm*).

### Epic 2: Localized Financial & Collection Engine
*   **FR-2.1: PDC Digital Vault:** Track check numbers, issuing banks, maturity dates, and status (*Vaulted, Deposited, Cleared, Bounced, Stale*).
*   **FR-2.2: Utility Sub-Metering:** Interface to input main utility bills (Meralco, Maynilad) alongside individual sub-meter readings, automatically calculating and appending the charges to the next tenant invoice.
*   **FR-2.3: Escalation Logic:** Support multi-year compounding rent escalation schedules.

### Epic 3: BIR Compliance & Workflow Hardening
*   **FR-3.1: Form 2307 Ledger Split:** Automatically calculate the standard 5% Creditable Withholding Tax (CWT) deduction for commercial leases.
*   **FR-3.2: Escrow Clearance:** A strict system rule preventing a rent ledger from being marked "Settled" if the cash is paid but the Form 2307 is missing.

---

# Part 2: Software Requirement Specification (SRS)

## 1. System Architecture
Stormlight PMS utilizes a modern, decoupled, multi-tenant architecture designed for speed, low maintenance costs, and strict data isolation.

*   **Frontend Client:** React.js (via Vite) configured as a Single Page Application (SPA).
*   **UI Framework:** Tailwind CSS and Shadcn UI (for complex data tables, modals, and dynamic forms).
*   **Backend / API:** Supabase (PostgREST API).
*   **Database:** PostgreSQL (hosted via Supabase).
*   **Authentication & Security:** Supabase Auth (JWT) tied directly to Row Level Security (RLS) policies.
*   **Storage:** Supabase Object Storage (for lease PDFs, deposit slips, and tax documents).

## 2. Database Schema (PostgreSQL)

```sql
-- Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Landlords (SaaS Tenants)
CREATE TABLE landlords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    tin_number VARCHAR(50) NOT NULL,
    is_vat_registered BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Properties (Parent Assets)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID REFERENCES landlords(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    property_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Units (Polymorphic Children)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    unit_number VARCHAR(50) NOT NULL,
    base_rent_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Vacant',
    specs JSONB NOT NULL DEFAULT '{}'::jsonb, -- Dynamic asset parameters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tenants (Lessees)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID REFERENCES landlords(id) ON DELETE CASCADE NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    tin_number VARCHAR(50),
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Leases (Contracts)
CREATE TABLE leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) RESTRICT NOT NULL,
    tenant_id UUID REFERENCES tenants(id) RESTRICT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_base_rent NUMERIC(12, 2) NOT NULL,
    cusa_fee NUMERIC(12, 2) DEFAULT 0.00,
    withholding_tax_rate NUMERIC(4, 2) DEFAULT 5.00,
    escalation_config JSONB DEFAULT '{}'::jsonb,
    notarized_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Financial Ledger (Invoices/PDCs)
CREATE TABLE financial_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID REFERENCES leases(id) ON DELETE RESTRICT NOT NULL,
    due_date DATE NOT NULL,
    gross_amount NUMERIC(12, 2) NOT NULL,
    cwt_deduction NUMERIC(12, 2) DEFAULT 0.00,
    net_payable_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Unpaid', -- 'Unpaid', 'Pending Form 2307', 'Settled'
    pdc_metadata JSONB DEFAULT '{}'::jsonb,
    proof_of_payment_url TEXT,
    form_2307_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Security & Multi-Tenancy (Row Level Security)
Strict data isolation is enforced at the database level.

```sql
-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;

-- Landlord ID mapping must be established in the JWT claims during Auth.
-- Assuming custom JWT claim contains 'app_metadata.landlord_id'

CREATE POLICY isolate_properties ON properties
    FOR ALL USING (landlord_id = (auth.jwt() -> 'app_metadata' ->> 'landlord_id')::uuid);

CREATE POLICY isolate_tenants ON tenants
    FOR ALL USING (landlord_id = (auth.jwt() -> 'app_metadata' ->> 'landlord_id')::uuid);

-- Units rely on the property_id to trace back to landlord
CREATE POLICY isolate_units ON units
    FOR ALL USING (
        property_id IN (SELECT id FROM properties WHERE landlord_id = (auth.jwt() -> 'app_metadata' ->> 'landlord_id')::uuid)
    );
```

### 4. Frontend Dynamic Schema Interpretation
The React frontend uses standard JSON schemas to render the polymorphic `units.specs` field.

```javascript
// Example Schema: Standard Factory Building (SFB)
const SFBSchema = {
  type: "object",
  required: ["ceiling_clearance_m", "three_phase_power"],
  properties: {
    ceiling_clearance_m: { type: "number", title: "Ceiling Clearance (Meters)" },
    three_phase_power: { type: "boolean", title: "3-Phase Power Available" },
    floor_load_kg_sqm: { type: "number", title: "Floor Load Capacity (kg/sqm)" }
  }
};
```

## Part 3: Implementation Plan (Phased Rollout)

### Phase 1: Foundation & Data Architecture (Weeks 1-2)
* Objective: Establish the Supabase project, execute schema migrations, configure Auth, and set up the React/Vite repository.
* Key Tasks:
   1. Provision Supabase project.
   2. Execute SQL scripts for tables, relationships, and RLS policies.
   3. Configure Supabase Auth to inject `landlord_id` into JWT `app_metadata` upon user creation.
   4. Scaffold React app, configure Tailwind, and set up routing.
* Deliverable: A secure database accessible via an authenticated, blank React application.

### Phase 2: Core Entity Management (Weeks 3-4)
* Objective: Build the CRUD (Create, Read, Update, Delete) interfaces for Properties, Units, and Tenants.
* Key Tasks:
   1. Implement Shadcn UI data tables for the Property and Tenant lists.
   2. Build the Property Creation wizard.
   3. Implement the Dynamic Form Engine (`react-jsonschema-form` or custom implementation) to handle the polymorphic `units.specs` input based on selected property type.
* Deliverable: Users can fully map their physical portfolio and tenant database into the system.

### Phase 3: Lease Contract & Ledger Generation (Weeks 5-6)
* Objective: Connect Tenants to Units via Leases and auto-generate the financial ledger.
* Key Tasks:
   1. Build the Lease Creation form (selecting Unit, Tenant, dates, and base rent).
   2. Implement the Ledger Generation Logic: A background function (Supabase Edge Function or database trigger) that automatically generates 12 (or applicable) rows in the `financial_ledger` table upon lease creation.
   3. Build the Rent Roll view (a unified data table of all current and upcoming ledger items).
* Deliverable: The core financial skeleton is live; future receivables are mathematically projected.

### Phase 4: Localized Workflows (Weeks 7-8)
* Objective: Implement PDC tracking, Form 2307 handling, and utility sub-metering.
* Key Tasks:
   1. Build the PDC Vault Module: A specialized view of the `financial_ledger` filtered by payment type, allowing bulk status updates (e.g., marking 5 checks as "Deposited").
   2. Build the Utility Sub-Metering Module: An interface to select a Property, input the master bill, input the sub-meter readings for all active leases, and execute a script to append those charges to the next pending ledger row.
   3. Configure Supabase Storage buckets for uploading deposit slips and BIR forms, linking the URL to the ledger row.
* Deliverable: The system fully handles Philippine-specific real estate friction points.

### Phase 5: UAT & Production Deployment (Week 9)
* Objective: Testing, bug fixing, and go-live.
* Key Tasks:
   1. User Acceptance Testing (UAT) with a pilot landlord.
   2. Refine UI/UX based on physical workflow observations.
   3. Deploy frontend to Vercel (or similar edge network).
* Deliverable: V1.0 of Stormlight PMS is live and operational.
