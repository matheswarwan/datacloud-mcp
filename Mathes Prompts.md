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


# Notes: 

1. When creating sql for segments, use these rules - https://developer.salesforce.com/docs/data/connectapi/guide/features_cdp_dbt_validations.html
