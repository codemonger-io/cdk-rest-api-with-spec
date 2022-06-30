import * as assert from 'assert';
import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import { BaseParameterObject } from 'openapi3-ts';

import { IAuthorizerWithSpec } from './authorizer';
import { JsonSchemaEx } from './json-schema-ex';

/**
 * `RestApi` augmented with the features to build the OpenAPI specification.
 */
export interface IRestApiWithSpec extends apigateway.RestApi {
  /**
   * Underlying `RestApi` object.
   *
   * If you directly change this object, the `IRestApiWithSpec` instance cannot
   * sync with your updates.
   */
  underlying: apigateway.RestApi;

  /**
   * Root resource ('/') with the features to build the OpenAPI specification.
   */
  root: IRootResourceWithSpec;

  /** Adds a new model. */
  addModel(id: string, props: ModelOptionsWithSpec): apigateway.Model;
}

/**
 * Special interface for the root resource.
 *
 * This interface is necessary because `RestApi.root` might not satisfy
 * `Resource`.
 */
export interface IRootResourceWithSpec extends apigateway.IResource {
  /** Adds a new child resource with the OpenAPI specification. */
  addResource(
    pathPart: string,
    options?: apigateway.ResourceOptions, // TODO: augment the type
  ): IResourceWithSpec;

  /** Adds a method with the OpenAPI specification. */
  addMethod(
    httpMethod: string,
    target?: apigateway.Integration, // TODO: augment the type
    options?: MethodOptionsWithSpec,
  ): apigateway.Method; // TODO: augment the type
}

/**
 * `IResource` augmented with the features to build the OpenAPI specification.
 */
export interface IResourceWithSpec extends apigateway.Resource {
  /** Adds a new child resource with the OpenAPI specification. */
  addResource(
    pathPart: string,
    options?: apigateway.ResourceOptions, // TODO: augment the type
  ): IResourceWithSpec;

  /** Adds a method with the OpenAPI specification. */
  addMethod(
    httpMethod: string,
    target?: apigateway.Integration, // TODO: augment the type
    options?: MethodOptionsWithSpec,
  ): apigateway.Method; // TODO: augment the type
}

/**
 * `ModelOptions` augmented with the properties necessary to build the OpenAPI
 * specification.
 *
 * Has an extended `schema`.
 */
export type ModelOptionsWithSpec = Omit<apigateway.ModelOptions, 'schema'> & {
  /** Extended schema definition. */
  schema: JsonSchemaEx;
};

/**
 * `MethodOptions` augmented with the properties necessary to build the OpenAPI
 * specification.
 *
 * `operationName` corresponds to `paths[path][method].operationId`.
 */
export type MethodOptionsWithSpec = Omit<apigateway.MethodOptions, 'authorizer' | 'methodResponses'> & {
  /** Authorizer augmented with the OpenAPI specification. */
  authorizer?: IAuthorizerWithSpec;
  /**
   * Summary of the method.
   *
   * Corresponds to `paths[path][method].summary` in the OpenAPI specification.
   */
  summary?: string;
  /**
   * Description of the method.
   *
   * Corresponds to `paths[path][method].description` in the OpenAPI
   * specification.
   */
  description?: string;
  /**
   * Request parameters which maps parameter objects for the OpenAPI
   * specification instead of boolean values.
   *
   * Corresponds to `paths[path][method].parameters` in the OpenAPI
   * specification.
   *
   * Possible keys are the same as those of `requestParameters`; i.e., in one of
   * the following forms,
   * - `method.request.path.<parameter-name>`
   * - `method.request.querystring.<parameter-name>`
   * - `method.request.header.<parameter-name>`
   *
   * A key represents the following properties of the parameter object of the
   * OpenAPI specification,
   * - `name` = `<parameter-name>`
   * - `in`
   *     - `path` for `method.request.path.*`
   *     - `query` for `method.request.querystirng.*`
   *     - `header` for `method.request.header.*`
   *
   * Values of `required` properties are copied to corresponding boolean values
   * of `requestParameters`.
   *
   * If both `requestParameters` and `requestParameterSchemas` are specified,
   * `requestParameterSchemas` precedes.
   */
  requestParameterSchemas?: { [key: string]: BaseParameterObject };
  /**
   * Method responses augmented with properties necessary for the OpenAPI
   * specification.
   */
  methodResponses?: MethodResponseWithSpec[],
};

/**
 * `MethodResponse` augmented with properties necessary for the OpenAPI
 * specification.
 */
export type MethodResponseWithSpec = apigateway.MethodResponse & {
  /** Description of the response. */
  description?: string;
};

/** Parsed request or response parameter key. */
export class ParameterKey {
  constructor(
    readonly direction: 'request' | 'response',
    readonly name: string,
    readonly location: 'path' | 'query' | 'header',
    readonly explode: boolean,
  ) {}

  /**
   * Parses a given request or response parameter key.
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
   * - `path`
   * - `querystring` (invalid if direction=response)
   * - `multivaluequerystring` (invalid direction=response)
   * - `header`
   * - `multivalueheader`
   *
   * @param key
   *
   *   Parameter key to be parsed.
   *
   * @throws RangeError
   *
   *   If `key` is not a valid parameter key.
   */
  static parseParameterKey(key: string): ParameterKey {
    const match = key.match(/^method\.(request|response)\.(path|querystring|multivaluequerystring|header|multivalueheader)\.(.+)/);
    if (match == null) {
      throw new RangeError(`invalid request or response parameter key: ${key}`);
    }
    const direction = match[1];
    assert(direction === 'request' || direction === 'response');
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
