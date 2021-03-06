<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [cdk-rest-api-with-spec](./cdk-rest-api-with-spec.md) &gt; [ParameterKey](./cdk-rest-api-with-spec.parameterkey.md)

## ParameterKey class

> This API is provided as a preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

Parsed request or response parameter key.

<b>Signature:</b>

```typescript
export declare class ParameterKey 
```

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(direction, name, location, explode)](./cdk-rest-api-with-spec.parameterkey._constructor_.md) |  | <b><i>(BETA)</i></b> Constructs a new instance of the <code>ParameterKey</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [direction](./cdk-rest-api-with-spec.parameterkey.direction.md) | <code>readonly</code> | 'request' \| 'response' | <b><i>(BETA)</i></b> Request or response. |
|  [explode](./cdk-rest-api-with-spec.parameterkey.explode.md) | <code>readonly</code> | boolean | <b><i>(BETA)</i></b> Whether the parameter can have multiple values. |
|  [location](./cdk-rest-api-with-spec.parameterkey.location.md) | <code>readonly</code> | 'path' \| 'query' \| 'header' | <b><i>(BETA)</i></b> Location of the parameter. |
|  [name](./cdk-rest-api-with-spec.parameterkey.name.md) | <code>readonly</code> | string | <b><i>(BETA)</i></b> Name of the parameter. |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [parseParameterKey(key)](./cdk-rest-api-with-spec.parameterkey.parseparameterkey.md) | <code>static</code> | <b><i>(BETA)</i></b> Parses a given request or response parameter key. |

