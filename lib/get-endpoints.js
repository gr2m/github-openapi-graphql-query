export default getEndpoints;

import { filter } from "lodash-es";
import semver from "semver";

import getReleases from "../lib/get-releases.js";
import schemaToEndpoints from "../lib/schema-to-endpoints.js";

const CACHE = {};
async function getEndpoints(options) {
  const releases = await getReleases();

  const version = options.version || releases[0].version;

  const knownVersions = releases.map((release) => release.version).join(",");
  if (!knownVersions.includes(version)) {
    throw new Error(
      `Version "${version}" could not be found. Knonw versions are: ${knownVersions}`
    );
  }

  const url = toJsonFileUrl(version, options);

  if (!CACHE[url]) console.log(`downloading ${url} ...`);
  const body = CACHE[url]
    ? CACHE[url]
    : await fetch(url).then(async (response) => {
        CACHE[url] = await response.text();
        return CACHE[url];
      });

  let result = schemaToEndpoints(JSON.parse(body));

  if (options.filter) {
    result = filter(result, options.filter);
  }

  if (options.limit) {
    result = result.slice(0, options.limit);
  }

  if (options.route) {
    const [method, url] = options.route.trim().split(/\s+/);
    result = result.filter(
      (endpoint) => endpoint.method === method && endpoint.url === url
    );
  }

  if (!options.ignoreChangesBefore) {
    return result.sort(sortByScopeAndId);
  }

  return result
    .filter((endpoint) => {
      // ignore endpoints that have been removed from the docs
      if (
        endpoint.removalDate &&
        endpoint.removalDate < options.ignoreChangesBefore
      ) {
        return false;
      }

      if (!endpoint.renamed) {
        return true;
      }

      return endpoint.renamed.date >= options.ignoreChangesBefore;
    })
    .map((endpoint) => {
      const renamedParameterNames = endpoint.changes
        .filter(
          (change) =>
            change.type === "PARAMETER" &&
            change.date < options.ignoreChangesBefore
        )
        .map((change) => change.before.name);
      return Object.assign({}, endpoint, {
        parameters: endpoint.parameters.filter((parameter) => {
          return !renamedParameterNames.includes(parameter.name);
        }),
        changes: endpoint.changes.filter((change) => {
          return change.date >= options.ignoreChangesBefore;
        }),
      });
    })
    .sort(sortByScopeAndId);
}

function sortByScopeAndId(a, b) {
  if (a.scope > b.scope) return 1;
  if (a.scope < b.scope) return -1;

  if (a.id > b.id) return 1;
  if (a.id < b.id) return -1;

  return 0;
}

function toJsonFileUrl(version, options) {
  const baseUrl = `https://raw.githubusercontent.com/octokit/openapi/v${version}/generated`;

  if (options.ghe === "GHEC") {
    return `${baseUrl}/ghec.deref.json`;
  }

  if (options.ghe) {
    return (
      baseUrl + options.ghe.replace(/^GHE_(\d)(\d+)/, `/ghes-$1.$2.deref.json`)
    );
  }

  // https://github.com/gr2m/github-openapi-graphql-query/issues/81
  if (options.ghecCompatibilityMode && semver.gte(version, "8.0.0")) {
    return `${baseUrl}/ghec.deref.json`;
  }

  return `${baseUrl}/api.github.com.deref.json`;
}
