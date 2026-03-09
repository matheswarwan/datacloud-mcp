# Data Cloud MCP — Project Folder Structure

```
datacloud-mcp/
│
├── README.md
├── .env.example                        # SF credentials template
├── package.json
│
├── src/
│   │
│   ├── index.ts                        # MCP server entry point — registers all tools
│   │
│   ├── auth/
│   │   ├── salesforce.ts               # Step 1: Salesforce OAuth JWT flow
│   │   └── datacloud.ts                # Step 2: DC token exchange (/services/a360/token)
│   │
│   ├── tools/                          # One file per MCP tool
│   │   │
│   │   ├── phase1-data-streams/
│   │   │   ├── get_dmo_schema.ts       # Fetch all DMO fields from Metadata API
│   │   │   ├── propose_mapping.ts      # Claude-powered: CSV → DMO field mapping
│   │   │   ├── generate_openapi_schema.ts  # CSV → valid OpenAPI YAML for Ingestion API
│   │   │   ├── create_data_stream.ts   # POST /ssot/data-streams
│   │   │   └── activate_data_stream.ts # POST /ssot/data-streams/{id}/actions/activate
│   │   │
│   │   ├── phase2-segments/
│   │   │   ├── list_segments.ts        # GET /ssot/segments
│   │   │   ├── create_segment.ts       # POST /ssot/segments (AI-assisted criteria)
│   │   │   └── run_segment.ts          # POST /ssot/segments/{id}/actions/run
│   │   │
│   │   ├── phase2-identity/
│   │   │   ├── list_identity_rulesets.ts
│   │   │   ├── create_identity_ruleset.ts  # POST /ssot/identity-resolutions
│   │   │   └── run_identity_resolution.ts
│   │   │
│   │   ├── phase3-insights/
│   │   │   ├── list_calculated_insights.ts
│   │   │   ├── create_calculated_insight.ts  # POST /ssot/calculated-insights
│   │   │   └── run_calculated_insight.ts
│   │   │
│   │   └── utilities/
│   │       ├── query_dmo.ts            # POST /api/v1/query — validate post-activation
│   │       ├── list_data_streams.ts
│   │       └── list_activation_targets.ts
│   │
│   ├── api/                            # Raw HTTP client wrappers
│   │   ├── client.ts                   # Axios/fetch instance with auth headers
│   │   ├── metadata.ts                 # Metadata API calls
│   │   ├── datastreams.ts              # Data Streams Connect API calls
│   │   ├── ingestion.ts                # Ingestion API calls
│   │   ├── segments.ts                 # Segments Connect API calls
│   │   ├── identity.ts                 # Identity Resolution API calls
│   │   ├── insights.ts                 # Calculated Insights API calls
│   │   └── query.ts                    # Query API calls
│   │
│   ├── prompts/                        # All Claude prompts as typed templates
│   │   ├── dmo_mapping.ts              # CSV → DMO mapping prompt
│   │   ├── segment_criteria.ts         # Natural language → segment filter JSON
│   │   ├── ci_sql_gen.ts               # Plain English → ANSI SQL for CIs
│   │   └── openapi_gen.ts              # CSV headers → OpenAPI YAML schema
│   │
│   └── utils/
│       ├── csv_parser.ts               # Parse CSV, extract headers + sample rows
│       ├── schema_validator.ts         # Validate OpenAPI YAML against DC constraints
│       └── logger.ts
│
├── context/                            # Static DMO knowledge base — fed to Claude
│   ├── standard_dmos.json              # All standard DMO names + fields (pre-fetched)
│   ├── dmo_relationships.json          # Known DMO relationship patterns
│   └── mapping_examples.json          # Few-shot examples for better mapping accuracy
│
├── tests/
│   ├── tools/
│   │   ├── propose_mapping.test.ts
│   │   ├── create_data_stream.test.ts
│   │   └── create_segment.test.ts
│   └── fixtures/
│       ├── sample_customers.csv
│       └── sample_transactions.csv
│
└── docs/
    ├── datacloud-mcp-apis.md           # ← API reference (already created)
    ├── SETUP.md                        # Auth setup, certificate generation
    └── PROMPTING.md                    # Prompt engineering notes per tool
```

---

## Key Design Decisions

**`context/standard_dmos.json`** — Pre-fetch and cache DMO schemas once at startup rather than on every mapping request. Saves ~2 API calls per run and makes offline testing possible.

**`prompts/` as typed templates** — Keeps Claude prompts versioned, testable, and separated from business logic. Each prompt file exports a function that takes typed inputs and returns a formatted string.

**Phase gating** — Tools are grouped by phase. Phase 1 tools can run independently. Phase 2 (Segments, IR) depend on Phase 1 data streams being active + mapped. Phase 3 (CIs, Activations) depend on Phase 2 unified profiles existing.

**`api/` layer is dumb** — Pure HTTP wrappers with no business logic. All orchestration lives in `tools/`. Makes mocking easy for tests.
