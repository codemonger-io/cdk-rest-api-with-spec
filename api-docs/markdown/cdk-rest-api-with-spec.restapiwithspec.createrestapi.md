<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [cdk-rest-api-with-spec](./cdk-rest-api-with-spec.md) &gt; [RestApiWithSpec](./cdk-rest-api-with-spec.restapiwithspec.md) &gt; [createRestApi](./cdk-rest-api-with-spec.restapiwithspec.createrestapi.md)

## RestApiWithSpec.createRestApi() method

> This API is provided as a preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

Creates an instance of [aws\_apigateway.RestApi](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html) that also synthesizes the OpenAPI definition.

<b>Signature:</b>

```typescript
static createRestApi(scope: Construct, id: string, props: RestApiWithSpecProps): IRestApiWithSpec;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  scope | Construct |  |
|  id | string |  |
|  props | [RestApiWithSpecProps](./cdk-rest-api-with-spec.restapiwithspecprops.md) |  |

<b>Returns:</b>

[IRestApiWithSpec](./cdk-rest-api-with-spec.irestapiwithspec.md)

## Remarks

Specify [props.newRestApi](./cdk-rest-api-with-spec.restapiwithspecprops.newrestapi.md) if you want to instantiate a subclass of [aws\_apigateway.RestApi](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html)<!-- -->.

[props.restApiName](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApiProps.html#restapiname) is the default value of [info.title](https://spec.openapis.org/oas/latest.html#info-object) in the OpenAPI definition. You can override this by specifying the `title` property of [RestApiWithSpecProps.openApiInfo](./cdk-rest-api-with-spec.restapiwithspecprops.openapiinfo.md)<!-- -->.

[props.description](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApiProps.html#description) is the default value of [info.description](https://spec.openapis.org/oas/latest.html#info-object) in the OpenAPI definition. You can override this by specifying the `description` property of [RestApiWithSpecProps.openApiInfo](./cdk-rest-api-with-spec.restapiwithspecprops.openapiinfo.md)<!-- -->.
