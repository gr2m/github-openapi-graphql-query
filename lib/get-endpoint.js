export default getEndpoint;

import getEndpoints from "./get-endpoints.js"

async function getEndpoint(options) {
  if (!options.route) {
    throw new Error("route parameter is required for endpoint() queries");
  }

  const endpoints = await getEndpoints(options);

  const [methodOption, url] = options.route.split(/\s+/);
  const method = methodOption.toUpperCase();

  return endpoints.find(
    (endpoint) => endpoint.method === method && endpoint.url === url
  );
}
