# datacloud-mcp Setup Guide

## 1. Configure credentials

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
SF_CLIENT_ID=3MVG9...your_consumer_key...
SF_CLIENT_SECRET=71F892...your_consumer_secret...
SF_USERNAME=your.user@example.com
SF_PASSWORD=yourpassword
SF_LOGIN_URL=https://yourorg.my.salesforce.com
```

**Where to find these:**
- `SF_CLIENT_ID` — Salesforce Setup → App Manager → your Connected App → Consumer Key
- `SF_CLIENT_SECRET` — same page → Consumer Secret (click to reveal)
- `SF_USERNAME` — your Salesforce login email
- `SF_PASSWORD` — your Salesforce password
- `SF_LOGIN_URL` — your org's My Domain URL, e.g. `https://orgfarm-abc123.develop.my.salesforce.com`

> **Connected App requirements:** OAuth scopes must include `api`. Under OAuth Policies, set "Permitted Users" to "All users may self-authorize" and enable the client credentials flow.

---

## 2. Compile

```bash
npm run build
```

Output goes to `dist/`. Verify:

```bash
ls dist/
# index.js  auth/  api/  tools/
```

---

## 3. Add to Claude Desktop

Open your Claude Desktop config file:

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Add the `datacloud` entry under `mcpServers`:

```json
{
  "mcpServers": {
    "datacloud": {
      "command": "node",
      "args": ["/absolute/path/to/MCP-DC/dist/index.js"],
      "env": {
        "SF_CLIENT_ID": "3MVG9...your_consumer_key...",
        "SF_CLIENT_SECRET": "71F892...your_consumer_secret...",
        "SF_USERNAME": "your.user@example.com",
        "SF_PASSWORD": "yourpassword",
        "SF_LOGIN_URL": "https://yourorg.my.salesforce.com"
      }
    }
  }
}
```

> Tip: Use absolute paths everywhere — Claude Desktop does not inherit your shell's `PATH` or working directory.

Restart Claude Desktop after saving.

---

## 4. Verify the server starts

Before testing in Claude, confirm the server runs without errors:

```bash
node dist/index.js
# stderr: datacloud-mcp server running
# stderr: DMO cache ready: 42 objects   ← appears after auth succeeds
```

`Ctrl+C` to stop. If you see an auth error here, fix credentials before proceeding.

---

## 5. Test in Claude Desktop

Once the server is running inside Claude Desktop, try these prompts in order:

### Check the connection
```
List all data streams in Data Cloud.
```
Expected: a bulleted list of stream names, statuses, and connector types.

### Browse the full DMO schema
```
Show me all Data Model Objects and their fields.
```
Expected: markdown list of every DMO with field names and types.

### Look up a specific DMO
```
What fields are on the UnifiedIndividual__dlm DMO?
```
Expected: field list for that single object.

### Filter by name
```
Show me all DMOs related to "order".
```
Expected: filtered list of DMOs whose names contain "order".

### End-to-end mapping prompt
```
I have a data stream with fields: email, first_name, last_name, phone.
Suggest how these map to fields on the UnifiedIndividual__dlm DMO.
```
Expected: Claude uses `get_dmo_schema` to look up the DMO, then proposes a field mapping.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| `Salesforce OAuth failed: invalid_client_credentials` | Wrong `SF_CLIENT_ID` or `SF_CLIENT_SECRET` |
| `Salesforce OAuth failed: invalid_grant` | Wrong `SF_USERNAME` / `SF_PASSWORD`, or wrong `SF_LOGIN_URL` |
| `Data Cloud token exchange failed` | Connected App not enabled for Data Cloud; check OAuth scopes |
| `HTTP 404` on data streams | API version mismatch — check `v63.0` is available in your org |
| Tool not visible in Claude | Config JSON syntax error, or Claude Desktop not restarted |
