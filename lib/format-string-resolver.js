export default formatStringResolver;

import { camelCase, kebabCase } from "lodash-es";

function formatStringResolver(key, object, { format = 'KEBABCASE' }) {
  if (format === 'KEBABCASE') {
    return kebabCase(object[key])
  }

  if (format === 'CAMELCASE') {
    return camelCase(object[key])
  }

  throw new Error(`Format "${format}" is not supported`)
}