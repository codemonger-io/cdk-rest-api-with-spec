[English](./README.md) / 日本語

# サンプルのCDKスタック

`cdk-rest-api-with-spec`のサンプルCDKスタックです。
このCDKスタックは以下のコマンドで初期化しました。

```sh
cdk init --language typescript
```

CDKのバージョンは2です。

## 事前準備

### Node.jsのインストール

[Node.js](https://nodejs.org/en/)をインストールしてください。
v18.xで大丈夫なはずです。

## CDKスタックをデプロイする

### AWS_PROFILEを設定する

例

```sh
export AWS_PROFILE=kikuo-jp
```

### ツールキットスタック名を設定する

例

```sh
TOOLKIT_STACK_NAME=api-with-spec-example-toolkit
```

### Synthesizer Qualifierを設定する

例

```sh
TOOLKIT_QUALIFIER=apispc2022
```

### ツールキットスタックのBootstrap

```sh
pnpm cdk bootstrap --toolkit-stack-name $TOOLKIT_STACK_NAME --qualifier $TOOLKIT_QUALIFIER
```

### CloudFormationテンプレートを合成する

```sh
pnpm cdk synth -c "@aws-cdk/core:bootstrapQualifier=$TOOLKIT_QUALIFIER"
```

OpenAPI定義を含む`openapi.json`ファイルが作成または更新されます。

### CDKスタックをデプロイする

```sh
pnpm cdk deploy --toolkit-stack-name $TOOLKIT_STACK_NAME -c "@aws-cdk/core:bootstrapQualifier=$TOOLKIT_QUALIFIER"
```

`api-with-spec-example`というCloudFormationスタックが作成または更新されます。

OpenAPI定義を含む`openapi.json`ファイルも作成または更新されます。