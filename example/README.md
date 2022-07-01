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
v16.x should work.

## Development

### Setting AWS_PROFILE

```sh
export AWS_PROFILE=kikuo-jp
```

### Setting the toolkit stack name

```sh
TOOLKIT_STACK_NAME=api-with-spec-example-toolkit
```

### Setting the synthesizer qualifier

```sh
TOOLKIT_QUALIFIER=apispc2022
```

### Bootstrapping the toolkit stack

```sh
npx cdk bootstrap --toolkit-stack-name $TOOLKIT_STACK_NAME --qualifier $TOOLKIT_QUALIFIER
```

### Synthesizing a CloudFormation template

```sh
npx cdk synth -c "@aws-cdk/core:bootstrapQualifier=$TOOLKIT_QUALIFIER"
```

### Deploying the CDK stack

```sh
npx cdk deploy --toolkit-stack-name $TOOLKIT_STACK_NAME -c "@aws-cdk/core:bootstrapQualifier=$TOOLKIT_QUALIFIER"
```

You will find a CloudFormation stack `api-with-spec-example` created or updated.