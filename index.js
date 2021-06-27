const { readFileSync } = require("fs");
const { join } = require("path");

const semver = require("semver");
const { graphql, buildSchema } = require("graphql");

const getEndpoints = require("./lib/get-endpoints");
const getEndpoint = require("./lib/get-endpoint");
const getReleases = require("./lib/get-releases");
const formatStringResolver = require("./lib/format-string-resolver");

const schema = readFileSync(join(__dirname, "schema.graphql"), "utf8");

const resolvers = {
  Query: {
    endpoints: async (options) => getEndpoints(options),
    endpoint: async (options) => getEndpoint(options),
    releases: async () => getReleases(),
    lastRelease: async () => {
      const releases = await getReleases();
      const sortedReleases = releases.sort((a, b) =>
        semver.compare(a.version, b.version)
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

module.exports = function (query, variables = {}) {
  return graphql(buildSchema(schema), query, resolvers.Query, {}, variables);
};
