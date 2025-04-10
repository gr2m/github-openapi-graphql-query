import { readFileSync } from "node:fs"
import { join } from "node:path"

import { compare } from "semver"
import { graphql } from "graphql"
import { makeExecutableSchema } from "@graphql-tools/schema"

import getEndpoints from "./lib/get-endpoints.js"
import getEndpoint from "./lib/get-endpoint.js"
import getReleases from "./lib/get-releases.js"
import formatStringResolver from "./lib/format-string-resolver.js"

const schema = readFileSync(join(import.meta.dirname, "schema.graphql"), "utf8");

const resolvers = {
  Query: {
    endpoints: async (_, options) => getEndpoints(options),
    endpoint: async (_, options) => getEndpoint(options),
    releases: async () => getReleases(),
    lastRelease: async () => {
      const releases = await getReleases();
      const sortedReleases = releases.sort((a, b) =>
        compare(a.version, b.version)
      );
      return sortedReleases.pop();
    },
  },
  Endpoint: {
    id: formatStringResolver.bind(null, "id"),
    scope: formatStringResolver.bind(null, "scope"),
    previews: (endpoint, { required }) => {
      if (!endpoint.previews) {
        return [];
      }

      if (!required) {
        return endpoint.previews;
      }

      return endpoint.previews.filter((preview) => preview.required);
    },
    changes: (endpoint, { type }) => {
      if (!type) {
        return endpoint.changes;
      }

      return endpoint.changes.filter((change) => change.type === type);
    },
  },
  ScopeAndId: {
    scope: formatStringResolver.bind(null, "scope"),
    id: formatStringResolver.bind(null, "id"),
  },
};

export default function (query, variables = {}) {
  return graphql({
    schema: makeExecutableSchema({ typeDefs: schema, resolvers }),
    source: query,
    rootValue: resolvers,
    variableValues: variables,
  });
};
