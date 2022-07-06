## API Report File for "cdk-rest-api-with-spec"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { aws_apigateway } from 'aws-cdk-lib';
import { BaseParameterObject } from 'openapi3-ts';
import { Construct } from 'constructs';
import { SecuritySchemeObject } from 'openapi3-ts';

// @public
export function augmentAuthorizer(authorizer: aws_apigateway.IAuthorizer, securitySchemeObject: SecuritySchemeObject): IAuthorizerWithSpec;

// @public
export interface IAuthorizerWithSpec extends aws_apigateway.IAuthorizer {
    securitySchemeObject?: SecuritySchemeObject;
}

// @public
export interface IBaseResourceWithSpec extends aws_apigateway.IResource {
    addMethod(httpMethod: string, target?: aws_apigateway.Integration, // TODO: augment the type
    options?: MethodOptionsWithSpec): aws_apigateway.Method;
    addResource(pathPart: string, options?: ResourceOptionsWithSpec): IResourceWithSpec;
    defaultMethodOptions?: MethodOptionsWithSpec;
    parentResource?: IBaseResourceWithSpec;
}

// @public
export interface IResourceWithSpec extends aws_apigateway.Resource {
    addMethod(httpMethod: string, target?: aws_apigateway.Integration, // TODO: augment the type
    options?: MethodOptionsWithSpec): aws_apigateway.Method;
    addResource(pathPart: string, options?: ResourceOptionsWithSpec): IResourceWithSpec;
    defaultMethodOptions?: MethodOptionsWithSpec;
    parentResource?: IBaseResourceWithSpec;
}

// @public
export interface IRestApiWithSpec extends aws_apigateway.RestApi {
    addModel(id: string, props: ModelOptionsWithSpec): aws_apigateway.Model;
    root: IBaseResourceWithSpec;
    underlying: aws_apigateway.RestApi;
}

// @public
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

// @public
export type MethodOptionsWithSpec = Omit<aws_apigateway.MethodOptions, 'authorizer' | 'methodResponses'> & {
    authorizer?: IAuthorizerWithSpec;
    summary?: string;
    description?: string;
    requestParameterSchemas?: {
        [key: string]: BaseParameterObject;
    };
    methodResponses?: MethodResponseWithSpec[];
};

// @public
export type MethodResponseWithSpec = aws_apigateway.MethodResponse & {
    description?: string;
};

// @public
export type ModelOptionsWithSpec = Omit<aws_apigateway.ModelOptions, 'schema'> & {
    schema: JsonSchemaEx;
};

// @public
export class ParameterKey {
    constructor(direction: 'request' | 'response', name: string, location: 'path' | 'query' | 'header', explode: boolean);
    // (undocumented)
    readonly direction: 'request' | 'response';
    // (undocumented)
    readonly explode: boolean;
    // (undocumented)
    readonly location: 'path' | 'query' | 'header';
    // (undocumented)
    readonly name: string;
    static parseParameterKey(key: string): ParameterKey;
}

// @public
export type Props = aws_apigateway.RestApiProps & Readonly<{
    newRestApi?: RestApiFactory;
    documentationVersion: string;
}>;

// @public
export type ResourceOptionsWithSpec = Omit<aws_apigateway.ResourceOptions, 'defaultMethodOptions'> & {
    defaultMethodOptions?: MethodOptionsWithSpec;
};

// @public
export type RestApiFactory = (scope: Construct, id: string, props?: aws_apigateway.RestApiProps) => aws_apigateway.RestApi;

// @public
export class RestApiWithSpec {
    static createRestApi(scope: Construct, id: string, props: Props): IRestApiWithSpec;
    // (undocumented)
    readonly props: Props;
}

// @public
export function translateJsonSchemaEx(restApi: aws_apigateway.IRestApi, schema: JsonSchemaEx): TranslateJsonSchemaExOutput;

// @public
export type TranslateJsonSchemaExOutput = {
    gatewaySchema: aws_apigateway.JsonSchema;
    openapiSchema: JsonSchemaEx;
};

```