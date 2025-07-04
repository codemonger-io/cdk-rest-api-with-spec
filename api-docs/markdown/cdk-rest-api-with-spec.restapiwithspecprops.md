<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@codemonger-io/cdk-rest-api-with-spec](./cdk-rest-api-with-spec.md) &gt; [RestApiWithSpecProps](./cdk-rest-api-with-spec.restapiwithspecprops.md)

## RestApiWithSpecProps interface

> This API is provided as a beta preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

Properties for [RestApiWithSpec](./cdk-rest-api-with-spec.restapiwithspec.md)<!-- -->.

**Signature:**

```typescript
export interface RestApiWithSpecProps extends apigateway.RestApiProps 
```
**Extends:** apigateway.RestApiProps

## Properties

<table><thead><tr><th>

Property


</th><th>

Modifiers


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[openApiInfo](./cdk-rest-api-with-spec.restapiwithspecprops.openapiinfo.md)


</td><td>


</td><td>

Partial&lt;InfoObject&gt; &amp; Pick&lt;InfoObject, 'version'&gt;


</td><td>

**_(BETA)_** Info object of the OpenAPI definition.


</td></tr>
<tr><td>

[openApiOutputPath](./cdk-rest-api-with-spec.restapiwithspecprops.openapioutputpath.md)


</td><td>


</td><td>

string


</td><td>

**_(BETA)_** Path to an output file where the OpenAPI definition is to be saved.


</td></tr>
</tbody></table>

