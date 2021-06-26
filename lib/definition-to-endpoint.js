module.exports = definitionToEndpoint;

const schemaToParameters = require("./schema-to-parameters");
const { applyWorkaround } = require("./workarounds");

function definitionToEndpoint({ method: rawMethod, url }, definition) {
  const method = rawMethod.toUpperCase();
  const parameters = {};

  if (!definition.parameters) {
    definition.parameters = [];
  }

  if (!definition.externalDocs) {
    definition.externalDocs = {
      url: "",
    };
  }

  // URL, headers and query parameters
  definition.parameters.forEach((param) => {
    if (param.in === "header") {
      return;
    }

    parameters[param.name] = {
      name: param.name,
      description: param.description,
      type: param.schema.type,
      enum: param.schema.enum,
      in: param.in.toUpperCase(),
    };

    if (param.required) {
      parameters[param.name].required = true;
    }

    if (param.nullable) {
      parameters[param.name].allowNull = true;
    }

    if (param.pattern) {
      parameters[param.name].validation = definition.pattern;
    }
  });

  // request body parameters
  if (definition.requestBody) {
    if (definition["x-github"].requestBodyParameterName) {
      const paramName = definition["x-github"].requestBodyParameterName;
      const contentType = Object.keys(definition.requestBody.content)[0];
      const { schema } = definition.requestBody.content[contentType];
      parameters[paramName] = {
        name: paramName,
        description: schema.description,
        type: schema.type,
        mapToData: true,
        in: "BODY",
      };
      if (schema.type === "array") {
        parameters[paramName].type = schema.items.type + "[]";
      }

      parameters[paramName].required = true;
    } else {
      schemaToParameters(
        parameters,
        // In most cases the only key for `definition.requestBody.content`
        // is "application/json". But there are exceptios so we just return
        // whatever is first. At this point there is no case with multiple
        // content types.
        Object.values(definition.requestBody.content)[0].schema
      );
    }
  }

  // normalize parameters
  Object.values(parameters).forEach((param) => {
    if (!param.required) {
      param.required = false;
    }
    if (!param.allowNull) {
      param.allowNull = false;
    }
    if (!param.description) {
      param.description = "";
    }
  });

  const headerParameters = definition.parameters.filter(
    (param) => param.in === "header"
  );

  const headers = headerParameters
    .filter((param) => param.name !== "accept")
    .map(toHeader);

  // workaround for "POST /markdown/raw"
  if (definition.operationId === "markdown/render-raw") {
    headers.push({
      name: "content-type",
      description: "",
      value: "text/plain; charset=utf-8",
      required: true,
    });

    parameters.data = {
      name: "data",
      type: "string",
      description: "raw markdown text",
      in: "BODY",
      required: true,
      allowNull: false,
      mapToData: true,
    };
  }

  if (definition.operationId === "repos/upload-release-asset") {
    parameters.data = {
      name: "data",
      type: "string",
      description: "The raw file data",
      in: "BODY",
      required: true,
      allowNull: false,
      mapToData: true,
    };
  }

  const [scope, id] = definition.operationId.split("/");

  // workaround for release asset
  // if endpoint has a request body and parameters in query, amend the url;
  const queryParameterNames = definition.parameters
    .filter((param) => param.in === "query")
    .map((param) => param.name);

  if (
    ["DELETE", "PATCH", "POST", "PUT"].includes(method) &&
    queryParameterNames.length
  ) {
    url += `{?${queryParameterNames.join(",")}}`;
  }

  // if endpoint has a servers setting, prefix URL with `{origin}`
  // and add `origin` to parameters
  if (definition.servers) {
    url = `{origin}${url}`;
    parameters["origin"] = {
      name: "origin",
      type: "string",
      description: definition.servers[0].variables.origin.description,
      in: "PATH",
      default: definition.servers[0].variables.origin.default,
    };
  }

  // {
  //   "200": {
  //     "description": "response",
  //     "content": {
  //       "application/json": {
  //         "example": {}
  //       }
  //     }
  //   }
  // }
  const responses = [];
  for (const code of Object.keys(definition.responses)) {
    const { description } = definition.responses[code];

    if (!definition.responses[code].content) {
      responses.push({
        code,
        description,
      });
      continue;
    }

    for (const mediaType of Object.keys(definition.responses[code].content)) {
      const { schema, example, examples } = definition.responses[code].content[
        mediaType
      ];

      const normalizedExamples = example
        ? [{ data: JSON.stringify(example) }]
        : examples
        ? Object.entries(examples).map(([name, { value }]) => {
            return { name, data: JSON.stringify(value) };
          })
        : undefined;

      responses.push({
        code,
        description,
        mediaType,
        schema: JSON.stringify(schema),
        examples: normalizedExamples,
      });
    }
  }

  const endpoint = {
    id,
    scope,
    name: definition.summary,
    description: definition.description || "",
    method,
    url,
    parameters,
    headers,
    documentationUrl: definition.externalDocs.url,
    isDeprecated: !!definition.deprecated,
    deprecationDate: definition["x-github"].deprecationDate,
    removalDate: definition["x-github"].removalDate,
    isEnabledForApps: definition["x-github"].enabledForApps,
    isGithubCloudOnly: definition["x-github"].githubCloudOnly,
    triggersNotification: definition["x-github"].triggersNotification,
    previews: definition["x-github"].previews,
    responses,
    changes: findBreakingChanges({ id, parameters, definition }),
  };

  applyWorkaround(endpoint);

  return endpoint;
}

function toHeader(param) {
  return {
    name: param.name,
    description: param.description,
    value: param.schema.enum ? param.schema.enum[0] : param.schema.default,
    required: param.required || false,
  };
}

function findBreakingChanges({ parameters, definition }) {
  if (!definition["x-octokit"]["changes"]) {
    return [];
  }

  const changes = [];

  for (const change of definition["x-octokit"]["changes"]) {
    if (change.type === "PARAMETER") {
      const { name: beforeName } = change.before;
      changes.push(
        Object.assign({}, change, {
          before: {
            ...parameters[change.parameter],
            name: beforeName,
          },
          after: parameters[change.parameter],
        })
      );

      continue;
    }

    if (change.type === "OPERATION") {
      changes.push(
        Object.assign({}, change, {
          after: {
            operationId: definition.operationId,
          },
        })
      );
      continue;
    }

    throw new Error(`Unknown change type: ${change.type}`);
  }

  return changes;
}
