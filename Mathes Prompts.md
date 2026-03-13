# Todo prompts 

## 1

Can you add an option so that when a user connects this mcp server to their agent, provide them option to authenticate using OAuth 2.0 Authorization Code where the 

    1. MCP server redirects user to Salesforce authorization page.
    2. User logs in and consents.
    3. Salesforce returns an authorization code.
    4. MCP server exchanges the code for: access token & refresh token
    5. You then use the access token to call Data Cloud APIs.

Or if they want ot use JWT Bearer Flow Server-to-Server - where we can instruct them to 

1. Create a Connected App in Salesforce.
and other instructions etc.,

` untested `

## 2

For Data stream creation, read through this document and implement approrpirate by following this flow/ strcture 

https://developer.salesforce.com/docs/data/connectapi/guide/dmo-use-case.html

## 3 

Fix response for 'Get calculated insights' 'what are the calculated insights available'

`
{
    "collection": {
        "count": 3,
        "currentPageToken": "eyJvZiI6MCwiYnMiOjI1fQ==",
        "currentPageUrl": "/services/data/v65.0/ssot/calculated-insights?batchSize=25&offset=0&pageToken=eyJvZiI6MCwiYnMiOjI1fQ%3D%3D",
        "items": [
            {
                "apiName": "Life_Time_Order_Value_history__cio",
                "calculatedInsightStatus": "ACTIVE",
                "creationType": "Custom",
                "dataSpace": "default",
                "definitionStatus": "IN_USE",
                "definitionType": "HISTORY_METRIC",
                "description": "Tracks the history of CI Life Time Order Value",
                "dimensions": [
                    {
                        "apiName": "customer_id__c",
                        "creationType": "Custom",
                        "dataSource": {
                            "sourceApiName": "ssot__GrandTotalAmount__c",
                            "type": "DATA_MODEL"
                        },
                        "dataType": "Text",
                        "dateGranularity": null,
                        "displayName": "customer_id",
                        "fieldRole": "DIMENSION",
                        "formula": "ssot__SalesOrder__dlm.ssot__SoldToCustomerId__c"
                    },
                    {
                        "apiName": "history_capture_ts__c",
                        "creationType": "Custom",
                        "dataSource": {
                            "sourceApiName": "ssot__GrandTotalAmount__c",
                            "type": "DATA_MODEL"
                        },
                        "dataType": "DateTime",
                        "dateGranularity": "DAY",
                        "displayName": "history_capture_ts",
                        "fieldRole": "DIMENSION",
                        "formula": "[placeholder]"
                    }
                ],
                "displayName": "Life Time Order Value History",
                "expression": "SELECT\n  SUM(ssot__SalesOrder__dlm.ssot__GrandTotalAmount__c) AS total_sales__c,\n  ssot__SalesOrder__dlm.ssot__SoldToCustomerId__c AS customer_id__c\nFROM ssot__SalesOrder__dlm\nGROUP BY customer_id__c",
                "isEnabled": true,
                "lastCalcInsightStatusDateTime": "2026-03-04T21:17:02.000Z",
                "lastCalcInsightStatusErrorCode": null,
                "lastRunDateTime": "2026-03-08T19:08:12.000Z",
                "lastRunStatus": "SUCCESS",
                "lastRunStatusDateTime": "2026-03-08T19:09:52.000Z",
                "lastRunStatusErrorCode": null,
                "measures": [
                    {
                        "apiName": "total_sales__c",
                        "creationType": "Custom",
                        "dataSource": {
                            "sourceApiName": "ssot__GrandTotalAmount__c",
                            "type": "DATA_MODEL"
                        },
                        "dataType": "Number",
                        "displayName": "total_sales",
                        "fieldAggregationType": "AGGREGATABLE",
                        "fieldRole": "MEASURE",
                        "formula": "SUM(ssot__SalesOrder__dlm.ssot__GrandTotalAmount__c)"
                    }
                ],
                "publishScheduleEndDate": null,
                "publishScheduleInterval": "SYSTEM_MANAGED",
                "publishScheduleStartDateTime": null,
                "subType": null
            }..
        ],
        "nextPageToken": null,
        "nextPageUrl": null,
        "previousPageToken": null,
        "previousPageUrl": null,
        "total": 3
    }
}
`

