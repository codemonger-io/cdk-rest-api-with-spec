import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import { SecuritySchemeObject } from 'openapi3-ts';

/**
 * Authorizer augmented with the features to describe the OpenAPI specification.
 */
export interface IAuthorizerWithSpec extends apigateway.IAuthorizer {
  /** Security scheme object representing this authorizer. */
  securitySchemeObject?: SecuritySchemeObject;
}

/**
 * Makes a given `IAuthorizer` an `IAuthorizerWithSpec` by augmenting it with a
 * specified security scheme object.
 *
 * @param authorizer
 *
 *   Authorizer to be augmented.
 *
 * @param securitySchemeObject
 *
 *   Security scheme object to add to `authorizer`.
 *
 * @return
 *
 *   `authorizer` with `securitySchemeObject`.
 */
export function augmentAuthorizer(
  authorizer: apigateway.IAuthorizer,
  securitySchemeObject: SecuritySchemeObject,
): IAuthorizerWithSpec {
  return new Proxy(authorizer, {
    get: (target, prop, receiver) => {
      if (prop === 'securitySchemeObject') {
        return securitySchemeObject;
      } else {
        return Reflect.get(target, prop, receiver);
      }
    },
  });
}
