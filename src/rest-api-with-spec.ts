import * as assert from 'assert';
import * as fs from 'fs';
import { Stack, aws_apigateway as apigateway } from 'aws-cdk-lib';
import { Construct, Node } from 'constructs';
import {
  OpenApiBuilder,
  OperationObject,
  ParameterObject,
  SchemaObject,
} from 'openapi3-ts';

import { translateJsonSchemaEx } from './json-schema-ex';
import {
  IBaseResourceWithSpec,
  IResourceWithSpec,
  IRestApiWithSpec,
  MethodOptionsWithSpec,
  ModelOptionsWithSpec,
  ParameterKey,
} from './models';
import {
  jsonSchemaToSchemaObject,
  methodResponsesToResponses,
  requestModelsToRequestBody,
} from './private/openapi-adapter';
import { resolveResourceId } from './private/utils';

/**
 * Factory method of a
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html | aws_apigateway.RestApi}.
 *
 * @beta
 */
export type RestApiFactory = (
  scope: Construct,
  id: string,
  props?: apigateway.RestApiProps,
) => apigateway.RestApi;

/**
 * Properties for {@link RestApiWithSpec}.
 *
 * @beta
 */
export interface RestApiWithSpecProps extends apigateway.RestApiProps {
  /**
   * Factory method of a
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html | aws_apigateway.RestApi}
   * construct.
   *
   * @remarks
   *
   * An instance of {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html | aws_apigateway.RestApi} will be created if omitted.
   *
   * @beta
   */
  newRestApi?: RestApiFactory;
  /**
   * Version of the documentation.
   *
   * @remarks
   *
   * Corresponds to
   * {@link https://spec.openapis.org/oas/latest.html#info-object | info.version}
   * in the OpenAPI specification.
   *
   * @beta
   */
  documentationVersion: string;
}

const defaultRestApiFactory: RestApiFactory =
  (scope, id, props) => new apigateway.RestApi(scope, id, props);

/**
 * CDK construct that provisions an API Gateway REST API endpoint and also
 * synthesizes the OpenAPI specification for it.
 *
 * @remarks
 *
 * NOTE: Please turn on the validation of CDK stacks.
 * If you skip the validation of CDK stacks, this construct cannot synthesize
 * the specification.
 * Because this construct utilizes the validation as a trigger to start
 * synthesis.
 *
 * The constructor is private.
 * Use {@link RestApiWithSpec.createRestApi} instead.
 *
 * @beta
 */
export class RestApiWithSpec {
  /** builder of the OpenAPI specification. */
  private builder: OpenApiBuilder;
  /** user-facing object returned by `createRestApi`. */
  private facade: IRestApiWithSpec;
  /** cached root resource. */
  private _root: IResourceWithSpec;

  private constructor(
    private readonly restApi: apigateway.RestApi,
    /** Properties. */
    readonly props: RestApiWithSpecProps,
  ) {
    this.builder = new OpenApiBuilder({
      openapi: '3.1.0',
      info: {
        title: restApi.restApiName,
        version: props.documentationVersion,
      },
      paths: {},
      // ends up with crash if no empty defaults
      // TODO: how about to make a PR to openapi3-ts
      components: {
        schemas: {},
        securitySchemes: {},
      },
    });
    // synthesizes the OpenAPI specification at validation.
    Node.of(restApi).addValidation({
      validate: () => this.synthesizeOpenApi(),
    });
  }

  /**
   * Creates an instance of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html | aws_apigateway.RestApi}
   * that also synthesizes the OpenAPI specification.
   *
   * @remarks
   *
   * Specify {@link RestApiWithSpecProps.newRestApi | props.newRestApi}
   * if you want to instantiate a subclass of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html | aws_apigateway.RestApi}.
   *
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApiProps.html#restapiname | props.restApiName}
   * corresponds to
   * {@link https://spec.openapis.org/oas/latest.html#info-object | info.title}
   * in the OpenAPI specification.
   *
   * @beta
   */
  static createRestApi(
    scope: Construct,
    id: string,
    props: RestApiWithSpecProps,
  ): IRestApiWithSpec {
    const newRestApi = props?.newRestApi ?? defaultRestApiFactory;
    const restApi = newRestApi(scope, id, props);
    const wrapper = new RestApiWithSpec(restApi, props);
    wrapper.facade = new Proxy(restApi, {
      get: (target, prop, receiver) => {
        assert.ok(target === restApi);
        switch (prop) {
          case 'underlying':
            return restApi;
          case 'root':
            return wrapper.getRoot();
          case 'addModel':
            return wrapper.getAddModel();
          default:
            return Reflect.get(target, prop, receiver);
        }
      },
    });
    return wrapper.facade;
  }

