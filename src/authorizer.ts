import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import { SecuritySchemeObject } from 'openapi3-ts';

/**
 * Authorizer augmented with the features to describe the OpenAPI definition.
 *
 * @beta
 */
export interface IAuthorizerWithSpec extends apigateway.IAuthorizer {
  /** Security scheme object representing this authorizer. */
  securitySchemeObject?: SecuritySchemeObject;
}

/**
 * Makes a given
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.IAuthorizer.html | aws_apigateway.IAuthorizer}
 * an {@link IAuthorizerWithSpec} by augmenting it with a specified security
 * scheme object.
 *
 * @param authorizer -
 *
 *   Authorizer to be augmented.
 *
 * @param securitySchemeObject -
 *
 *   Security scheme object to add to `authorizer`.
 *
 * @returns
 *
 *   `authorizer` with `securitySchemeObject`.
 *
 * @beta
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
