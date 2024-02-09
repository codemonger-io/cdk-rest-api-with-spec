[English](./README.md) / 日本語

# cdk-rest-api-with-spec

[Amazon API Gateway (API Gateway)](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)のREST APIとその[OpenAPI](https://spec.openapis.org/oas/latest.html)定義を`cdk-rest-api-with-spec`で一度に記述。

## 誰のためのライブラリ?

[AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/v2/guide/home.html)のパーツを使ってREST APIとそのOpenAPI定義を一度に書いてしまいたい方には役に立つかもしれません。
詳しくは[「背景」](#背景)をご覧ください。

## 事前準備

[Node.js](https://nodejs.org/en/) v12かそれ以降をインストールしてください。
このライブラリはNode.js v16.xで開発しました。

このライブラリはCDK**バージョン2** (CDK v2)向けに実装されており、CDKバージョン1には対応していません。

## インストール方法

このレポジトリを依存関係(`dependencies`)に追加してください。

```sh
npm install https://github.com/codemonger-io/cdk-rest-api-with-spec.git#v0.2.2
```

このライブラリはCDK v2プロジェクトで使用することを想定しており、以下のモジュールは`dependencies`ではなく`peerDependencies`に含んでいます。
- [`aws-cdk-lib`](https://www.npmjs.com/package/aws-cdk-lib)
- [`constructs`](https://www.npmjs.com/package/constructs)

CDK v2プロジェクトで使っている限り、これらを別途インストールする必要はないはずです。

## 始める

[`aws_apigateway.RestApi`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html)の代わりに[`RestApiWithSpec`](./api-docs/markdown/cdk-rest-api-with-spec.restapiwithspec.md)をインスタンス化してください。

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

CDKスタックを合成すると、OpenAPI定義を含む`openapi.json`ファイルが作成されます。

より詳しくは[「使用例」](#使用例)と[「APIドキュメンテーション」](#apiドキュメンテーション)をご参照ください。
実際に動くサンプルも[`example`](./example/README.ja.md)フォルダにあります。

## 背景

最近、API Gatewayで作成したREST APIのOpenAPI定義を書くべきだなぁという思いが強くなっていました。
私の知る限り、API Gatewayで作ったREST APIのOpenAPI定義を得るには2つの選択肢があります。
1. [既存のREST APIからOpenAPI定義をエクスポートする](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-export-api.html)
2. [OpenAPI定義をインポートしてREST APIを作成する](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-import-api.html)

### 1. OpenAPI定義をエクスポートする

追加のドキュメンテーションなしでは、API GatewayからエクスポートされたOpenAPI定義には制約が全然かかっておらず使い物になりません。
REST APIのすべての構成要素に[個別にドキュメンテーションリソースを追加](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-documenting-api.html)しなければなりません。
REST APIの構成要素を作るのと同時にドキュメント作成もできるとよい気がします。

### 2. OpenAPI定義をインポートする

私はCDKのパーツを使ってAPI GatewayのREST APIを記述するのに慣れています。
以前、素の[CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html)テンプレートでREST APIを書いていましたが繰り返しが多すぎて嫌気がさしました。
CDKはその苦痛を取り除いてくれました。
素のOpenAPI定義を書くとその苦痛が戻ってくることになるのではないかと思います(試していませんが・・・)。

### 3番目の選択肢

ということで、CDKのパーツを使いつつ**REST APIとそのOpenAPI定義を一度に書く**ことのできる3番目の選択肢を求めています。
そしてこのライブラリが解決策になることを願っています。

## SpecRestApiとの違い

CDKは[`aws_apigateway.SpecRestApi`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.SpecRestApi.html)という似たような名前を持つConstructを提供しています。
[`aws_apigateway.SpecRestApi`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.SpecRestApi.html)の目的は既存のOpenAPI定義をインポートしてREST APIを作成することである一方、このライブラリの目的はその逆、REST APIを構築することでOpenAPI定義を作成することです。

## 使用例

### メソッドを記述する

[`IResourceWithSpec.addMethod`](./api-docs/markdown/cdk-rest-api-with-spec.iresourcewithspec.addmethod.md)メソッドの3番目の引数の`summary`と`description`プロパティを指定することができます。

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

`operationName`, `summary`, `description`プロパティはそれぞれOpenAPI定義における[Operation Object](https://spec.openapis.org/oas/latest.html#operation-object)の`operationId`, `summary`, `description`プロパティに対応しています。

`methodResponses`プロパティの各要素には`description`プロパティを設定することができ、これはOpenAPI定義における[Response Object](https://spec.openapis.org/oas/latest.html#response-object)の`description`プロパティに対応しています。

### リクエストパラメータを記述する

[`IResourceWithSpec.addMethod`](./api-docs/markdown/cdk-rest-api-with-spec.iresourcewithspec.addmethod.md)メソッドの3番目の引数の[`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md)プロパティでリクエストパラメータを記述することできます。

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

[`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md)プロパティはKey-Valueペアのマップで[`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters)プロパティと同じキーを受け付けますが、キーを`boolean`値ではなくOpenAPI定義における[Parameter Object](https://spec.openapis.org/oas/latest.html#parameter-object)を表すオブジェクト(`name`と`in`プロパティを除く)にマップします。
[Parameter Object](https://spec.openapis.org/oas/latest.html#parameter-object)の`name`と`in`プロパティはキーから導出されます。
ということで上記の[`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md)は以下の[Parameter Object](https://spec.openapis.org/oas/latest.html#parameter-object)になります。

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

[`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md)プロパティを指定した場合、[`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters)プロパティを指定する必要はありません。
ベースとなる[`aws_apigateway.IResource.addMethod`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IResource.html#addwbrmethodhttpmethod-target-options)に渡される[`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters)プロパティは[`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md)プロパティから`requestParameters[key] = requestParameterSchemas[key].required`となるように生成されます。

[`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md)プロパティを省略し[`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters)プロパティを指定した場合、[`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters)プロパティから最低限の[Parameter Object](https://spec.openapis.org/oas/latest.html#parameter-object)を作成します。
以下のオブジェクトを[`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters)プロパティに指定したとすると、

```ts
{
  'method.request.querystring.status': false,
}
```

以下のようになります。

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

[`requestParameters`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters)と[`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md)プロパティの両方を指定した場合、[`requestParameterSchemas`](./api-docs/markdown/cdk-rest-api-with-spec.methodoptionswithspec.requestparameterschemas.md)プロパティが優先されます。

### モデル(スキーマ)を定義する

[`IRestApiWithSpec.addModel`](./api-docs/markdown/cdk-rest-api-with-spec.irestapiwithspec.addmodel.md)メソッドはOpenAPI定義における[Components Object](https://spec.openapis.org/oas/latest.html#components-object)の`schemas`プロパティに[Schema Object](https://spec.openapis.org/oas/latest.html#schema-object)を追加します。
以下は例です。

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

[`IRestApiWithSpec.addModel`](./api-docs/markdown/cdk-rest-api-with-spec.irestapiwithspec.addmodel.md)メソッドの2番目の引数の`schema`プロパティ([`JsonSchemaEx`](./api-docs/markdown/cdk-rest-api-with-spec.jsonschemaex.md))はOpenAPI定義において等価な[Schema Object](https://spec.openapis.org/oas/latest.html#schema-object)に翻訳されます。

 [`IResourceWithSpec.addMethod`](./api-docs/markdown/cdk-rest-api-with-spec.iresourcewithspec.addmethod.md)メソッドの3番目の引数の`methodResponses`プロパティにおける`responseModels`プロパティから参照した[`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html)はOpenAPI定義でその[`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html)に対応するスキーマへの参照に置き換えられます。

以下の例における`methodResponses`プロパティは、

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

OpenAPI定義において以下のような[Responses Object](https://spec.openapis.org/oas/latest.html#responses-object)になります。

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

[`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html)に付与されるCloudFormationのリソースIDが[`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html)の参照パスを表現するのに使われます。

[`aws_apigateway.JsonSchema`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html)の拡張である[`JsonSchemaEx`](./api-docs/markdown/cdk-rest-api-with-spec.jsonschemaex.md)には[`modelRef`](./api-docs/markdown/cdk-rest-api-with-spec.jsonschemaex.modelref.md)という追加のプロパティがあります。
[`modelRef`](./api-docs/markdown/cdk-rest-api-with-spec.jsonschemaex.modelref.md)プロパティを使うとスキーマから別の[`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html)を参照することができます。
以下は配列要素の型を指定するのに別の[`aws_apigateway.IModel`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html)を参照する例です。

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

### Authorizerを記述する

[`augmentAuthorizer`](./api-docs/markdown/cdk-rest-api-with-spec.augmentauthorizer.md)関数を使って既存の[aws_apigateway.IAuthorizer](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IAuthorizer.html)をOpenAPI定義のためのプロパティで拡張することができます。

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

[`augmentAuthorizer`](./api-docs/markdown/cdk-rest-api-with-spec.augmentauthorizer.md)関数の2番目の引数はOpenAPI定義においてAuthorizerを記述する[Security Scheme Object](https://spec.openapis.org/oas/latest.html#security-scheme-object)です。

## APIドキュメンテーション

最新のAPIドキュメンテーションは[`api-docs/markdown/index.md`](./api-docs/markdown/index.md)にあります(日本語版はありません)。

## 開発

### 依存関係を解決する

```sh
npm install
```

### ライブラリをビルドする

```sh
npm run build
```

`dist`フォルダ内で以下のファイルが作成または更新されます。
- `index.js`
- `index.js.map`
- `index.d.ts`

`dist`フォルダは存在しなければ作成されます。

このライブラリのAPIに変更があると[`api-docs/cdk-rest-api-with-spec.api.md`](./api-docs/cdk-rest-api-with-spec.api.md)ファイルも更新されます。

### ドキュメンテーションを生成する

```sh
npm run doc
```

[`api-docs/markdown`](./api-docs/markdown)フォルダのコンテンツを置き換えます。