  /**
   * Returns the root resource augmented with the features to build the OpenAPI
   * specification.
   */
  private getRoot(): IRestApiWithSpec['root'] {
    // reuses the instance
    if (this._root != null) {
      return this._root;
    }
    this._root = ResourceWithSpec.augmentResource(
      this.builder,
      this.facade,
      this.restApi.root,
    );
    return this._root;
  }

  /**
   * Returns the `addModel` function augmented with the features to build the
   * OpenAPI specification.
   */
  private getAddModel(): IRestApiWithSpec['addModel'] {
    return (id, props) => {
      // translates the schema
      const {
        modelOptions,
        schema,
      } = translateModelOptionsWithSpec(this.restApi, props);
      const model = this.restApi.addModel(id, modelOptions);
      const modelId = resolveResourceId(Stack.of(this.restApi), model.modelId);
      // registers the model as a schema
      this.builder.addSchema(modelId, schema);
      return model;
    };
  }

  /** Synthesizes the OpenAPI specification. */
  private synthesizeOpenApi(): string[] {
    console.log('synthesizeOpenApi', 'synthesizing the OpenAPI specification');
    // TODO: let a user choose the destination
    fs.writeFileSync('openapi.json', this.builder.getSpecAsJson(undefined, 2));
    return [];
  }
}

/**
 * Translates a given `ModelOptionsWithSpec`.
 *
 * @remarks
 *
 * Returns an object with the following properties,
 *
 * - `modelOptions`: `ModelOptions` for the underlying `addModel`.
 *
 * - `schema`: `SchemaObject` for the OpenAPI specification.
 *
 * @private
 */
function translateModelOptionsWithSpec(
  restApi: apigateway.IRestApi,
  options: ModelOptionsWithSpec,
): {
  modelOptions: apigateway.ModelOptions,
  schema: SchemaObject,
} {
  const {
    gatewaySchema,
    openapiSchema,
  } = translateJsonSchemaEx(restApi, options.schema);
  return {
    modelOptions: {
      ...options,
      schema: gatewaySchema,
    },
    schema: jsonSchemaToSchemaObject(openapiSchema),
  };
}

/**
 * Resource with the OpenAPI specification.
 *
 * @remarks
 *
 * The constructor is private.
 * Use `augmentResource` instead.
 *
 * @private
 */
class ResourceWithSpec {
  /** user-facing object returned by `augmentResource`. */
  private facade: IResourceWithSpec;

  private constructor(
    private builder: OpenApiBuilder,
    private restApi: IRestApiWithSpec,
    private resource: apigateway.IResource,
    private parent?: IBaseResourceWithSpec,
  ) {}

