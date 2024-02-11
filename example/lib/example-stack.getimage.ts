import type { APIGatewayEvent, Context, Handler } from 'aws-lambda';

// Returns a PNG image containing a single transparent dot.
export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<string> => {
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';
};
