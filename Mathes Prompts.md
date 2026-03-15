# Todo Prompts

---

## #1 — OAuth 2.0 Auth Code + JWT Bearer Flow

Add support for two auth strategies when connecting the MCP server:

**Option A — OAuth 2.0 Authorization Code Flow:**
1. MCP server redirects user to the Salesforce authorization page.
2. User logs in and consents.
3. Salesforce returns an authorization code.
4. MCP server exchanges the code for an access token & refresh token.
5. Use the access token to call Data Cloud APIs.

**Option B — JWT Bearer Flow (Server-to-Server):**
1. Create a Connected App in Salesforce.
2. Follow setup instructions to generate a private key and certificate.
3. MCP server signs a JWT assertion and exchanges it for an access token.

> `untested`

---

## #2 — Data Stream Creation

For data stream creation, implement the appropriate flow/structure by following:
[DMO Use Case Guide](https://developer.salesforce.com/docs/data/connectapi/guide/dmo-use-case.html)

---

## #3 — Fix `get_calculated_insights` Response

Fix the response for **"What are the calculated insights available?"**

**Actual API response shape:**
```json
{
  "collection": {
    "count": 3,
    "currentPageToken": "eyJvZiI6MCwiYnMiOjI1fQ==",
    "currentPageUrl": "/services/data/v65.0/ssot/calculated-insights?batchSize=25&offset=0&pageToken=...",
    "items": [
      {
        "apiName": "Life_Time_Order_Value_history__cio",
        "calculatedInsightStatus": "ACTIVE",
        "creationType": "Custom",
        "dataSpace": "default",
        "definitionStatus": "IN_USE",
        "definitionType": "HISTORY_METRIC",
        "description": "Tracks the history of CI Life Time Order Value",
        "dimensions": [...],
        "displayName": "Life Time Order Value History",
        "expression": "SELECT ...",
        "isEnabled": true,
        "lastRunStatus": "SUCCESS",
        "measures": [...],
        "publishScheduleInterval": "SYSTEM_MANAGED"
      }
    ],
    "nextPageToken": null,
    "nextPageUrl": null,
    "total": 3
  }
}
```

---

## #4 — Update `get_dmo_schema` (March 13, 2026)

When fetching DMO schemas:
- Use `offset` as a multiplier of 50 (only 50 records per request).
- On server startup, load and store all DMOs as a one-time warm-up activity.

```
GET /services/data/v61.0/ssot/data-model-objects?offset=50
```

---

## #5 — Get DMO Mapping

Fetch DMO mapping. Accept a DMO name from `get_dmo_schema` and retrieve its mapping:

```
GET /services/data/v61.0/ssot/data-model-object-mappings?dmoDeveloperName=ssot__Individual__dlm
```

**Sample response:**
```json
{
  "objectSourceTargetMaps": [
    {
      "developerName": "File_User_Profile_map_Individual_1748408696560",
      "fieldMappings": [
        {
          "developerName": "COMPANY__c_fieldmap_ssot__CurrentEmployerName__c",
          "sourceFieldDeveloperName": "COMPANY__c",
          "targetFieldDeveloperName": "ssot__CurrentEmployerName__c"
        }
      ],
      "sourceEntityDeveloperName": "File_User_Profile__dll",
      "status": "ACTIVE",
      "targetEntityDeveloperName": "ssot__Individual__dlm"
    }
  ]
}
```

---

## #6 — Create DMO Mapping

When a user asks to perform DMO mapping:
1. Ask for which data stream (use `get_data_streams`).
2. Fetch that data stream's fields.
3. Propose matching fields against the DMO in memory.
4. Ask the user to confirm, then create the mapping.

**API:** `PATCH` with field-mapping payload:

```
PATCH https://{org}/services/data/v61.0/ssot/data-model-object-mappings/{objectSourceTargetMapDeveloperName}/field-mappings/{fieldSourceTargetMapDeveloperName}
```

> Note: The docs label this as "Delete" — that's a typo. It's a `PATCH`. Tested and confirmed.

```json
{
  "sourceEntityDeveloperName": "File_User_Profile__dll",
  "targetEntityDeveloperName": "ssot__Individual__dlm",
  "fieldMapping": [
    {
      "sourceFieldDeveloperName": "COMPANY__c",
      "targetFieldDeveloperName": "ssot__GenderIdentity__c"
    }
  ]
}
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Model-Objects/paths/~1ssot~1data-model-object-mappings~1%7BobjectSourceTargetMapDeveloperName%7D~1field-mappings~1%7BfieldSourceTargetMapDeveloperName%7D/patch)

---

## #7 — MCP Deployment

Create an instruction file and prepare the project for publishing on [smithery.ai](https://smithery.ai).

---

## #8 — Remove DMO Field Mapping

When a user wants to remove a DMO mapping:
1. Ask for the data stream name and field names.
2. Ask for the DMO name and DMO field names.
3. Issue a `DELETE` to remove the specified mapping.

```
DELETE https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-model-object-mappings/{objectSourceTargetMapDeveloperName}/field-mappings
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Model-Objects/paths/~1ssot~1data-model-object-mappings~1%7BobjectSourceTargetMapDeveloperName%7D~1field-mappings/delete)