  /**
   * Augments a given `aws_apigateway.IResource` with the features necessary to
   * synthesize the OpenAPI specification.
   *
   * @param builder
   *
   *   `OpenApiBuilder` that builds the entire OpenAPI specification.
   *
   * @param restApi
   *
   *   The REST API that owns `resource`.
   *
   * @param resource
   *
   *   Resource to be augmented.
   *
   * @param parent
   *
   *   Parent resource.
   *
   * @private
   */
  static augmentResource(
    builder: OpenApiBuilder,
    restApi: IRestApiWithSpec,
    resource: apigateway.IResource,
    parent?: IBaseResourceWithSpec,
  ): IResourceWithSpec {
    const wrapper = new ResourceWithSpec(builder, restApi, resource, parent);
    wrapper.facade = new Proxy(resource, {
      get: (target, prop, receiver) => {
        switch (prop) {
          case 'addResource':
            return wrapper.getAddResource();
          case 'addMethod':
            return wrapper.getAddMethod();
          case 'parentResource':
            return parent;
          case 'defaultMethodOptions':
            // `resource.defaultMethodOptions: MethodOptions` may be interpreted
            // as MethodOptionsWithSpec without any loss of information as long
            // as Resource preserves its properties, and it does as far as I
            // know.
            return resource.defaultMethodOptions;
          default:
            return Reflect.get(target, prop, receiver);
        }
      },
    });
    // creates path-wise parameters shared among all operations under this path
    // 1. creates the default path parameter if the path part is a parameter
    const defaultParameters = translatePathPart(wrapper.facade);
    // 2. overrides the default path parameter with parameters define in
    //    defaultMethodOptions
    const {
      parameters,
    } = translateRequestParameters(wrapper.facade.defaultMethodOptions);
    builder.addPath(resource.path, {
      // TODO: does anyone want to set the following properties per resource?
      // - summary
      // - description
      parameters: mergeParameterObjects(defaultParameters, parameters),
    });
    return wrapper.facade;
  }

  /**
   * Returns the `addResource` function that takes properties necessary to build
   * the OpenAPI specification.
   */
  private getAddResource(): IResourceWithSpec['addResource'] {
    return (pathPart, options) => {
      return ResourceWithSpec.augmentResource(
        this.builder,
        this.restApi,
        this.resource.addResource(pathPart, options),
        this.facade,
      );
      // TODO: interpret options
    };
  }

  /**
   * Returns the `addMethod` function that takes properties necessary to build
   * the OpenAPI specification.
   */
  private getAddMethod(): IResourceWithSpec['addMethod'] {
    return (httpMethod, target, options) => {
      const {
        methodOptions,
        parameters,
      } = translateRequestParameters(options);
      const method = this.resource.addMethod(httpMethod, target, methodOptions);
      const path = this.resource.path;
      const pathItem = this.builder.rootDoc.paths[path];
      const requestBody = options?.requestModels != null
        ? requestModelsToRequestBody(this.restApi, options.requestModels)
        : undefined;
      const responses = options?.methodResponses != null
        ? methodResponsesToResponses(this.restApi, options.methodResponses)
        : undefined;
      const authorizer = options?.authorizer;
      let security: OperationObject['security'] = undefined;
      if (authorizer?.securitySchemeObject != null) {
        const authorizerId =
          resolveResourceId(Stack.of(this.restApi), authorizer.authorizerId);
        this.builder.addSecurityScheme(
          authorizerId,
          authorizer.securitySchemeObject,
        ); // this overwrites the security schema every time the authorizer is
           // referenced in a MethodOptions but should not matter
        security = [
          {
            [authorizerId]: [],
          },
        ];
      }
      pathItem[httpMethod.toLowerCase()] = {
        summary: options?.summary,
        description: options?.description,
        requestBody,
        parameters,
        responses,
        security,
      };
      return method;
    };
  }
}

/**
 * Translates the path part of a given resource.
 *
 * @remarks
 *
 * Returns an array containing the following parameter object if the path part
 * represents a path parameter `{<name>}`.
 * - name: `<name>`
 * - in: 'path'
 * - required: true
 * - schema:
 *     - type: 'string'
 *
 * Otherwise, returns `undefined`.
 *
 * @private
 */
