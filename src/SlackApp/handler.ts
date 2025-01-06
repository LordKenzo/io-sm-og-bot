import { HttpRequest, InvocationContext } from '@azure/functions'
import * as packageJson from '../../package.json'

export const handler = async (
  request: HttpRequest,
  context: InvocationContext,
) => {
  if (request.method === 'GET') {
    context.log(`Http request on GET for ${request.url}`)
    return {
      body: JSON.stringify({
        name: packageJson.name,
        version: packageJson.version,
      }),
      status: 200,
    }
  } else {
    return {
      body: JSON.stringify({ error: `Method not allowed` }),
      status: 405,
    }
  }
}
