import * as assert from 'assert';
import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import { BaseParameterObject } from 'openapi3-ts';

import { IAuthorizerWithSpec } from './authorizer';
import { JsonSchemaEx } from './json-schema-ex';

/**
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html | aws_apigateway.RestApi}
 * augmented with the features to build the OpenAPI specification.
 *
 * @beta
 */
export interface IRestApiWithSpec extends apigateway.RestApi {
  /**
   * Underlying
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html | aws_apigateway.RestApi}
   * object.
   *
   * @remarks
   *
   * If you directly change this object, the {@link IRestApiWithSpec} instance
   * cannot sync with your updates.
   *
   * @beta
   */
  underlying: apigateway.RestApi;

  /**
   * Root resource ('/') with the features to build the OpenAPI specification.
   *
   * @beta
   */
  root: IBaseResourceWithSpec;

  /**
   * Adds a new model.
   *
   * @beta
   */
  addModel(id: string, props: ModelOptionsWithSpec): apigateway.Model;
}

/**
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IResource.html | aws_apigateway.IResource}
 * augmented with the features to build the OpenAPI specification.
 *
 * @remarks
 *
 * This interface duplicates {@link IResourceWithSpec} but is necessary because
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html#root | aws_apigateway.RestApi.root}
 * might not satisfy
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.Resource.html | aws_apigateway.Resource}.
 *
 * It might not be obvious but this interface is a super-interface of
 * {@link IResourceWithSpec}.
 *
 * @beta
 */
export interface IBaseResourceWithSpec extends apigateway.IResource {
  /**
   * Default method options with the OpenAPI specification.
   *
   * @beta
   */
  defaultMethodOptions?: MethodOptionsWithSpec;

  /**
   * Parent resource.
   *
   * @remarks
   *
   * `undefined` if this resource represents the root.
   *
   * @beta
   */
  parentResource?: IBaseResourceWithSpec;

  /**
   * Adds a new child resource with the OpenAPI specification.
   *
   * @beta
   */
  addResource(
    pathPart: string,
    options?: ResourceOptionsWithSpec,
  ): IResourceWithSpec;

  /**
   * Adds a method with the OpenAPI specification.
   *
   * @beta
   */
  addMethod(
    httpMethod: string,
    target?: apigateway.Integration,
    options?: MethodOptionsWithSpec,
  ): apigateway.Method;
}

/**
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.Resource.html | aws_apigateway.Resource}
 * augmented with the features to build the OpenAPI specification.
 *
 * @beta
 */
export interface IResourceWithSpec extends apigateway.Resource {
  /**
   * Default method options with the OpenAPI specification.
   *
   * @beta
   */
  defaultMethodOptions?: MethodOptionsWithSpec;

  /**
   * Parent resource.
   *
   * @remarks
   *
   * `undefined` if this resource is the root.
   *
   * @beta
   */
  parentResource?: IBaseResourceWithSpec;

  /**
   * Adds a new child resource with the OpenAPI specification.
   *
   * @beta
   */
  addResource(
    pathPart: string,
    options?: ResourceOptionsWithSpec,
  ): IResourceWithSpec;

  /**
   * Adds a method with the OpenAPI specification.
   *
   * @beta
   */
  addMethod(
    httpMethod: string,
    target?: apigateway.Integration,
    options?: MethodOptionsWithSpec,
  ): apigateway.Method;
}

/**
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.ModelOptions.html | aws_apigateway.ModelOptions}
 * augmented with the properties necessary to build the OpenAPI specification.
 *
 * @remarks
 *
 * Has an extended `schema`.
 *
 * @beta
 */
export interface ModelOptionsWithSpec extends apigateway.ModelOptions {
  /**
   * Extended schema definition.
   *
   * @beta
   */
  schema: JsonSchemaEx;
}

/**
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.ResourceOptions.html | aws_apigateway.ResourceOptions}
 * augmented with the properties necessary to build the OpenAPI specification.
 *
 * @beta
 */
export interface ResourceOptionsWithSpec extends apigateway.ResourceOptions {
  /**
   * Default method options with the OpenAPI specification.
   *
   * @beta
   */
  defaultMethodOptions?: MethodOptionsWithSpec;
}

/**
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html | aws_apigateway.MethodOptions}
 * augmented with the properties necessary to build the OpenAPI specification.
 *
 * @remarks
 *
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#operationname | operationName}
 * corresponds to
 * {@link https://spec.openapis.org/oas/latest.html#operation-object | paths[path][method].operationId}
 * in the OpenAPI specification.
 *
 * @beta
 */
