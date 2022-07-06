import { Stack, Token } from 'aws-cdk-lib';

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

/**
 * Resolves a given reference to a CloudFormation resource.
 *
 * @remarks
 *
 * A reference to a CloudFormation resource is encoded as a token similar to
 * `"${TOKEN[TOKEN.123]}"` in the CDK runtime.
 * {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Stack.html#resolveobj | aws-cdk-lib.Stack.resolve}
 * can resolve a token as a `Ref` intrinsic function like,
 *
 * ```js
 * {
 *   Ref: '<resource-id>'
 * }
 * ```
 *
 * This function resolves `token` and returns the referenced CloudFormation
 * resource ID (`<resource-id>`).
 *
 * @param stack -
 *
 *   {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Stack.html | aws-cdk-lib.Stack}
 *   to resolve `token`.
 *
 * @param token -
 *
 *   Token that represents a reference to a CloudFormation resource.
 *
 * @returns
 *
 *   CloudFormation resource ID referenced in `token`.
 *
 * @throws RangeError
 *
 *   If `token` does not represent a token.
 *   If `token` does not represent a `Ref` intrinsic function.
 *
 * @internal
 */
export function resolveResourceId(stack: Stack, token: string): string {
  if (!Token.isUnresolved(token)) {
    throw new RangeError(`not a token: ${token}`);
  }
  const ref = stack.resolve(token);
  if (typeof ref !== 'object') {
    throw new RangeError(`not a Ref intrinsic function: ${ref}`);
  }
  const resourceId = ref.Ref;
  if (typeof resourceId !== 'string') {
    throw new RangeError(`not a Ref intrinsic function: ${ref}`);
  }
  return resourceId;
}
