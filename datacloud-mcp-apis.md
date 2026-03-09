# Salesforce Data Cloud (Data 360) — MCP Project API Reference

> **Note:** As of October 2025, Salesforce has rebranded Data Cloud to **Data 360**. APIs remain functionally unchanged. This document uses "Data Cloud" interchangeably.

---

## Authentication Overview

Data Cloud uses a **two-step OAuth flow** — different from standard Salesforce REST APIs.

### Step 1 — Salesforce Access Token
```
POST https://login.salesforce.com/services/oauth2/token
```
- Use JWT Bearer flow (requires signed certificate)
- Required OAuth Scopes:
  - `cdp_ingest_api` — Ingestion API access
  - `cdp_calculated_insight_api` — Calculated Insights
  - `cdp_identityresolution_api` — Identity Resolution
  - `cdp_profile_api` — Profile / DMO data
  - `api` — General Salesforce REST

### Step 2 — Data Cloud Token Exchange
```
POST https://{instance}.salesforce.com/services/a360/token
```
- Exchanges Salesforce token for a tenant-specific Data Cloud token
- Response includes `instance_url` (your DC-specific base URL) and `access_token`
- Use this token for all subsequent Data Cloud API calls

---

## API Groups

---

### 1. Metadata API
> Used to discover available DMOs, DLOs, and field schemas — critical for auto-mapping

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/metadata/` | List all data model objects (DMOs) and their fields |
| GET | `/api/v1/profile/metadata/{objectName}` | Get field-level metadata for a specific DMO |

**Use in MCP:** Feed this response as context to Claude for DMO field mapping proposals.

---

### 2. Data Streams API (Connect REST API)
> Core API for creating and managing data streams — the primary MCP workflow target

Base path: `/services/data/v63.0/ssot`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ssot/data-streams` | List all data streams |
| POST | `/ssot/data-streams` | **Create a new data stream** ← Key endpoint |
| GET | `/ssot/data-streams/{id}` | Get data stream by ID |
| PATCH | `/ssot/data-streams/{id}` | Update a data stream |
| DELETE | `/ssot/data-streams/{id}` | Delete a data stream |
| POST | `/ssot/data-streams/{id}/actions/activate` | Activate a data stream |
| POST | `/ssot/data-streams/{id}/actions/deactivate` | Deactivate a data stream |

**Create Data Stream — key payload fields:**
```json
{
  "name": "My Data Stream",
  "connectorType": "INGESTION_API",
  "sourceObject": "SalesCustomer",
  "dataModelObjects": [
    {
      "name": "Individual",
      "fieldMappings": [
        { "sourceField": "firstName", "targetField": "FirstName" },
        { "sourceField": "lastName", "targetField": "LastName" }
      ]
    }
  ]
}
```

---

### 3. Ingestion API
> Used to push actual data (CSV or streaming JSON) into an existing data stream

**Auth note:** Requires separate JWT auth (signed certificate mandatory)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/{sourceApiName}/{objectName}/actions/streaming` | Stream records in real-time (JSON) |
| POST | `/api/v1/{sourceApiName}/{objectName}/actions/bulkUpsert` | Bulk upsert via CSV |
| POST | `/api/v1/{sourceApiName}/{objectName}/actions/bulkDelete` | Bulk delete records |
| GET | `/api/v1/ingest/jobs` | List bulk ingest jobs |
| GET | `/api/v1/ingest/jobs/{jobId}` | Get job status |
| DELETE | `/api/v1/ingest/jobs/{jobId}` | Delete/close a bulk job |

**Schema requirement:** Before ingesting, an OpenAPI YAML schema must be uploaded to define the object structure. The MCP can auto-generate this from a CSV.

---

### 4. Segments API (Connect REST API)
> Create and manage audience segments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ssot/segments` | List all segments |
| POST | `/ssot/segments` | **Create a new segment** |
| GET | `/ssot/segments/{id}` | Get segment by ID |
| PATCH | `/ssot/segments/{id}` | Update a segment |
| DELETE | `/ssot/segments/{id}` | Delete a segment |
| POST | `/ssot/segments/{id}/actions/run` | Manually trigger segment publish |

