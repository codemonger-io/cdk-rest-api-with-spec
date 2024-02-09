English / [日本語](./README.ja.md)

# Example CDK stack

An example CDK stack for `cdk-rest-api-with-spec`.
This CDK stack was initialized with the following command,

```sh
cdk init --language typescript
```

The CDK version is 2.

## Prerequisites

### Installing Node.js

You have to install [Node.js](https://nodejs.org/en/).
v18.x should work.

## Deploying the CDK stack

### Setting AWS_PROFILE

Example,

```sh
export AWS_PROFILE=kikuo-jp
```

### Setting the toolkit stack name

Example,

```sh
TOOLKIT_STACK_NAME=api-with-spec-example-toolkit
```

### Setting the synthesizer qualifier

Example,

```sh
TOOLKIT_QUALIFIER=apispc2022
```

### Bootstrapping the toolkit stack

```sh
pnpm cdk bootstrap --toolkit-stack-name $TOOLKIT_STACK_NAME --qualifier $TOOLKIT_QUALIFIER
```

### Synthesizing a CloudFormation template

```sh
pnpm cdk synth -c "@aws-cdk/core:bootstrapQualifier=$TOOLKIT_QUALIFIER"
```

You will find the OpenAPI definition created or updated in the file `openapi.json`.

### Deploying the CDK stack

```sh
pnpm cdk deploy --toolkit-stack-name $TOOLKIT_STACK_NAME -c "@aws-cdk/core:bootstrapQualifier=$TOOLKIT_QUALIFIER"
```

You will find a CloudFormation stack `api-with-spec-example` created or updated.

You will also find the OpenAPI definition created or updated in the file `openapi.json`.