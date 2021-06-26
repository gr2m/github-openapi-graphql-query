module.exports = schemaToEndpoints;

const definitionToEndpoint = require("./definition-to-endpoint");

function schemaToEndpoints(schema) {
  const endpoints = [];

  for (const [url, definitions] of Object.entries(schema.paths)) {
    for (const [method, definition] of Object.entries(definitions)) {
      const endpoint = definitionToEndpoint({ method, url }, definition);
      const newEndpoints = [endpoint];

      // created new endpoints for past renames
      endpoint.changes.forEach((change) => {
        if (change.type === "OPERATION" && change.before) {
          const renamedEndpoint = Object.assign(
            definitionToEndpoint({ method, url }, definition),
            {
              scope: change.before.operationId.split("/")[0],
              id: change.before.operationId.split("/")[1],
              renamed: {
                before: {
                  scope: change.before.operationId.split("/")[0],
                  id: change.before.operationId.split("/")[1],
                },
                after: {
                  scope: change.after.operationId.split("/")[0],
                  id: change.after.operationId.split("/")[1],
                },
                date: change.date,
                note: change.note,
              },
            }
          );
          newEndpoints.push(renamedEndpoint);
        }
      });

      endpoint.changes.forEach((change) => {
        if (change.type === "PARAMETER") {
          newEndpoints.forEach((endpoint) => {
            if (endpoint.parameters[change.before.name]) return;

            endpoint.parameters[change.before.name] = {
              name: change.before.name,
              alias: change.after && change.after.name,
              deprecated: true,
              type: change.before.type,
              description: change.before.description,
              allowNull: change.before.allowNull,
              in: change.before.in && change.before.in.toUpperCase(),
              required: false,
            };
          });
        }
      });

      endpoints.push(...newEndpoints);
    }
  }

  return endpoints.map((endpoint) => {
    endpoint.parameters = Object.values(endpoint.parameters);
    return endpoint;
  });
}