**Create Segment — key payload fields:**
```json
{
  "name": "High Value Customers",
  "segmentOn": "Individual",
  "publishSchedule": "DAILY",
  "criteria": {
    "filters": [
      { "field": "LifetimeValue__c", "operator": "GREATER_THAN", "value": "1000" }
    ]
  }
}
```

---

### 5. Identity Resolution API (Connect REST API)
> Create and manage identity resolution rulesets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ssot/identity-resolutions` | List all identity resolution rulesets |
| POST | `/ssot/identity-resolutions` | **Create a new ruleset** |
| GET | `/ssot/identity-resolutions/{id}` | Get ruleset by ID |
| PATCH | `/ssot/identity-resolutions/{id}` | Update a ruleset |
| DELETE | `/ssot/identity-resolutions/{id}` | Delete a ruleset |
| POST | `/ssot/identity-resolutions/{id}/actions/run` | Run identity resolution |

**Rule types supported:** Exact Match (email, phone), Fuzzy Name Match, Normalized Email

---

### 6. Calculated Insights API (Connect REST API)
> Create metric/insight objects using ANSI SQL

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ssot/calculated-insights` | List all calculated insights |
| POST | `/ssot/calculated-insights` | **Create a calculated insight** |
| GET | `/ssot/calculated-insights/{apiName}` | Get by API name (must end in `__cio`) |
| PATCH | `/ssot/calculated-insights/{apiName}` | Update a calculated insight |
| DELETE | `/ssot/calculated-insights/{apiName}` | Delete a calculated insight |
| POST | `/ssot/calculated-insights/{apiName}/actions/run` | Manually run a CI |

---

### 7. Query API
> Query data directly from DMOs, DLOs, and CIOs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/query` | Execute a SQL query against Data Cloud |
| POST | `/api/v2/query` | Query v2 (paginated) |
| GET | `/api/v2/query/{queryId}` | Get next batch of results |

**Use in MCP:** Validate mappings post-activation by querying the DMO directly.

---

### 8. Profile / DMO Lookup API
> Look up individual records and profile data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profile/metadata/{objectName}` | Get DMO field metadata |
| POST | `/api/v1/profile/{objectName}/search` | Search DMO records by filter |
| GET | `/api/v1/profile/{objectName}/{recordId}` | Get record by source ID |

---

### 9. Activation Targets API
> Read-only for now — used to list targets for segment activations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ssot/activation-targets` | List all activation targets |
| GET | `/ssot/activation-targets/{id}` | Get activation target by ID |
| GET | `/ssot/activations` | List all activations |
| POST | `/ssot/activations` | Create an activation |
| DELETE | `/ssot/activations/{id}` | Delete an activation |

---

## MCP Tool Priority Matrix

| Priority | API Group | MCP Tool Name (proposed) | Phase |
|----------|-----------|--------------------------|-------|
| 🔴 P0 | Metadata API | `get_dmo_schema` | Phase 1 |
| 🔴 P0 | Data Streams | `create_data_stream` | Phase 1 |
| 🔴 P0 | Data Streams | `activate_data_stream` | Phase 1 |
| 🟠 P1 | Ingestion API | `generate_openapi_schema` | Phase 1 |
| 🟠 P1 | Ingestion API | `bulk_upsert_csv` | Phase 2 |
| 🟡 P2 | Segments | `create_segment` | Phase 2 |
| 🟡 P2 | Identity Res | `create_identity_ruleset` | Phase 2 |
| 🟢 P3 | Calc Insights | `create_calculated_insight` | Phase 3 |
| 🟢 P3 | Query API | `validate_mapping_query` | Phase 3 |
| 🟢 P3 | Activations | `activate_segment` | Phase 3 |

---

## Important Constraints

- **Ingestion API requires a signed certificate** — cannot use standard OAuth client credentials
- **Data Streams Connect API** uses standard Salesforce REST OAuth — easier to set up
- **CI API names** must end in `__cio`
- **Ingestion schemas** must be valid OpenAPI 3.0 YAML; max 1000 fields per object; no nested objects
- **Segments** require mapped DMOs + established relationships before they can be created
- **Identity Resolution** must run before segments referencing unified profiles are valid
- The Connect REST API base URL is tenant-specific — obtained from the token exchange response
