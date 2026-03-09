Next:

1. 

Can you add an option so that when a user connects this mcp server to their agent, provide them option to authenticate using OAuth 2.0 Authorization Code where the 

    1. MCP server redirects user to Salesforce authorization page.
    2. User logs in and consents.
    3. Salesforce returns an authorization code.
    4. MCP server exchanges the code for: access token & refresh token
    5. You then use the access token to call Data Cloud APIs.

Or if they want ot use JWT Bearer Flow Server-to-Server - where we can instruct them to 

1. Create a Connected App in Salesforce.
and other instructions etc.,

2 ---------

For Data stream creation, read through this document and implement approrpirate by following this flow/ strcture 

https://developer.salesforce.com/docs/data/connectapi/guide/dmo-use-case.html

Notes: 

1. When creating sql for segments, use these rules - https://developer.salesforce.com/docs/data/connectapi/guide/features_cdp_dbt_validations.html
