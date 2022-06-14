module.exports = getReleases;

const got = require("got");
const semver = require("semver");

let RELEASES;

async function getReleases(releases = [], page = 1) {
  if (RELEASES) return RELEASES;

  const url =
    "https://api.github.com/repos/octokit/openapi/releases?per_page=100&page=" +
    page;
  console.log("Downloading releases from %s", url);
  const { body, headers } = await got(url, {
    headers: process.env.GITHUB_TOKEN
      ? {
          authorization: `token ${process.env.GITHUB_TOKEN}`,
        }
      : {},
  });

  const data = JSON.parse(body);
  releases.push(
    ...data
      .map((release) => {
        return {
          version: release.tag_name.substr(1),
          created_at: release.created_at,
        };
      })
      .filter((release) => semver.valid(release.version))
      .sort((a, b) => semver.compare(b.version, a.version))
  );

  if ("link" in headers && /rel="next"/.test(headers.link)) {
    await getReleases(releases, page + 1);
  }

  // cache for efficiancy
  RELEASES = releases;

  return RELEASES;
}
