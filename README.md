# datacloud-mcp

MCP server for **Salesforce Data Cloud (Data 360)**. Connects Claude Desktop (or any MCP client) to your Data Cloud org so you can explore data streams, Data Model Objects (DMOs), segments, and calculated insights — and create new ones — through natural language.

## Tools

| Tool | What it does |
|------|-------------|
| `get_data_streams` | List all data streams with status and connector type |
| `get_segments` | List all segments in the org |
| `get_dmo_schema` | Inspect fields on one or more DMOs (filterable by name) |
| `get_dmo_mapping` | Show how a data stream's fields map to a DMO |
| `propose_dmo_field_mapping` | AI-suggested field mappings between a stream and a DMO |
| `apply_dmo_field_mapping` | Write a proposed field mapping back to Data Cloud |
| `get_calculated_insights` | List all calculated insights and their SQL |
| `propose_ci_sql` | Generate SQL for a new calculated insight from a description |
| `create_calculated_insight` | Create a new calculated insight in the org |
| `run_calculated_insight` | Trigger a calculated insight to refresh |

## Prerequisites

You need a Salesforce **Connected App** with:
- OAuth scope: `api`
- OAuth Policies → Permitted Users: "All users may self-authorize"
- The flow you intend to use enabled (see Auth Methods below)

## Auth Methods

### client_credentials (default)
Headless machine-to-machine auth. Enable "Client Credentials Flow" on the Connected App.

Required fields: `sfClientId`, `sfClientSecret`, `sfUsername`, `sfPassword`, `sfLoginUrl`

### jwt (server-to-server)
JWT Bearer flow. The user must be pre-authorised on the Connected App. Generate a key pair and upload the certificate to the app.

Required fields: `sfClientId`, `sfUsername`, `sfLoginUrl`, `sfPrivateKeyPath`

### oauth_code (browser login)
Interactive OAuth. The server opens a local HTTP listener; you log in via browser. Callback URL on the Connected App must include `http://localhost:3456/callback`.

Required fields: `sfClientId`, `sfClientSecret`, `sfLoginUrl`

## Configuration

| Field | Required | Description |
|-------|----------|-------------|
| `sfClientId` | Yes | Consumer key from the Connected App |
| `sfLoginUrl` | Yes | Your org's My Domain URL (e.g. `https://yourorg.my.salesforce.com`) |
| `sfAuthMethod` | No | `client_credentials` (default), `jwt`, or `oauth_code` |
| `sfClientSecret` | Conditional | Required for `client_credentials` and `oauth_code` |
| `sfUsername` | Conditional | Required for `client_credentials` and `jwt` |
| `sfPassword` | Conditional | Required for `client_credentials` |
| `sfPrivateKeyPath` | Conditional | Absolute path to `server.key` — required for `jwt` |
| `sfCallbackPort` | No | OAuth redirect port (default `3456`) — `oauth_code` only |
| `tokenExpiryBuffer` | No | Seconds before expiry to refresh the token (default `300`) |

## Manual setup (Claude Desktop)

```json
{
  "mcpServers": {
    "datacloud": {
      "command": "node",
      "args": ["/absolute/path/to/MCP-DC/dist/index.js"],
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

Build first: `npm install && npm run build`

## Example prompts

```
List all data streams in Data Cloud.

Show me all DMOs related to "order".

What fields are on the UnifiedIndividual__dlm DMO?

I have a data stream with fields: email, first_name, last_name, phone.
Suggest how these map to fields on the UnifiedIndividual__dlm DMO.

Create a calculated insight that counts active members per segment.
```

## Startup behaviour

On first launch the server fetches and caches all DMO metadata and calculated insights from your org. This takes a few seconds depending on how many DMOs exist. All subsequent tool calls use the in-memory cache and respond instantly.

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| `invalid_client_credentials` | Wrong `SF_CLIENT_ID` or `SF_CLIENT_SECRET` |
| `invalid_grant` | Wrong `SF_USERNAME` / `SF_PASSWORD`, or wrong `SF_LOGIN_URL` |
| `Data Cloud token exchange failed` | Connected App not enabled for Data Cloud; check OAuth scopes |
| `HTTP 404` on data streams | API version mismatch — verify `v65.0` is available in your org |
| Tool not visible in Claude | Config JSON syntax error, or Claude Desktop not restarted |
