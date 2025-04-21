# GitHub OpenAPI GraphQL Query

> Send GraphQL queries against the OpenAPI specification of GitHub's REST API

The OpenAPI specification is published to [@github/openapi](https://www.npmjs.com/package/@github/openapi). All REST API endpoints for https://api.github.com as well as the supported GitHub Enterprise (GHE) versions can be queried.

# Usage

```js
const graphql = require("github-openapi-graphql-query");
const query = `
  {
    endpoints {
      name
      method
      url
      parameters {
        name
        type
      }
    }
  }
`;

graphql(query).then(
  ({ data }) => console.log(data),
  (error) => console.error(error),
);
```

The query loads the definitions from the [latest `@github/openapi` release on GitHub](https://unpkg.com/@github/openapi/). An optional `endpoints(version: "4.6.6") { ... }` parameter can be passed to query a specific version.

All releases can be retrieved using the following query

```graphql
{
  releases {
    version
    createdAt
  }
}
```

The latest release can be retrieved, too

```graphql
{
  lastRelease {
    version
    createdAt
  }
}
```

## GitHub Enterprise Cloud (GHEC) compatibility mode

As of `v8.0.0` of [`octokit/openapi`](https://github.com/octokit/openapi), the `api.github.com` specification no longer include API operations for GitHub Enterprise Cloud (GHEC). In order to avoid this breaking change, the GHEC compatibility mode can be enabled by passing `ghecCompatibilityMode: true` to the `endpoints()` or `endpoint()` query.

```graphql
{
  endpoints(ghecCompatibilityMode: true) {
    name
    method
    url
    parameters {
      name
      type
    }
  }
}
```

## License

[MIT](LICENSE)
