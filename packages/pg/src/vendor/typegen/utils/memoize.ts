// @ts-nocheck — vendored from @pgkit/typegen; relaxed strict mode lives in src/vendor/tsconfig.json. See LICENSE.
//
// Sqlfu vendor: replaced pgkit's `pMemoize` + `client.connectionString()`-keyed
// cache with a per-client WeakMap. Same effect (memoize per-pool query
// functions) without the @rebundled/p-memoize dep, and without needing
// `connectionString()` on the client (sqlfu's AsyncClient doesn't expose it).

import type {Queryable} from '../../schemainspect/pgkit-compat.js'

type Memoizable = (client: Queryable, ...args: any[]) => Promise<any>

export const memoizeQueryFn = <Fn extends Memoizable>(fn: Fn): Fn => {
  const cache = new WeakMap<Queryable, Map<string, Promise<any>>>()
  return (async (client: Queryable, ...args: any[]) => {
    let perClient = cache.get(client)
    if (!perClient) {
      perClient = new Map()
      cache.set(client, perClient)
    }
    const key = JSON.stringify(args)
    const existing = perClient.get(key)
    if (existing) return existing
    const result = fn(client, ...args)
    perClient.set(key, result)
    return result
  }) as Fn
}
