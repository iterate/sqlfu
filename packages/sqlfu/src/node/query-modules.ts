// `.sql` files as modules, without `sqlfu generate`: shared by the TypeScript content mapper
// (`content-mapper.ts`) and the Node loader (`register-hooks.ts`). Each `.sql` file belongs to the nearest
// sqlfu config above it, and each config gets one renderer, which keeps its typegen scratch database open.
import path from 'node:path';

import {createQueryModuleRenderer, type RenderedQueryModule} from '../typegen/index.js';
import {findNearestConfigPath, loadProjectStateFromConfigPath} from './config.js';
import {createNodeHost} from './host.js';

type Renderer = Awaited<ReturnType<typeof createQueryModuleRenderer>>;

export function createQueryModules() {
  const renderers = new Map<string, Promise<Renderer>>();

  async function rendererFor(configPath: string): Promise<Renderer> {
    const project = await loadProjectStateFromConfigPath(configPath, path.dirname(configPath));
    if (!project.initialized) throw new Error(`No sqlfu config found at ${configPath}.`);
    if ('inline' in project) {
      throw new Error(
        `${configPath} is an inline config. .sql imports need a file-backed config, with queries: './sql'.`,
      );
    }
    return createQueryModuleRenderer(project.config, await createNodeHost());
  }

  return {
    /** The module for a `.sql` file, or `undefined` for one that isn't a query file (`definitions.sql`, a migration). */
    async render(sqlPath: string, sqlContent: string): Promise<RenderedQueryModule | undefined> {
      const configPath = await findNearestConfigPath(path.dirname(sqlPath));
      if (!configPath) {
        return {
          text: 'export {};\n',
          diagnostics: [{message: 'No sqlfu config found above this file.', start: 0, length: 0}],
        };
      }
      if (!renderers.has(configPath)) renderers.set(configPath, rendererFor(configPath));
      const renderer = await renderers.get(configPath)!;
      if (!renderer.isQueryFile(sqlPath)) return undefined;
      return renderer.render(sqlPath, sqlContent);
    },

    async [Symbol.asyncDispose]() {
      const pending = [...renderers.values()];
      renderers.clear();
      // A renderer that failed to build (a broken config) has nothing to dispose.
      await Promise.all(
        pending.map((renderer) =>
          renderer.then(
            (r) => r[Symbol.asyncDispose](),
            () => {},
          ),
        ),
      );
    },
  };
}