---

## #9 — Refresh / Publish Segments

When a user asks to refresh or publish a segment:
1. Get the segment ID from `get_segments`.
2. `POST` to the publish endpoint.
3. Return success or failure message with details.

```
POST https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/segments/{segmentId}/actions/publish
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Segments/paths/~1ssot~1segments~1%7BsegmentId%7D~1actions~1publish/post)

---

## #10 — Data Transforms — Get

List or fetch a single data transform:

```
GET /ssot/data-transforms
GET /ssot/data-transforms/{dataTransformNameOrId}
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Transforms/paths/~1ssot~1data-transforms/get)

---

## #11 — Data Transforms — Create / Update

Create or update data transforms:

```
POST https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-transforms
PUT  https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-transforms/{dataTransformNameOrId}
```

Key fields: `type` (`STREAMING` | `BATCH`), `definition.type` (`SQL`), `definition.expression`, `label`, `name`.

**SQL payload example:**
```json
{
  "definition": {
    "expression": "SELECT Account_Home__dll.Id__c as Id__c, '***' as Name__c FROM Account_Home__dll",
    "targetDlo": "Account_Home_Annon__dll",
    "type": "SQL",
    "version": "63.0"
  },
  "label": "AccountAnnon",
  "name": "AccountAnnon",
  "type": "STREAMING"
}
```

---

## #12 — Data Transforms — Retry with STL Payload

Modify the create/update data transform functions to retry with an STL payload when SQL fails.

**STL payload example:**
```json
{
  "definition": {
    "nodes": {
      "LOAD_DATASET0": {
        "action": "load",
        "parameters": {
          "dataset": { "name": "Account_Home__dll", "type": "dataLakeObject" },
          "fields": ["Id__c"],
          "sampleDetails": { "sortBy": [], "type": "TopN" }
        },
        "sources": []
      },
      "OUTPUT0": {
        "action": "outputD360",
        "parameters": {
          "fieldsMappings": [{ "sourceField": "Id__c", "targetField": "Id__c" }],
          "name": "Account_Home_Clean__dll",
          "type": "dataLakeObject"
        },
        "sources": ["LOAD_DATASET0"]
      }
    },
    "type": "STL",
    "version": "56.0"
  },
  "label": "Batch Account Cleaning",
  "name": "BatchAccountCleaning",
  "type": "BATCH"
}
```

---

## #13 — Identity Resolution (IDR) Ruleset

Get identity resolution rulesets:

```
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/identity-resolutions
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/identity-resolutions/{developerName}
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Identity-Resolutions)

---

## #14 — Get Data Spaces

Get all data spaces (analogous to business units in SFMC). When listing resources (e.g. segments) and multiple data spaces exist, ask the user to choose.

```
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-spaces
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Spaces/paths/~1ssot~1data-spaces/get)

---

## #15 — Get Data Lake Objects, Data Graphs, Data Actions, Data Action Targets

### Data Lake Objects

```
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-lake-objects
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-lake-objects/{recordIdOrDeveloperName}
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Lake-Objects)

**Sample list item:**
```json
{
  "id": "1dlSB000004BXhbYAG",
  "name": "ProvisionedFeature__dll",
  "label": "ProvisionedFeature",
  "category": "Other",
  "status": "ACTIVE",
  "namespace": "",
  "fields": [
    { "name": "id__c", "label": "ID", "dataType": "Text", "isPrimaryKey": true },
    { "name": "systemmodstamp__c", "label": "System Modstamp", "dataType": "DateTime", "isPrimaryKey": false }
  ],
  "dataSpaceInfo": []
}
```

---

### Data Graphs

**Get single data graph:**
```
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-graphs/{dataGraphName}
```

**Get data graph metadata (list):**
```
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-graphs/metadata?dataspace=string&dataGraphEntityName=string
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Graphs)

**Sample metadata response:**
```json
{
  "developerName": "IndividualDAO",
  "description": "Data Application Object for Individual",
  "valuesDmoName": "IndividualDao_values__dlm",
  "idDmoName": "IndividualDao_id__dlm",
  "dataspaceName": "default",
  "status": "Ready",
  "primaryObjectName": "Individual_dao__dlm",
  "dgObject": {
    "developerName": "Individual_dao__dlm",
    "type": "DMO/CI",
    "fields": [{ "developerName": "IndividualId__c", "data_type": "string" }],
    "relatedObjects": [...]
  },
  "version": "1"
}
```

---

### Data Actions

```
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-actions
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Actions)

---

### Data Action Targets

```
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-action-targets
GET https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-action-targets/{apiName}
```

[API Docs](https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Action-Targets)

---

## Notes

1. When creating SQL for segments, use these validation rules:
   [CDP DBT Validations](https://developer.salesforce.com/docs/data/connectapi/guide/features_cdp_dbt_validations.html)

2. **TODO (Mathes):** `get_dmo_schema` is called too frequently and causes message overload — consider caching or lazy-loading.
