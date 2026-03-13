# Publishing to Smithery.ai

## Files required

| File | Purpose |
|------|---------|
| `smithery.yaml` | Tells Smithery how to launch the server and what config to show users |
| `README.md` | Becomes the listing page on Smithery |
| `package.json` | Must have `prepare` script so Smithery can build on install |

---

## smithery.yaml structure

```yaml
startCommand:
  type: stdio          # or "http" for HTTP-based servers
  configSchema:        # JSON Schema — rendered as a form in the Smithery UI
    type: object
    required: [...]
    properties:
      fieldName:
        type: string
        title: Display Label
        description: Shown as help text in the UI
        default: someDefault
        enum: [option1, option2]   # optional — renders as a dropdown
  commandFunction: |-  # JS function string — maps config → { command, args, env }
    (config) => ({
      command: "node",
      args: ["dist/index.js"],
      env: {
        ENV_VAR: config.fieldName,
      }
    })
```

### Key rules
- `configSchema` property names are camelCase; map them to the env vars your server expects inside `commandFunction`
- `required` fields are enforced — users can't submit without them
- Optional fields (e.g. `sfPrivateKeyPath`) should be left out of `required`
- Use `String(config.numericField)` when converting numbers to env vars
- Pass `undefined` for optional env vars you don't want to set (they'll be omitted)

---

## package.json requirements

```json
{
  "files": ["dist"],         // only ship compiled output
  "license": "MIT",
  "keywords": ["mcp", ...],  // improves discoverability
  "scripts": {
    "prepare": "npm run build"  // Smithery runs this during install
  }
}
```

---

## Publishing steps

1. Push the repo to **GitHub (public)**
2. Go to **smithery.ai/new**
3. Connect the GitHub repo
4. Smithery auto-detects `smithery.yaml` and deploys

---

## This project's config mapping

| Smithery config key | Env var | Notes |
|---------------------|---------|-------|
| `sfAuthMethod` | `SF_AUTH_METHOD` | default `client_credentials` |
| `sfClientId` | `SF_CLIENT_ID` | required |
| `sfLoginUrl` | `SF_LOGIN_URL` | required |
| `sfClientSecret` | `SF_CLIENT_SECRET` | required for `client_credentials`, `oauth_code` |
| `sfUsername` | `SF_USERNAME` | required for `client_credentials`, `jwt` |
| `sfPassword` | `SF_PASSWORD` | required for `client_credentials` |
| `sfPrivateKeyPath` | `SF_PRIVATE_KEY_PATH` | required for `jwt` |
| `sfCallbackPort` | `SF_CALLBACK_PORT` | optional, default `3456` |
| `tokenExpiryBuffer` | `TOKEN_EXPIRY_BUFFER` | optional, default `300` |

---

## Useful links

- Smithery home: https://smithery.ai
- Publish a new server: https://smithery.ai/new
- Smithery docs (build): https://smithery.ai/docs/build
- smithery.yaml reference: https://smithery.ai/docs/build/project-config/smithery-yaml
- Smithery CLI (dev/test): `npx @smithery/cli dev`