function translatePathPart(
  resource: IBaseResourceWithSpec,
): ParameterObject[] | undefined {
  // locates /{name} at the end
  const match = resource.path.match(/\/\{(.+)\}$/);
  if (match == null) {
    return undefined;
  }
  const name = match[1];
  return [
    {
      name,
      in: 'path',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ];
}

/**
 * Translates a given `MethodOptionsWithSpec`.
 *
 * @remarks
 *
 * Returns an object containing the following fields,
 * - `methodOptions`: `MethodOptions` for the underlying `addMethod`.
 * - `parameters`: `ParameterObject[]` for the OpenAPI specification.
 *
 * `options.requestParameters` is first evaluated and translated into
 * equivalent `ParameterObject`s.
 *  A `ParameterObject` corresponding to `options.requestParameters[key]` has
 * the following properties,
 * - `name`: derived from `key`. See `ParameterKey`.
 * - `in`: derived from `key`. See `ParameterKey`.
 * - `required`: `options.requestParameters[key]`
 * - `schema`:
 *     - `type`: 'string'
 *
 * Then `options.requestParameterSchemas` is evaluated and translated into
 * equivalent `ParameterObject`s.
 * A `ParameterObject` corresponding to `options.requestParameterSchemas[key]`
 * has the following properites,
 * - `name`: derived from `key` (see `ParameterKey`)
 * - `in`: derived from `key` (see `ParameterKey`)
 * - properties of `options.requestParameters[key]`
 *
 * `options.requestParameterSchemas` also overrides `requestParameters`.
 * `requestParameters[key]` becomes
 * `options.requestParameterSchemas[key].required ?? false`
 *
 * @throws RangeError
 *
 *   If `key` specifies the location "multivaluequerystring" or
 *   "multivalueheader".
 *
 * @private
 */
function translateRequestParameters(
  options?: MethodOptionsWithSpec,
): {
  methodOptions?: apigateway.MethodOptions,
  parameters?: ParameterObject[],
} {
  if (options == null) {
    return {};
  }
  const {
    requestParameters,
    requestParameterSchemas,
  } = options;
  if (requestParameters == null && requestParameterSchemas == null) {
    return { methodOptions: options };
  }
  const newRequestParameters =
    requestParameters != null ? { ...requestParameters } : {};
  const parameters: ParameterObject[] = [];
  // translates `requestParameters`
  if (requestParameters != null) {
    for (const key in requestParameters) {
      const parsedKey = ParameterKey.parseParameterKey(key);
      if (parsedKey.explode) {
        throw new RangeError(
          "multivaluequerystring and multivalueheader are not allowed" +
          ` in RequestParameters of MethodOptions: ${key}`,
        );
      }
      const required = requestParameters[key];
      parameters.push({
        name: parsedKey.name,
        in: parsedKey.location,
        required,
      });
    }
  }
  // translates `requestParameterSchemas`
  if (requestParameterSchemas != null) {
    for (const key in requestParameterSchemas) {
      const parsedKey = ParameterKey.parseParameterKey(key);
      if (parsedKey.explode) {
        throw new RangeError(
          "multivaluequerystring and multivalueheader are not allowed" +
          ` in RequestParameters of MethodOptions: ${key}`,
        );
      }
      const baseParameter = requestParameterSchemas[key];
      const parameter = {
        ...baseParameter,
        name: parsedKey.name,
        in: parsedKey.location,
      };
      const index = parameters.findIndex(p => p.name === parameter.name);
      if (index !== -1) {
        console.warn(
          'translateRequestParameters',
          'requestParameterSchemas precedes requestParameters',
          parameter.name,
        );
        parameters[index] = parameter;
      } else {
        parameters.push(parameter);
      }
      // overrides requestParameters
      newRequestParameters[key] = parameter.required ?? false;
    }
  }
  return {
    methodOptions: {
      ...options,
      requestParameters: newRequestParameters,
    },
    parameters,
  };
}

/**
 * Merges given arrays of `ParameterObject`s.
 *
 * @returns
 *
 *   `baseParameters` if `parameters` is `undefined`.
 *   `parameters` if `baseParameters` is `undefined`.
 *   `undefined` if `baseParameters` and `parameters` are both `undefined`.
 *
 * @private
 */
function mergeParameterObjects(
  baseParameters?: ParameterObject[],
  parameters?: ParameterObject[],
): ParameterObject[] | undefined {
  if (parameters == null) {
    return baseParameters;
  }
  if (baseParameters == null) {
    return parameters;
  }
  // overwrites `baseParameters` with `parameters`
  const mergedParameters = [...baseParameters];
  for (const parameter of parameters) {
    const index = mergedParameters.findIndex(p => p.name === parameter.name);
    if (index !== -1) {
      mergedParameters[index] = parameter;
    } else {
      mergedParameters.push(parameter);
    }
  }
  return mergedParameters;
}
