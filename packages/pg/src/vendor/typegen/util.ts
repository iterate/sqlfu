// @ts-nocheck — vendored from @pgkit/typegen; relaxed strict mode lives in src/vendor/tsconfig.json. See LICENSE.
//
// Minimal subset of @pgkit/typegen/src/util.ts — only the helpers the
// vendored query/* modules import. Lodash dropped in favor of inline
// implementations.

const camelCase = (str: string): string =>
  str
    .replace(/[^A-Za-z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toLowerCase())

const upperFirst = (str: string): string => (str.length ? str[0].toUpperCase() + str.slice(1) : str)

export const pascalCase = (str: string): string => upperFirst(camelCase(str))

export const simplifyWhitespace = (whitespaceInsensitiveString: string, newlineReplacement = ' ') => {
  return whitespaceInsensitiveString.replace(/\s+/g, newlineReplacement).trim()
}

export const truncate = (str: string, maxLength = 100, truncatedMessage = '... [truncated] ...') => {
  if (str.length <= maxLength) {
    return str
  }
  const halfMax = Math.floor((maxLength - truncatedMessage.length) / 2)
  return str.slice(0, halfMax) + truncatedMessage + str.slice(str.length - halfMax)
}

export const truncateQuery = (str: string) => truncate(simplifyWhitespace(str))

export const tryOrDefault = <T>(fn: () => T, defaultValue: T) => {
  try {
    return fn()
  } catch {
    return defaultValue
  }
}
