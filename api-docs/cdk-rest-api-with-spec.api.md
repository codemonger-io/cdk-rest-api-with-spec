## API Report File for "cdk-rest-api-with-spec"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { aws_apigateway } from 'aws-cdk-lib';
import { BaseParameterObject } from 'openapi3-ts';
import { Construct } from 'constructs';
import { InfoObject } from 'openapi3-ts';
import { SecuritySchemeObject } from 'openapi3-ts';

// @beta
export function augmentAuthorizer(authorizer: aws_apigateway.IAuthorizer, securitySchemeObject: SecuritySchemeObject): IAuthorizerWithSpec;

// @beta
export interface IAuthorizerWithSpec extends aws_apigateway.IAuthorizer {
    securitySchemeObject?: SecuritySchemeObject;
}

// @beta
export interface IBaseResourceWithSpec extends aws_apigateway.IResource {
    addMethod(httpMethod: string, target?: aws_apigateway.Integration, options?: MethodOptionsWithSpec): aws_apigateway.Method;
    addResource(pathPart: string, options?: ResourceOptionsWithSpec): IResourceWithSpec;
    defaultMethodOptions?: MethodOptionsWithSpec;
    parentResource?: IBaseResourceWithSpec;
}

// @beta
export interface IResourceWithSpec extends aws_apigateway.Resource {
    addMethod(httpMethod: string, target?: aws_apigateway.Integration, options?: MethodOptionsWithSpec): aws_apigateway.Method;
    addResource(pathPart: string, options?: ResourceOptionsWithSpec): IResourceWithSpec;
    defaultMethodOptions?: MethodOptionsWithSpec;
    parentResource?: IBaseResourceWithSpec;
}

// @beta
export interface IRestApiWithSpec extends aws_apigateway.RestApi {
    addModel(id: string, props: ModelOptionsWithSpec): aws_apigateway.Model;
    root: IBaseResourceWithSpec;
    underlying: aws_apigateway.RestApi;
}

// @beta
export interface JsonSchemaEx extends aws_apigateway.JsonSchema {
    additionalItems?: JsonSchemaEx[];
    additionalProperties?: boolean | JsonSchemaEx;
    allOf?: JsonSchemaEx[];
    anyOf?: JsonSchemaEx[];
    contains?: JsonSchemaEx | JsonSchemaEx[];
    definitions?: {
        [k: string]: JsonSchemaEx;
    };
    dependencies?: {
        [k: string]: JsonSchemaEx | string[];
    };
    example?: any;
    items?: JsonSchemaEx | JsonSchemaEx[];
    modelRef?: aws_apigateway.IModel;
    not?: JsonSchemaEx;
    oneOf?: JsonSchemaEx[];
    patternProperties?: {
        [k: string]: JsonSchemaEx;
    };
    properties?: {
        [k: string]: JsonSchemaEx;
    };
    propertyNames?: JsonSchemaEx;
}

// @beta
export interface MethodOptionsWithSpec extends aws_apigateway.MethodOptions {
    authorizer?: IAuthorizerWithSpec;
    description?: string;
    methodResponses?: MethodResponseWithSpec[];
    requestParameterSchemas?: {
        [key: string]: BaseParameterObject;
    };
    summary?: string;
}

// @beta
export interface MethodResponseWithSpec extends aws_apigateway.MethodResponse {
    description?: string;
}

// @beta
export interface ModelOptionsWithSpec extends aws_apigateway.ModelOptions {
    schema: JsonSchemaEx;
}

// @beta
export class ParameterKey {
    constructor(
    direction: 'request' | 'response',
    name: string,
    location: 'path' | 'query' | 'header',
    explode: boolean);
    readonly direction: 'request' | 'response';
    readonly explode: boolean;
    readonly location: 'path' | 'query' | 'header';
    readonly name: string;
    static parseParameterKey(key: string): ParameterKey;
}

// @beta
export interface ResourceOptionsWithSpec extends aws_apigateway.ResourceOptions {
    defaultMethodOptions?: MethodOptionsWithSpec;
}

// @beta
export type RestApiFactory = (scope: Construct, id: string, props?: aws_apigateway.RestApiProps) => aws_apigateway.RestApi;

// @beta
export class RestApiWithSpec {
    static createRestApi(scope: Construct, id: string, props: RestApiWithSpecProps): IRestApiWithSpec;
    // (undocumented)
    readonly props: RestApiWithSpecProps;
}

// @beta
export interface RestApiWithSpecProps extends aws_apigateway.RestApiProps {
    newRestApi?: RestApiFactory;
    openApiInfo: Partial<InfoObject> & Pick<InfoObject, 'version'>;
    openApiOutputPath: string;
}

```
