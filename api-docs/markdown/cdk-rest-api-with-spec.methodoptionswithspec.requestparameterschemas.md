<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [cdk-rest-api-with-spec](./cdk-rest-api-with-spec.md) &gt; [MethodOptionsWithSpec](./cdk-rest-api-with-spec.methodoptionswithspec.md) &gt; [requestParameterSchemas](./cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md)

## MethodOptionsWithSpec.requestParameterSchemas property

> This API is provided as a preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

Request parameters which maps parameter objects for the OpenAPI definition instead of boolean values.

<b>Signature:</b>

```typescript
requestParameterSchemas?: {
        [key: string]: BaseParameterObject;
    };
```

## Remarks

Corresponds to [paths\[path\]\[method\].parameters](https://spec.openapis.org/oas/latest.html#operation-object) in the OpenAPI definition.

Possible keys are the same as those of [requestParameters](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters)<!-- -->; i.e., in one of the following forms,

```
- method.request.path.<parameter-name>
- method.request.querystring.<parameter-name>
- method.request.header.<parameter-name>
```
A key represents the following properties of the parameter object of the OpenAPI definition,

```
- name = <parameter-name>
- in
  "path" for "method.request.path.*",
  "query" for "method.request.querystirng.*",
  "header" for "method.request.header.*".
```
Values of `required` properties are copied to corresponding boolean values of [requestParameters](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters)<!-- -->.

If both [requestParameters](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters) and `requestParameterSchemas` are specified, `requestParameterSchemas` precedes.
