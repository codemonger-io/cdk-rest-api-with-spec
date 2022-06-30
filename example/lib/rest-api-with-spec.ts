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
  resolveModelResourceId,
} from './openapi-adapter';
import { resolveResourceId } from './utils';

declare global {
  // allows Proxy's constructor to modify the return type (T → U).
  // https://stackoverflow.com/a/50603826
  interface ProxyConstructor {
    new <T extends object, U extends object>(
      target: T,
      handler: ProxyHandler<T>,
    ): U;
  }
}

/** Factory method of a `RestApi`. */
export type RestApiFactory = (
  scope: Construct,
  id: string,
  props?: apigateway.RestApiProps,
) => apigateway.RestApi;

/** Props for `RestApiWithSpec`. */
export type Props = apigateway.RestApiProps & Readonly<{
  /**
   * Factory method of a `RestApi` construct.
   *
   * An instance of `RestApi` will be created if omitted.
   */
  newRestApi?: RestApiFactory;
  /**
   * Version of the documentation.
   *
   * Corresponds to `info.version` in the OpenAPI specification.
   */
  documentationVersion: string;
}>;

const defaultRestApiFactory: RestApiFactory =
  (scope, id, props) => new apigateway.RestApi(scope, id, props);

/**
 * CDK construct that provisions an API Gateway REST API endpoint and also
 * synthesizes the OpenAPI specification for it.
 *
 * If you skip the validation of CDK stacks, this construct cannot synthesize
 * the specification.
 * Because this construct utilizes the validation as a trigger to start
 * synthesis.
 *
 * The constructor is private.
 * Use `createRestApi` instead.
 */
export class RestApiWithSpec {
  // builder of the OpenAPI specification.
  private builder: OpenApiBuilder;
  // user-facing object returned by `createRestApi`.
  private facade: IRestApiWithSpec;
  // cached root resource.
  private _root: IResourceWithSpec;

  private constructor(
    private readonly restApi: apigateway.RestApi,
    readonly props: Props,
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
   * Creates an instance of `RestApi` that also synthesizes the OpenAPI
   * specification.
   *
   * Specify `props.newRestApi` if you want to instantiate a subclass of
   * `RestApi`.
   *
   * `RestApi.restApiId` corresponds to `info.title` in the OpenAPI
   * specification.
   */
  static createRestApi(
    scope: Construct,
    id: string,
    props: Props,
  ): IRestApiWithSpec {
    const newRestApi = props?.newRestApi ?? defaultRestApiFactory;;
    const restApi = newRestApi(scope, id, props);
    const wrapper = new RestApiWithSpec(restApi, props);
    wrapper.facade = new Proxy(restApi, {
      get: (target, prop, receiver) => {
        assert(target === restApi);
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

  // returns the root resource augmented with the features to build the OpenAPI
  // specification.
  private getRoot(): IResourceWithSpec {
    // reuses the instance
    if (this._root != null) {
      return this._root;
    }
    this._root = ResourceWithSpec.createResource(
      this.builder,
      this.facade,
      this.restApi.root,
    );
    return this._root;
  }

  // returns the `addModel` function augmented with the features to build the
  // OpenAPI specification.
  private getAddModel(): IRestApiWithSpec['addModel'] {
    return (id, props) => {
      // translates the schema
      const {
        modelOptions,
        schema,
      } = translateModelOptionsWithSpec(this.restApi, props);
      const model = this.restApi.addModel(id, modelOptions);
      const modelId = resolveModelResourceId(Stack.of(this.restApi), model);
      // registers the model as a schema
      this.builder.addSchema(modelId, schema);
      return model;
    };
  }

  // Synthesizes the OpenAPI specification.
  private synthesizeOpenApi(): string[] {
    console.log('synthesizeOpenApi', 'synthesizing the OpenAPI specification');
    // TODO: let a user choose the destination
    fs.writeFileSync('openapi.json', this.builder.getSpecAsJson(undefined, 2));
    return [];
  }
}

// Translates a given `ModelOptionsWithSpec`.
//
// Returns an object with the following properties,
// - `modelOptions`: `ModelOptions` for the underlying `addModel`.
// - `schema`: `SchemaObject` for the OpenAPI specification.
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

/** Resource with the OpenAPI specification. */
class ResourceWithSpec {
  // user-facing object returned by `createResource`.
  private facade: IResourceWithSpec;

  private constructor(
    private builder: OpenApiBuilder,
    private restApi: IRestApiWithSpec,
    private resource: apigateway.IResource,
  ) {}

  /**
   * Creates an instance of `IResource` that also synthesizes the OpenAPI
   * specification.
   */
  static createResource(
    builder: OpenApiBuilder,
    restApi: IRestApiWithSpec,
    resource: apigateway.IResource,
  ): IResourceWithSpec {
    builder.addPath(resource.path, {
      // methods are assigned by `addMethod`
      // TODO: does anyone want to set the following properties?
      // - summary
      // - description
      // - parameters
    });
    const wrapper = new ResourceWithSpec(builder, restApi, resource);
    wrapper.facade = new Proxy(resource, {
      get: (target, prop, receiver) => {
        switch (prop) {
          case 'addResource':
            return wrapper.getAddResource();
          case 'addMethod':
            return wrapper.getAddMethod();
          default:
            return Reflect.get(target, prop, receiver);
        }
      },
    });
    return wrapper.facade;
  }

  /**
   * Returns the `addResource` function that takes properties necessary to build
   * the OpenAPI specification.
   */
  getAddResource(): IResourceWithSpec['addResource'] {
    return (pathPart, options) => {
      return ResourceWithSpec.createResource(
        this.builder,
        this.restApi,
        this.resource.addResource(pathPart, options),
      );
      // TODO: interpret options
    };
  }

  /**
   * Returns the `addMethod` function that takes properties necessary to build
   * the OpenAPI specification.
   */
  getAddMethod(): IResourceWithSpec['addMethod'] {
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

// Translates a given `MethodOptionsWithSpec`.
//
// Returns an object containing the following fields,
// - `methodOptions`: `MethodOptions` for the underlying `addMethod`.
// - `parameters`: `ParameterObject[]` for the OpenAPI specification.
//
// `options.requestParameters` is first evaluated and translated into
// equivalent `ParameterObject`s.
// A `ParameterObject` corresponding to `options.requestParameters[key]` has
// the following properties,
// - `name`: derived from `key`. See `ParameterKey`.
// - `in`: derived from `key`. See `ParameterKey`.
// - `required`: `options.requestParameters[key]`
// - `schema`:
//     - `type`: 'string'
//
// Then `options.requestParameterSchemas` is evaluated and translated into
// equivalent `ParameterObject`s.
// A `ParameterObject` corresponding to `options.requestParameterSchemas[key]`
// has the following properites,
// - `name`: derived from `key` (see `ParameterKey`)
// - `in`: derived from `key` (see `ParameterKey`)
// - properties of `options.requestParameters[key]`
//
// `options.requestParameterSchemas` also overrides `requestParameters`.
// `requestParameters[key]` becomes
// `options.requestParameterSchemas[key].required ?? false`
//
// Throws a RangeError if `key` specifies the location "multivaluequerystring"
// or "multivalueheader".
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