export interface MethodOptionsWithSpec extends apigateway.MethodOptions {
  /**
   * Authorizer augmented with the OpenAPI specification.
   *
   * @beta
   */
  authorizer?: IAuthorizerWithSpec;
  /**
   * Summary of the method.
   *
   * @remarks
   *
   * Corresponds to
   * {@link https://spec.openapis.org/oas/latest.html#operation-object | paths[path][method].summary}
   * in the OpenAPI specification.
   *
   * @beta
   */
  summary?: string;
  /**
   * Description of the method.
   *
   * @remarks
   *
   * Corresponds to
   * {@link https://spec.openapis.org/oas/latest.html#operation-object | paths[path][method].description}
   * in the OpenAPI specification.
   *
   * @beta
   */
  description?: string;
  /**
   * Request parameters which maps parameter objects for the OpenAPI
   * specification instead of boolean values.
   *
   * @remarks
   *
   * Corresponds to
   * {@link https://spec.openapis.org/oas/latest.html#operation-object | paths[path][method].parameters}
   * in the OpenAPI specification.
   *
   * Possible keys are the same as those of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters | requestParameters};
   * i.e., in one of the following forms,
   *
   * ```
   * - method.request.path.<parameter-name>
   * - method.request.querystring.<parameter-name>
   * - method.request.header.<parameter-name>
   * ```
   *
   * A key represents the following properties of the parameter object of the
   * OpenAPI specification,
   *
   * ```
   * - name = <parameter-name>
   * - in
   *   "path" for "method.request.path.*",
   *   "query" for "method.request.querystirng.*",
   *   "header" for "method.request.header.*".
   * ```
   *
   * Values of `required` properties are copied to corresponding boolean values
   * of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters | requestParameters}.
   *
   * If both
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodOptions.html#requestparameters | requestParameters}
   * and `requestParameterSchemas` are specified, `requestParameterSchemas`
   * precedes.
   *
   * @beta
   */
  requestParameterSchemas?: { [key: string]: BaseParameterObject };
  /**
   * Method responses augmented with properties necessary for the OpenAPI
   * specification.
   *
   * @beta
   */
  methodResponses?: MethodResponseWithSpec[],
}

/**
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.MethodResponse.html | aws_apigateway.MethodResponse}
 * augmented with properties necessary for the OpenAPI specification.
 *
 * @beta
 */
export interface MethodResponseWithSpec extends apigateway.MethodResponse {
  /**
   * Description of the response.
   *
   * @beta
   */
  description?: string;
}

/**
 * Parsed request or response parameter key.
 *
 * @beta
 */
export class ParameterKey {
  constructor(
    /** Request or response. */
    readonly direction: 'request' | 'response',
    /** Name of the parameter. */
    readonly name: string,
    /** Location of the parameter. */
    readonly location: 'path' | 'query' | 'header',
    /** Whether the parameter can have multiple values. */
    readonly explode: boolean,
  ) {}

  /**
   * Parses a given request or response parameter key.
   *
   * @remarks
   *
   * A parameter key must have the following form,
   *
   * ```
   * method.<direction>.<location>.<parameter-name>
   * ```
   *
   * `<direction>` must be either `request` or `response`.
   *
   * `<location>` must be one of the following,
   *
   * ```
   * - "path"
   * - "querystring" (invalid if direction=response)
   * - "multivaluequerystring" (invalid direction=response)
   * - "header"
   * - "multivalueheader"
   * ```
   *
   * @param key -
   *
   *   Parameter key to be parsed.
   *
   * @throws RangeError
   *
   *   If `key` is not a valid parameter key.
   *
   * @beta
   */
  static parseParameterKey(key: string): ParameterKey {
    const match = key.match(/^method\.(request|response)\.(path|querystring|multivaluequerystring|header|multivalueheader)\.(.+)/);
    if (match == null) {
      throw new RangeError(`invalid request or response parameter key: ${key}`);
    }
    const direction = match[1];
    assert.ok(direction === 'request' || direction === 'response');
    const mappingLocation = match[2];
    const name = match[3];
    if (direction === 'response') {
      if (
        mappingLocation === 'querystring' ||
        mappingLocation === 'multivaluequerystring'
      ) {
        throw new RangeError(
          'querystring or multivaluequerystring is not acceptable' +
          ` as a response parameter key: ${key}`);
      }
    }
    const explode =
      mappingLocation === 'multivaluequerystring' ||
      mappingLocation === 'multivalueheader';
    let location: 'path' | 'query' | 'header';
    switch (mappingLocation) {
      case 'path':
        location = 'path';
        break;
      case 'querystring':
      case 'multivaluequerystring':
        location = 'query';
        break;
      case 'header':
      case 'multivalueheader':
        location = 'header';
        break;
      default:
        // should not be here
        throw new RangeError(
          `invalid location in parameter key: ${mappingLocation}`,
        );
    }
    return new ParameterKey(direction, name, location, explode);
  }
}
