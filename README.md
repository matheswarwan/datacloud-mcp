# salesforce-datacloud-mcp

MCP server for **Salesforce Data Cloud (Data 360)**. Connects Claude Desktop (or any MCP client) to your Data Cloud org so you can explore and manage the full platform — data streams, DMOs, segments, calculated insights, identity resolution, data graphs, activations, connections, profile data, ML models, clean rooms, and more — through natural language.

## Tools

### Data Streams & Segments

| Tool | What it does |
|------|-------------|
| `get_data_streams` | List all data streams with status and connector type |
| `get_segments` | List all segments in the org |
| `publish_segment` | Publish / refresh a segment to an activation target |

### Data Model Objects (DMOs)

| Tool | What it does |
|------|-------------|
| `get_dmo_schema` | Inspect fields on one or more DMOs (filterable by name) |
| `get_dmo_mapping` | Show how a data stream's fields map to a DMO |
| `propose_dmo_field_mapping` | AI-suggested field mappings between a stream and a DMO |
| `apply_dmo_field_mapping` | Write a proposed field mapping back to Data Cloud |
| `remove_dmo_field_mapping` | Remove a field mapping from a DMO |

### Data Lake Objects

| Tool | What it does |
|------|-------------|
| `get_data_lake_objects` | List all DLOs or fetch a specific one by name/ID (includes fields and schema) |

### Data Transforms

| Tool | What it does |
|------|-------------|
| `get_data_transforms` | List transforms, get a single one, or fetch its run history / schedule |
| `upsert_data_transform` | Create or update a data transform (SQL or STL definition) |

### Calculated Insights

| Tool | What it does |
|------|-------------|
| `get_calculated_insights` | List all calculated insights and their SQL |
| `propose_ci_sql` | Generate SQL for a new calculated insight from a description |
| `create_calculated_insight` | Create a new calculated insight in the org |
| `run_calculated_insight` | Trigger a calculated insight to refresh |

### Identity Resolution

| Tool | What it does |
|------|-------------|
| `get_identity_resolutions` | List IDR rulesets or fetch a specific one (match rules, reconciliation rules) |

### Data Graphs

| Tool | What it does |
|------|-------------|
| `get_data_graphs` | List data graph metadata, fetch a specific graph, or look up data by entity/ID |

### Data Actions & Targets

| Tool | What it does |
|------|-------------|
| `get_data_actions` | List Data Actions or Data Action Targets; fetch a specific target by API name |

### Activations

| Tool | What it does |
|------|-------------|
| `get_activations` | List activations, activation targets, or external platforms; get activation data |

### Connections & Connectors

| Tool | What it does |
|------|-------------|
| `get_connections` | List connections or connectors; get endpoints, schema, or sitemap for a connection |

### Data Spaces

| Tool | What it does |
|------|-------------|
| `get_data_spaces` | List data spaces, get a specific one, or list its members |

### Profile API

| Tool | What it does |
|------|-------------|
| `get_profile` | Fetch profile metadata or query profile records for a data model |

### Insight Data

| Tool | What it does |
|------|-------------|
| `get_insight_data` | Fetch insight metadata or query calculated insight data with filters/dimensions |

### Query

| Tool | What it does |
|------|-------------|
| `query_data` | Submit a SQL query, check job status, or fetch result rows |

### Search Index

| Tool | What it does |
|------|-------------|
| `get_search_index` | List search indexes, get global config, or fetch a specific index |

### Machine Learning

| Tool | What it does |
|------|-------------|
| `get_ml_models` | List configured models, model artifacts, or model setup versions |

### Document Processing

| Tool | What it does |
|------|-------------|
| `get_document_processing` | List document processing configurations or fetch global config |

### Data Clean Room

| Tool | What it does |
|------|-------------|
| `get_data_clean_room` | List collaborations, providers, specifications, or templates; get collaboration jobs |

### Data Kits

| Tool | What it does |
|------|-------------|
| `get_data_kits` | Get component dependencies or deployment status for a data kit component |

### Metadata & Limits