March 13, 2026 
#4 Update to Get DMO Schemas

When getting DMO schema, use offset which is a multiplier of 50. ie, only 50 records will be retreived in one request. When the project loads, load and store all the DMOs as one time activity.

`services/data/v61.0//ssot/data-model-objects?offset=50`

#5 Get DMO Mapping 

Let's work on fetching DMO mapping. When required, provide the DMO name fetched from get DMO Schema and get their mapping. 

`/services/data/v61.0//ssot/data-model-object-mappings?dmoDeveloperName=ssot__Individual__dlm`

Below is a sample response 

`{
    "objectSourceTargetMaps": [
        {
            "developerName": "File_User_Profile_map_Individual_1748408696560",
            "fieldMappings": [
                {
                    "developerName": "COMPANY__c_fieldmap_ssot__CurrentEmployerName__c",
                    "sourceFieldDeveloperName": "COMPANY__c",
                    "targetFieldDeveloperName": "ssot__CurrentEmployerName__c"
                },
                {
                    "developerName": "DataSource__c_fieldmap_ssot__DataSourceId__c",
                    "sourceFieldDeveloperName": "DataSource__c",
                    "targetFieldDeveloperName": "ssot__DataSourceId__c"
                },
                {
                    "developerName": "POSITION__c_fieldmap_ssot__Occupation__c",
                    "sourceFieldDeveloperName": "POSITION__c",
                    "targetFieldDeveloperName": "ssot__Occupation__c"
                },
                {
                    "developerName": "BUSINESSENTITYID__c_fieldmap_ssot__Id__c",
                    "sourceFieldDeveloperName": "BUSINESSENTITYID__c",
                    "targetFieldDeveloperName": "ssot__Id__c"
                },
                {
                    "developerName": "KQ_BUSINESSENTITYID__c_fieldmap_KQ_Id__c",
                    "sourceFieldDeveloperName": "KQ_BUSINESSENTITYID__c",
                    "targetFieldDeveloperName": "KQ_Id__c"
                },
                {
                    "developerName": "HOMEPAGEURL__c_fieldmap_ssot__WebSiteURL__c",
                    "sourceFieldDeveloperName": "HOMEPAGEURL__c",
                    "targetFieldDeveloperName": "ssot__WebSiteURL__c"
                },
                {
                    "developerName": "FIRSTNAME__c_fieldmap_ssot__FirstName__c",
                    "sourceFieldDeveloperName": "FIRSTNAME__c",
                    "targetFieldDeveloperName": "ssot__FirstName__c"
                },
                {
                    "developerName": "DataSourceObject__c_fieldmap_ssot__DataSourceObjectId__c",
                    "sourceFieldDeveloperName": "DataSourceObject__c",
                    "targetFieldDeveloperName": "ssot__DataSourceObjectId__c"
                },
                {
                    "developerName": "LASTNAME__c_fieldmap_ssot__LastName__c",
                    "sourceFieldDeveloperName": "LASTNAME__c",
                    "targetFieldDeveloperName": "ssot__LastName__c"
                },
                {
                    "developerName": "InternalOrganization__c_fieldmap_ssot__InternalOrganizationId__c",
                    "sourceFieldDeveloperName": "InternalOrganization__c",
                    "targetFieldDeveloperName": "ssot__InternalOrganizationId__c"
                },
                {
                    "developerName": "COMPANY__c_fieldmap_ssot__GenderId__c",
                    "sourceFieldDeveloperName": "COMPANY__c",
                    "targetFieldDeveloperName": "ssot__GenderId__c"
                },
                {
                    "developerName": "COMPANY__c_fieldmap_ssot__GenderIdentity__c",
                    "sourceFieldDeveloperName": "COMPANY__c",
                    "targetFieldDeveloperName": "ssot__GenderIdentity__c"
                }
            ],
            "sourceEntityDeveloperName": "File_User_Profile__dll",
            "status": "ACTIVE",
            "targetEntityDeveloperName": "ssot__Individual__dlm"
        },
        {
            "developerName": "File_User_Details_and_Activities_map_Individual_1748452267367",
            "fieldMappings": [
                {
                    "developerName": "industry_name__c_fieldmap_Industry_Name__c",
                    "sourceFieldDeveloperName": "industry_name__c",
                    "targetFieldDeveloperName": "Industry_Name__c"
                },
                {
                    "developerName": "DataSource__c_fieldmap_ssot__DataSourceId__c",
                    "sourceFieldDeveloperName": "DataSource__c",
                    "targetFieldDeveloperName": "ssot__DataSourceId__c"
                },
                {
                    "developerName": "DataSourceObject__c_fieldmap_ssot__DataSourceObjectId__c",
                    "sourceFieldDeveloperName": "DataSourceObject__c",
                    "targetFieldDeveloperName": "ssot__DataSourceObjectId__c"
                },
                {
                    "developerName": "id__c_fieldmap_ssot__Id__c",
                    "sourceFieldDeveloperName": "id__c",
                    "targetFieldDeveloperName": "ssot__Id__c"
                },
                {
                    "developerName": "KQ_id__c_fieldmap_KQ_Id__c",
                    "sourceFieldDeveloperName": "KQ_id__c",
                    "targetFieldDeveloperName": "KQ_Id__c"
                },
                {
                    "developerName": "InternalOrganization__c_fieldmap_ssot__InternalOrganizationId__c",
                    "sourceFieldDeveloperName": "InternalOrganization__c",
                    "targetFieldDeveloperName": "ssot__InternalOrganizationId__c"
                }
            ],
            "sourceEntityDeveloperName": "File_User_Details_and_Activities__dll",
            "status": "ACTIVE",
            "targetEntityDeveloperName": "ssot__Individual__dlm"
        }
    ]
}
`

