import { Fn, Stack, aws_apigateway as apigateway } from 'aws-cdk-lib';

import { resolveResourceId } from './private/utils';

/**
 * Extended
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html | aws_apigateway.JsonSchema}.
 *
 * @remarks
 *
 * Introduces the following new properties,
 * ```
 * - example: example value.
 * - modelRef: reference to another IModel.
 * ```
 *
 * @beta
 */
export interface JsonSchemaEx extends apigateway.JsonSchema {
  /** Example value. */
  example?: any;
  /**
   * Reference to another
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IModel.html | aws_apigateway.IModel}.
   */
  modelRef?: apigateway.IModel;
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#additionalitems | additionalItems}.
   */
  additionalItems?: JsonSchemaEx[];
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#additionalproperties | additionalProperties}.
   */
  additionalProperties?: boolean | JsonSchemaEx;
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#allof | allOf}.
   */
  allOf?: JsonSchemaEx[];
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#anyof | anyOf}.
   */
  anyOf?: JsonSchemaEx[];
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#contains | contains}.
   */
  contains?: JsonSchemaEx | JsonSchemaEx[];
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#definitions | definitions}.
   */
  definitions?: { [k: string]: JsonSchemaEx };
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#dependencies | dependencies}.
   */
  dependencies?: { [k: string]: JsonSchemaEx | string[] };
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#items | items}.
   */
  items?: JsonSchemaEx | JsonSchemaEx[];
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#not | not}.
   */
  not?: JsonSchemaEx;
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#oneof | oneOf}.
   */
  oneOf?: JsonSchemaEx[];
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#patternproperties | patternProperties}.
   */
  patternProperties?: { [k: string]: JsonSchemaEx };
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#properties-1 | properties}.
   */
  properties?: { [k: string]: JsonSchemaEx };
  /**
   * Extension of
   * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.JsonSchema.html#propertynames | propertyNames}.
   */
  propertyNames?: JsonSchemaEx;
};

/** Non-recursive properties of JsonSchemaEx. */
const NON_RECURSIVE_PROPERTIES = [
  'default',
  'description',
  'enum',
  'exclusiveMaximum',
  'exclusiveMinimum',
  'format',
  'id',
  'maxItems',
  'maxLength',
  'maxProperties',
  'maximum',
  'minItems',
  'minLength',
  'minProperties',
  'minimum',
  'multipleOf',
  'pattern',
  'ref',
  'required',
  'schema',
  'title',
  'type',
  'uniqueItems',
] as const;
type NonRecursiveProperty = typeof NON_RECURSIVE_PROPERTIES[number];

/**
 * Single schema properties of `JsonSchemaEx`.
 *
 * → `JsonSchema`
 */
const SINGLE_SCHEMA_PROPERTIES = [
  'not',
  'propertyNames',
] as const;
type SingleSchemaProperty = typeof SINGLE_SCHEMA_PROPERTIES[number];

/**
 * Array schema properties of `JsonSchemaEx`.
 *
 * → `JsonSchema[]`
 */
const ARRAY_SCHEMA_PROPERTIES = [
  'additionalItems',
  'allOf',
  'anyOf',
  'oneOf',
] as const;
type ArraySchemaProperty = typeof ARRAY_SCHEMA_PROPERTIES[number];

/**
 * One-or-more schema properties of `JsonSchemaEx`.
 *
 * → `JsonSchema | JsonSchema[]`
 */
const ONE_OR_MORE_SCHEMA_PROPERTIES = [
  'contains',
  'items',
] as const;
type OneOrMoreSchemaProperty = typeof ONE_OR_MORE_SCHEMA_PROPERTIES[number];

/**
 * Map schema properties of `JsonSchemaEx`.
 *
 * → `{ [k: string]: JsonSchema }`
 */
const MAP_SCHEMA_PROPERTIES = [
  'definitions',
  'patternProperties',
  'properties',
] as const;
type MapSchemaProperty = typeof MAP_SCHEMA_PROPERTIES[number];

/**
 * Output type of {@link translateJsonSchemaEx}.
 *
 * @internal
 */
export type TranslateJsonSchemaExOutput = {
  /** Equivalent `JsonSchema` for the API Gateway model. */
  gatewaySchema: apigateway.JsonSchema;
  /** Equivalent `JsonSchemaEx` for the OpenAPI definition. */
  openapiSchema: JsonSchemaEx;
};

/**
 * Translates a given {@link JsonSchemaEx}.
 *
 * @remarks
 *
 * Intepretation of {@link JsonSchemaEx.modelRef} is different between the API
 * Gateway model and the OpenAPI definition.
 * ```
 * - interpreted as an external model URL for the API Gateway model.
 * - interpreted as an internal hash for the OpenAPI definition.
 * ```
 *
 * @internal
 */
