module.exports = getReleases;

const got = require("got");
const semver = require("semver");

let RELEASES;

async function getReleases() {
  if (RELEASES) return RELEASES;

  const url =
    "https://api.github.com/repos/octokit/openapi/releases?per_page=100";
  console.log("downloading releases from %s", url);
  const { body } = await got(url, {
    headers: process.env.GITHUB_TOKEN
      ? {
          authorization: `token ${process.env.GITHUB_TOKEN}`,
        }
      : {},
  });
  const data = JSON.parse(body);
  RELEASES = data
    .map((release) => {
      return {
        version: release.tag_name.substr(1),
        created_at: release.created_at,
      };
    })
    .filter((release) => semver.valid(release.version))
    .sort((a, b) => semver.compare(b.version, a.version));

  return RELEASES;
}