#6 Create DMO Mapping 

When a user asks for DMO mapping to be performed, ask them for which data stream (you already have 'get data stream' function) and fetch that data stream's fields. Next, try to perform a mapping of data stream fields based on DMO you have in your memory. If matching field is found, ask the users to confirm and create those mapping by using below API. 

Documentation: https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Model-Objects/paths/~1ssot~1data-model-object-mappings~1%7BobjectSourceTargetMapDeveloperName%7D~1field-mappings~1%7BfieldSourceTargetMapDeveloperName%7D/patch 

(Ignore the title that says 'Delete' for patch request. Must be a typo and I've teted this)

` PATCH https://orgfarm-6cac2dc8f8-dev-ed.develop.my.salesforce.com/services/data/v61.0/ssot/data-model-object-mappings/File_User_Profile_map_Individual_1748408696560/field-mappings/ssot__Individual__dlm`

`{
  "sourceEntityDeveloperName": "File_User_Profile__dll",
  "targetEntityDeveloperName": "ssot__Individual__dlm",
  "fieldMapping": [
    {
      "sourceFieldDeveloperName": "COMPANY__c",
      "targetFieldDeveloperName": "ssot__GenderIdentity__c"
    }
  ]
}`

#7 MCP deploymnet 

create in instruction file and prepare the project to publish it in smithery.ai

#8 Update DMO mapping 

When a user wants to remove DMO mapping, ask them for the details including, what's the data stream and the data stream field names. And the DMO name and DMO field names.. and then perform below 'DELETE' request to remove the specificed mapping.

`https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/data-model-object-mappings/{objectSourceTargetMapDeveloperName}/field-mappings`
 
Documentation: https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Data-Model-Objects/paths/~1ssot~1data-model-object-mappings~1%7BobjectSourceTargetMapDeveloperName%7D~1field-mappings/delete
 
# 9 Refresh / publish segmetns 

When a user asks for a segment to be refreshed/ published, take the segment ID from get semgnets function, and make a post call to below url with segment ID in it. Also, based on API response, return success or failure messages with details.

`POST https://{dne_cdpInstanceUrl}/services/data/v{version}/ssot/segments/{segmentId}/actions/publish`

https://developer.salesforce.com/docs/data/connectapi/references/spec#tag/Segments/paths/~1ssot~1segments~1%7BsegmentId%7D~1actions~1publish/post

# Notes: 

1. When creating sql for segments, use these rules - https://developer.salesforce.com/docs/data/connectapi/guide/features_cdp_dbt_validations.html
