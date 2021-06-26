module.exports = {
  applyWorkaround,
};

function applyWorkaround(endpoint) {
  setIsGithubCloudOnly(endpoint);
}

const IS_GITHUB_CLOUD_ONLY_ROUTES = [
  "PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/runners/{runner_id}",
  "POST /orgs/{org}/actions/runner-groups",
  "DELETE /orgs/{org}/actions/runner-groups/{runner_group_id}",
  "GET /orgs/{org}/actions/runner-groups/{runner_group_id}",
  "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories",
  "GET /orgs/{org}/actions/runner-groups",
  "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/runners",
  "DELETE /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id}",
  "DELETE /orgs/{org}/actions/runner-groups/{runner_group_id}/runners/{runner_id}",
  "PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories",
  "PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/runners",
  "PATCH /orgs/{org}/actions/runner-groups/{runner_group_id}",
  "PUT /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations/{org_id}",
  "PUT /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/runners/{runner_id}",
  "POST /enterprises/{enterprise}/actions/runners/registration-token",
  "POST /enterprises/{enterprise}/actions/runners/remove-token",
  "POST /enterprises/{enterprise}/actions/runner-groups",
  "DELETE /enterprises/{enterprise}/actions/runners/{runner_id}",
  "DELETE /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}",
  "GET /enterprises/{enterprise}/actions/runners/{runner_id}",
  "GET /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}",
  "GET /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations",
  "GET /enterprises/{enterprise}/actions/runners/downloads",
  "GET /enterprises/{enterprise}/actions/runner-groups",
  "GET /enterprises/{enterprise}/actions/runners",
  "GET /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/runners",
  "DELETE /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations/{org_id}",
  "DELETE /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/runners/{runner_id}",
  "PUT /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations",
  "PUT /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/runners",
  "PATCH /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}",
];

/**
 * Due to complications in how the OpenAPI artifacts are currently generated, the `isGithubCloudOnly`
 * is currently not set to `false` for several routes.
 */
function setIsGithubCloudOnly(endpoint) {
  const route = [endpoint.method, endpoint.url].join(" ");

  if (IS_GITHUB_CLOUD_ONLY_ROUTES.includes(route)) {
    endpoint.isGithubCloudOnly = true;
  }
}