| Tool | What it does |
|------|-------------|
| `get_metadata` | Fetch general SSOT metadata (filterable by entity type, name, category, data space) |
| `get_limits` | Get org API limits or current user info |

## Prerequisites

A Salesforce **Connected App** with OAuth scope `api` and the flow you intend to use enabled (see Auth Methods below).

## Auth Methods

### client_credentials (default)

Headless machine-to-machine auth. Enable **Client Credentials Flow** on the Connected App.

Required env vars: `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, `SF_USERNAME`, `SF_PASSWORD`, `SF_LOGIN_URL`

### jwt

JWT Bearer flow. The user must be pre-authorised on the Connected App. Generate a key pair and upload the certificate to the Connected App.

Required env vars: `SF_CLIENT_ID`, `SF_USERNAME`, `SF_LOGIN_URL`, and either:
- `SF_PRIVATE_KEY` — PEM content as a string (recommended for hosted/cloud environments)
- `SF_PRIVATE_KEY_PATH` — absolute path to the `.key` file (local use only)

## Configuration

| Env var | Required | Description |
|---------|----------|-------------|
| `SF_CLIENT_ID` | Yes | Consumer key from the Connected App |
| `SF_LOGIN_URL` | Yes | Your org's My Domain URL (e.g. `https://yourorg.my.salesforce.com`) |
| `SF_AUTH_METHOD` | No | `client_credentials` (default) or `jwt` |
| `SF_CLIENT_SECRET` | For `client_credentials` | Consumer secret from the Connected App |
| `SF_USERNAME` | For `client_credentials` + `jwt` | Salesforce username |
| `SF_PASSWORD` | For `client_credentials` | Salesforce password |
| `SF_PRIVATE_KEY` | For `jwt` | PEM private key content |
| `SF_PRIVATE_KEY_PATH` | For `jwt` (local) | Absolute path to `.key` file |
| `TOKEN_EXPIRY_BUFFER` | No | Seconds before expiry to refresh token (default `300`) |

## Setup (Claude Desktop — npx)

No install needed. Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "salesforce-datacloud-mcp": {
      "command": "npx",
      "args": ["-y", "salesforce-datacloud-mcp"],
      "env": {
        "SF_AUTH_METHOD": "client_credentials",
        "SF_CLIENT_ID": "3MVG9...",
        "SF_CLIENT_SECRET": "71F892...",
        "SF_USERNAME": "your.user@example.com",
        "SF_PASSWORD": "yourpassword",
        "SF_LOGIN_URL": "https://yourorg.my.salesforce.com"
      }
    }
  }
}
```

## Setup (Cloudflare Workers — remote HTTP)

Deploy your own instance to Cloudflare Workers and connect via HTTP. Credentials are passed as request headers so they stay on your machine.

```json
{
  "mcpServers": {
    "salesforce-datacloud-mcp": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://your-worker.workers.dev",
        "--header", "X-SF-Client-Id:YOUR_CLIENT_ID",
        "--header", "X-SF-Client-Secret:YOUR_CLIENT_SECRET",
        "--header", "X-SF-Username:your.user@example.com",
        "--header", "X-SF-Password:yourpassword",
        "--header", "X-SF-Login-Url:https://yourorg.my.salesforce.com"
      ]
    }
  }
}
```

## Example prompts

```
List all data streams in Data Cloud.

Show me all DMOs related to "order".

What fields are on the UnifiedIndividual__dlm DMO?

I have a data stream with fields: email, first_name, last_name, phone.
Suggest how these map to fields on the UnifiedIndividual__dlm DMO.

Create a calculated insight that counts active members per segment.
```

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| `invalid_client_credentials` | Wrong `SF_CLIENT_ID` or `SF_CLIENT_SECRET` |
| `invalid_grant` | Wrong `SF_USERNAME` / `SF_PASSWORD`, or wrong `SF_LOGIN_URL` |
| `Data Cloud token exchange failed` | Connected App not enabled for Data Cloud; check OAuth scopes |
| `HTTP 404` on data streams | API version mismatch — verify `v63.0` is available in your org |
| Tool not visible in Claude | Config JSON syntax error, or Claude Desktop not restarted |