export function translateJsonSchemaEx(
  restApi: apigateway.IRestApi,
  schema: JsonSchemaEx,
): TranslateJsonSchemaExOutput {
  // copies properties to the following objects
  let gatewaySchema = {};
  let openapiSchema = {};
  // `translateSubschemas` updates `gatewaySchema` and `openapiSchema` in a
  // type-safe manner.
  function translateProperty<P extends keyof apigateway.JsonSchema>(
    prop: P,
    translate: (
      restApi: apigateway.IRestApi,
      value: Exclude<JsonSchemaEx[P], undefined>,
    ) => {
      gatewayValue: Exclude<apigateway.JsonSchema[P], undefined>,
      openapiValue: Exclude<JsonSchemaEx[P], undefined>,
    },
  ) {
    if (Object.prototype.hasOwnProperty.call(schema, prop)) {
      const value = schema[prop];
      if (value != null) {
        const {
          gatewayValue,
          openapiValue,
        } = translate(restApi, value);
        gatewaySchema = {
          ...gatewaySchema,
          [prop]: gatewayValue,
        };
        openapiSchema = {
          ...openapiSchema,
          [prop]: openapiValue,
        };
      } else {
        gatewaySchema = {
          ...gatewaySchema,
          [prop]: undefined,
        };
        openapiSchema = {
          ...openapiSchema,
          [prop]: undefined,
        };
      }
    }
  }
  // shallowly copies non-recursive properties
  for (const prop of NON_RECURSIVE_PROPERTIES) {
    translateProperty(prop, (_, value) => ({
      gatewayValue: value,
      openapiValue: value,
    }));
  }
  // copies recursive properties
  for (const prop of SINGLE_SCHEMA_PROPERTIES) {
    translateProperty(prop, translateSingleSchemaProperty);
  }
  for (const prop of ARRAY_SCHEMA_PROPERTIES) {
    translateProperty(prop, translateArraySchemaProperty);
  }
  for (const prop of ONE_OR_MORE_SCHEMA_PROPERTIES) {
    translateProperty(prop, translateOneOrMoreSchemaProperty);
  }
  for (const prop of MAP_SCHEMA_PROPERTIES) {
    translateProperty(prop, translateMapSchemaProperty);
  }
  // deals with corner cases
  // - additionalProperties: boolean | JsonSchemaEx
  translateProperty('additionalProperties', (_, value) => {
    if (typeof value === 'boolean') {
      return {
        gatewayValue: value,
        openapiValue: value,
      };
    } else {
      return translateSingleSchemaProperty(restApi, value);
    }
  });
  // - definitions: { [k: string]: JsonSchemaEx | string[] }
  translateProperty('dependencies', (_, map) => {
    const gatewayValue: { [k: string]: apigateway.JsonSchema | string[] } = {};
    const openapiValue: { [k: string]: JsonSchemaEx | string[] } =
      {};
    for (const key in map) {
      const value = map[key];
      if (Array.isArray(value)) {
        // string[]
        gatewayValue[key] = value;
        openapiValue[key] = value;
      } else {
        const translated = translateSingleSchemaProperty(restApi, value);
        gatewayValue[key] = translated.gatewayValue;
        openapiValue[key] = translated.openapiValue;
      }
    }
    return {
      gatewayValue,
      openapiValue,
    };
  });
  // - example: gatewaySchema does not support
  if (Object.prototype.hasOwnProperty.call(schema, 'example')) {
    openapiSchema = {
      ...openapiSchema,
      example: schema.example,
    };
  }
  // resolves the modelRef
  if (schema.modelRef != null) {
    const model = schema.modelRef;
    const modelId = resolveResourceId(Stack.of(restApi), model.modelId);
    if (schema.ref != null) {
      console.warn(
        'translateJsonSchemaEx',
        'ref is replaced with modelRef',
        schema.ref,
      );
    }
    gatewaySchema = {
      ...gatewaySchema,
      ref: `https://apigateway.amazonaws.com/restapis/${restApi.restApiId}/models/${model.modelId}`,
    };
    openapiSchema = {
      ...openapiSchema,
      ref: `#/components/schemas/${modelId}`,
    };
  }
  return {
    gatewaySchema,
    openapiSchema,
  };
}

/** Translates a single schema property. */
function translateSingleSchemaProperty(
  restApi: apigateway.IRestApi,
  value: JsonSchemaEx,
): {
  gatewayValue: apigateway.JsonSchema,
  openapiValue: JsonSchemaEx,
} {
  const {
    gatewaySchema: gatewayValue,
    openapiSchema: openapiValue,
  } = translateJsonSchemaEx(restApi, value);
  return {
    gatewayValue,
    openapiValue,
  };
}

/** Translates an array schema property. */
function translateArraySchemaProperty(
  restApi: apigateway.IRestApi,
  values: JsonSchemaEx[],
): {
  gatewayValue: apigateway.JsonSchema[],
  openapiValue: JsonSchemaEx[],
} {
  return values.reduce(
    (accum, value) => {
      const {
        gatewaySchema,
        openapiSchema,
      } = translateJsonSchemaEx(restApi, value);
      accum.gatewayValue.push(gatewaySchema);
      accum.openapiValue.push(openapiSchema);
      return accum;
    },
    {
      gatewayValue: [] as apigateway.JsonSchema[],
      openapiValue: [] as JsonSchemaEx[],
    },
  );
}

/** Translates a one-or-more schema property. */
function translateOneOrMoreSchemaProperty(
  restApi: apigateway.IRestApi,
  values: JsonSchemaEx | JsonSchemaEx[],
): {
  gatewayValue: apigateway.JsonSchema | apigateway.JsonSchema[],
  openapiValue: JsonSchemaEx | JsonSchemaEx[],
} {
  if (Array.isArray(values)) {
    // JsonSchemaEx[]
    return translateArraySchemaProperty(restApi, values);
  } else {
    return translateSingleSchemaProperty(restApi, values);
  }
}

/** Translates a map schema property. */
function translateMapSchemaProperty(
  restApi: apigateway.IRestApi,
  map: { [k: string]: JsonSchemaEx },
): {
  gatewayValue: { [k: string]: apigateway.JsonSchema },
  openapiValue: { [k: string]: JsonSchemaEx },
} {
  const gatewayValue: { [k: string]: apigateway.JsonSchema } = {};
  const openapiValue: { [k: string]: JsonSchemaEx } = {};
  for (const key in map) {
    const {
      gatewaySchema,
      openapiSchema,
    } = translateJsonSchemaEx(restApi, map[key]);
    gatewayValue[key] = gatewaySchema;
    openapiValue[key] = openapiSchema;
  }
  return {
    gatewayValue,
    openapiValue,
  };
}
