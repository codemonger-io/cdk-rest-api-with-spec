English / [日本語](./README.ja.md)

# cdk-rest-api-with-spec

Describe an [Amazon API Gateway (API Gateway)](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html) REST API and the [OpenAPI](https://spec.openapis.org/oas/latest.html) definition at once with `cdk-rest-api-with-spec`.

## For whom is this library?

This library could help you if you would like to write a REST API and the OpenAPI definition at once using the [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/v2/guide/home.html) building blocks.
See ["Background"](#background) for more details.

## Prerequisites

You have to install [Node.js](https://nodejs.org/en/) v12 or later.
I have developed this library with Node.js v16.x.

This library is implemented for the CDK **version 2** (CDK v2) and does not work with the CDK version 1.

## How to install

Please add this repository to your dependencies.

```sh
npm install https://github.com/codemonger-io/cdk-rest-api-with-spec.git#v0.2.2
```

This library is supposed to be used in a CDK v2 project, so it does not include the following modules in the `dependencies` but does in the `peerDependencies`.
- [`aws-cdk-lib`](https://www.npmjs.com/package/aws-cdk-lib)
- [`constructs`](https://www.npmjs.com/package/constructs)

As long as you are working on a CDK v2 project, you should not have to separately install them.

## Getting started

Please instantiate [`RestApiWithSpec`](./api-docs/markdown/cdk-rest-api-with-spec.restapiwithspec.md) instead of [`aws_apigateway.RestApi`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html).

```ts
const api = new RestApiWithSpec(this, 'example-api', {
  description: 'Example of RestApiWithSpec',
  openApiInfo: {
    version: '0.0.1',
  },
  openApiOutputPath: 'openapi.json',
  // ... other options
});
```

After synthesizing the CDK stack, you will find a file `openapi.json` containing the OpenAPI definition created.

Please refer to the sections ["Use cases"](#use-cases) and ["API documentation"](#api-documentation) for more details.
You can also find a working example in the [`example`](./example) folder.

## Background

Recently, I have been urged to write the OpenAPI definition of my REST API on API Gateway.
As far as I know, there are two options to have the OpenAPI definition of a REST API on API Gateway.
1. [Export the OpenAPI definition from an existing REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-export-api.html)
2. [Create a REST API by importing the OpenAPI definition](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-import-api.html)

### 1. Exporting the OpenAPI definition

Without any additional documentation, the OpenAPI definition exported from API Gateway is poorly constrained and useless.
I have to [add a separate documentation resource](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-documenting-api.html) to every component of a REST API.
It would be nice if I could construct REST API components and document them at once.

### 2. Importing the OpenAPI definition

I am familiar with the CDK building blocks to describe a REST API on API Gateway.
I used to write a REST API with a plain [CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html) template and got tired of a lot of repetition.
CDK has relieved me of that pain.
I think writing a plain OpenAPI definition could bring the pain back to me, though I have not tried.

### Third option

Thus, I want a third option that enables me to **write a REST API and the OpenAPI definition at once** using the CDK building blocks.
And I hope this library would be the solution.

## Difference between SpecRestApi

CDK provides a construct with a similar name [`aws_apigateway.SpecRestApi`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.SpecRestApi.html).
The goal of [`aws_apigateway.SpecRestApi`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.SpecRestApi.html) is to create a REST API by importing an existing OpenAPI definition, whereas the goal of this library is, the opposite, to create an OpenAPI definition by constructing a REST API.

## Use cases

### Describing a method

You can specify `summary` and `description` properties to the third argument of the [`IResourceWithSpec.addMethod`](./api-docs/markdown/cdk-rest-api-with-spec.iresourcewithspec.addmethod.md) method.

```ts
api.root.addMethod(
  'GET',
  new apigateway.MockIntegration({
    // ... integration settings
  }),
  {
    operationName: 'getRoot',
    summary: 'Get root', // NEW!
    description: 'Returns the root object', // NEW!
    methodResponses: [
      {
        statusCode: '200',
        description: 'successful operation',
      },
    ],
  }
);
```

The `operationName`, `summary`, and `description` properties correspond to the `operationId`, `summary`, and `description` properties of the [Operation Object](https://spec.openapis.org/oas/latest.html#operation-object) in the OpenAPI definition respectively.

Elements in the `methodResponses` property can have the `description` property which corresponds to the `description` property of the [Response Object](https://spec.openapis.org/oas/latest.html#response-object) in the OpenAPI definition.

### Describing request parameters

You can describe request parameters in the [`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md) property of the third argument of the [`IResourceWithSpec.addMethod`](./api-docs/markdown/cdk-rest-api-with-spec.iresourcewithspec.addmethod.md) method.

```ts
findByStatus.addMethod(
  'GET',
  new apigateway.MockIntegration({
    // ... integration settings
  }),
  {
    operationName: 'findPetsByStatus',
    requestParameterSchemas: { // NEW!
      'method.request.querystring.status': {
        description: 'Status values that need to be considered for filter',
        required: false,
        explode: true,
        schema: {
          type: 'string',
          enum: ['available', 'pending', 'sold'],
          default: 'available',
        },
      },
    },
  },
);
```

The [`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md) property is a collection of key-value pairs and takes the same key as the [`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters) property, but it maps a key to an object which represents a [Parameter Object](https://spec.openapis.org/oas/latest.html#parameter-object), except for the `name` and `in` properties, in the OpenAPI definition rather than a `boolean` value.
The `name` and `in` properties of the [Parameter Object](https://spec.openapis.org/oas/latest.html#parameter-object) are derived from the key.
So the above [`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md) will become the following [Parameter Object](https://spec.openapis.org/oas/latest.html#parameter-object),

```ts
[
  {
    name: 'status',
    in: 'query',
    description: 'Status values that need to be considered for filter',
    required: false,
    explode: true,
    schema: {
      type: 'string',
      enum: ['available', 'pending', 'sold'],
      default: 'available',
    },
  },
]
```

If you specify the [`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md) property, you do not have to specify the [`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters) property.
The [`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters) property given to the underlying [`aws_apigateway.IResource.addMethod`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IResource.html#addwbrmethodhttpmethod-target-options) will be generated from the [`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md) property such that `requestParameters[key] = requestParameterSchemas[key].required`.

If you omit the [`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md) property but specify the [`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters) property, minimal [Parameter Object](https://spec.openapis.org/oas/latest.html#parameter-object)s will be created from the [`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters) property.
Suppose you specify the following object to the [`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters) property,

```ts
{
  'method.request.querystring.status': false,
}
```

then you will get

```ts
[
  {
    name: 'status',
    in: 'query',
    required: false,
    schema: {
      type: 'string',
    },
  },
]
```

If the [`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters) and [`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md) properties are both specified, the [`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md) property precedes.

### Defining a model (schema)

The [`IRestApiWithSpec.addModel`](./api-docs/markdown/cdk-rest-api-with-spec.irestapiwithspec.addmodel.md) method will add a [Schema Object](https://spec.openapis.org/oas/latest.html#schema-object) to the `schemas` property of the [Components Object](https://spec.openapis.org/oas/latest.html#components-object) in the OpenAPI definition.
Here is an example,

```ts
const petModel = api.addModel('PetModel', {
  description: 'A pet',
  contentType: 'application/json',
  schema: {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    title: 'pet',
    description: 'A pet',
    type: apigateway.JsonSchemaType.OBJECT,
    properties: {
      id: {
        description: 'ID of the pet',
        type: apigateway.JsonSchemaType.INTEGER,
        format: 'int64',
        example: 123,
      },
      name: {
        description: 'Name of the pet',
        type: apigateway.JsonSchemaType.STRING,
        example: 'Monaka',
      },
    },
  },
});
```

The `schema` property, [`JsonSchemaEx`](./api-docs/markdown/cdk-rest-api-with-spec.jsonschemaex.md), of the second argument of the [`IRestApiWithSpec.addModel`](./api-docs/markdown/cdk-rest-api-with-spec.irestapiwithspec.addmodel.md) method will be translated into an equivalent [Schema Object](https://spec.openapis.org/oas/latest.html#schema-object) in the OpenAPI definition.

The [`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html) referenced in the `responseModels` property in the `methodResponses` property of the third argument of the [`IResourceWithSpec.addMethod`](./api-docs/markdown/cdk-rest-api-with-spec.iresourcewithspec.addmethod.md) method will be replaced with a reference to the schema corresponding to the [`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html) in the OpenAPI definition.

The `methodResponses` property in the following example,

```ts
petId.addMethod(
  'GET',
  new apigateway.MockIntegration({
    // ... integration settings
  }),
  {
    operationName: 'getPetById',
    methodResponses: [
      {
        statusCode: '200',
        description: 'successful operation',
        responseModels: {
          'application/json': petModel,
        },
      },
    ],
  },
);
```

will become a [Responses Object](https://spec.openapis.org/oas/latest.html#responses-object) similar to the following in the OpenAPI definition.

```ts
{
  '200': {
    description: 'successful operation',
    content: {
      'application/json': {
        schema: {
          '$ref': '#/components/schemas/exampleapiPetModel43E308F7'
        },
      },
    },
  },
}
```

The CloudFormation resource ID given to an [`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html) is used to represent the reference path to the [`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html).

[`JsonSchemaEx`](./api-docs/markdown/cdk-rest-api-with-spec.jsonschemaex.md) which extends [`aws_apigateway.JsonSchema`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html) has an additional property [`modelRef`](./api-docs/markdown/cdk-rest-api-with-spec.jsonschemaex.modelref.md).
You can reference another [`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html) in a schema by using the [`modelRef`](./api-docs/markdown/cdk-rest-api-with-spec.jsonschemaex.modelref.md) property.
The following is an example of referencing another [`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html) to specify the type of array items,

```ts
const petArrayModel = api.addModel('PetArrayModel', {
  description: 'An array of pets',
  contentType: 'application/json',
  schema: {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    title: 'petArray',
    description: 'An array of pets',
    type: apigateway.JsonSchemaType.ARRAY,
    items: {
      modelRef: petModel,
    },
  },
});
```

### Describing an Authorizer

You can augment an existing [aws_apigateway.IAuthorizer](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IAuthorizer.html) with the properties for the OpenAPI definition with the [`augmentAuthorizer`](./api-docs/markdown/cdk-rest-api-with-spec.augmentauthorizer.md) function.

```ts
const authorizer = augmentAuthorizer(
  new apigateway.TokenAuthorizer(
    this,
    'ExampleAuthorizer',
    {
      handler: new nodejs.NodejsFunction(this, 'authorizer', {
        description: 'Example authorizer',
        runtime: lambda.Runtime.NODEJS_16_X,
      }),
    },
  ),
  {
    type: 'apiKey',
    in: 'header',
    name: 'Authorization',
  },
);
```

The second argument of the [`augmentAuthorizer`](./api-docs/markdown/cdk-rest-api-with-spec.augmentauthorizer.md) function is a [Security Scheme Object](https://spec.openapis.org/oas/latest.html#security-scheme-object) to describe the authorizer in the OpenAPI definition.

## API documentation

The latest API documentation is available on [`api-docs/markdown/index.md`](./api-docs/markdown/index.md).

## Development

### Resolving dependencies

```sh
npm install
```

### Building the library

```sh
npm run build
```

You will find the following files created or updated in the `dist` folder,
- `index.js`
- `index.js.map`
- `index.d.ts`

The `dist` folder will be created if it does not exist.

You will also find the file [`api-docs/cdk-rest-api-with-spec.api.md`](./api-docs/cdk-rest-api-with-spec.api.md) updated if there are any changes in the API of this library.

### Generating the documentation

```sh
npm run doc
```

This will replace the contents of the [`api-docs/markdown`](./api-docs/markdown) folder.