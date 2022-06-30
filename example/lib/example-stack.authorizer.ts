import { APIGatewayEvent, Context } from 'aws-lambda';

type Output = {};

/** Function for the token authorizer. */
export const handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<Output> => {
  console.log("authorizing:", event);
  throw new Error('Unauthorized');
}
