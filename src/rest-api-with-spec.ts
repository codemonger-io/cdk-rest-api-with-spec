import * as assert from 'assert';
import * as fs from 'fs';
import { Stack, aws_apigateway as apigateway } from 'aws-cdk-lib';
import { Construct, Node } from 'constructs';
import {
  InfoObject,
  OpenApiBuilder,
  OperationObject,
  ParameterObject,
  SchemaObject,
} from 'openapi3-ts';

import { translateJsonSchemaEx } from './json-schema-ex';
import {
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
 * Properties for {@link RestApiWithSpec}.
 *
 * @beta
 */
export interface RestApiWithSpecProps extends apigateway.RestApiProps {
  /**
   * Info object of the OpenAPI definition.
   *
   * @remarks
   *
   * Corresponds to
   * {@link https://spec.openapis.org/oas/latest.html#info-object | info}
   * in the OpenAPI definition.
   */
  openApiInfo: Partial<InfoObject> & Pick<InfoObject, 'version'>;
    // more straightforward form `Omit<InfoObject, 'title'> & {title?: string}`
    // does not work. it makes `version: any`.
    //
    // here is my reasoning,
    // 1. `Omit` is defined as `Omit<T, K> = Pick<T, Exclude<keyof T, K>>`
    // 2. `InfoObject` extends `ISpecificationExtension`
    // 3. `ISpecificationExtension` has `[extensionName: string]: any`
    // 4. (my guess) most inclusive `string` wins `keyof T` binding
    // 5. (my guess) `Exclude` leaves `string` because it does not extend
    //    "title"
    // 6. (my guess) `Pick` selects properties accessible with `string`; i.e.,
    //    every property falls to `any`
  /** Path to an output file where the OpenAPI definition is to be saved. */
  openApiOutputPath: string;
}

/**
 * CDK construct that provisions an API Gateway REST API endpoint and also
 * synthesizes the OpenAPI definition for it.
 *
 * @remarks
 *
 * NOTE: Please turn on the validation of CDK stacks.
 * If you skip the validation of CDK stacks, this construct cannot synthesize
 * the OpenAPI definition.
 * Because this construct utilizes the validation as a trigger to start
 * synthesis.
 *
 * @beta
 */
export class RestApiWithSpec extends apigateway.RestApi implements IRestApiWithSpec {
  /** builder of the OpenAPI definition. */
  private builder: OpenApiBuilder;
  /** Root resource with the OpenAPI definition. */
  readonly root: IResourceWithSpec;

  /** Initializes a REST API with the OpenAPI specification. */
  constructor(
    scope: Construct,
    id: string,
    readonly props: RestApiWithSpecProps,
  ) {
    super(scope, id, props);
    this.builder = new OpenApiBuilder({
      openapi: '3.1.0',
      info: {
        title: this.restApiName,
        description: props.description,
        ...props.openApiInfo,
      },
      paths: {},
      // ends up with crash if no empty defaults
      // TODO: how about to make a PR to openapi3-ts
      components: {
        schemas: {},
        securitySchemes: {},
      },
    });
    // augments and overrides `root`
    this.root = ResourceWithSpec.augmentResource(this.builder, this, this.root);
    // synthesizes the OpenAPI definition at validation.
    Node.of(this).addValidation({
      validate: () => this.synthesizeOpenApi(),
    });
  }

  /**
   * Returns the `addModel` function augmented with the features to build the
   * OpenAPI definition.
   */
  addModel(id: string, props: ModelOptionsWithSpec): apigateway.Model {
    // translates the schema
    const {
      modelOptions,
      schema,
    } = translateModelOptionsWithSpec(this, props);
    const model = super.addModel(id, modelOptions);
    const modelId = resolveResourceId(Stack.of(this), model.modelId);
    // registers the model as a schema component
    this.builder.addSchema(modelId, schema);
    return model;
  }

  /** Synthesizes the OpenAPI definition. */
  private synthesizeOpenApi(): string[] {
    fs.writeFileSync(
      this.props.openApiOutputPath,
      this.builder.getSpecAsJson(undefined, 2),
    );
    return [];
  }
}

/**
 * Translates a given `ModelOptionsWithSpec`.
 *
 * @remarks
 *
 * Returns an object with the following properties,
 * - `modelOptions`: `ModelOptions` for the underlying `addModel`.
 * - `schema`: `SchemaObject` for the OpenAPI definition.
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
 * Resource with the OpenAPI definition.
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
    private parent?: IResourceWithSpec,
  ) {}

  /**
   * Augments a given `aws_apigateway.IResource` with the features necessary to
   * synthesize the OpenAPI definition.
   *
   * @param builder
   *
   *   `OpenApiBuilder` that builds the entire OpenAPI definition.
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
    parent?: IResourceWithSpec,
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
    // 2. overrides the default path parameter with parameters defined in
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
   * the OpenAPI definition.
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
   * the OpenAPI definition.
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
        ); // this overwrites the security scheme every time the authorizer is
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
  resource: IResourceWithSpec,
): ParameterObject[] | undefined {
  // locates /{name} at the end
  // `name` must not contain a slash: https://github.com/codemonger-io/cdk-rest-api-with-spec/issues/8
  const match = resource.path.match(/\/\{([^\/]+)\}$/);
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
 * - `parameters`: `ParameterObject[]` for the OpenAPI definition.
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
        schema: {
          type: 'string',
        },
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
