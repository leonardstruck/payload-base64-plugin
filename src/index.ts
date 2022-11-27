import { Config } from 'payload/config';
import { CollectionConfig } from 'payload/types';
import { BeforeChangeHook } from 'payload/dist/globals/config/types';
import * as path from 'path';
import { Payload } from 'payload';
import { Collection } from 'payload/dist/collections/config/types';

import { getPlaiceholder } from 'plaiceholder';

const getMediaDirectory = (payload: Payload, collection: Collection) => {
  const staticDir = collection.config.upload.staticDir;

  if (path.isAbsolute(staticDir)) {
    return staticDir;
  }

  const configDir = payload.config.paths.configDir;

  return path.join(configDir, staticDir);
};

export interface Base64PluginOptions {
  /*
   * Array of collection slugs that the plugin should apply to.
   * By default, the plugin will apply to all collections with `upload` properties.
   */
  collections?: CollectionConfig['slug'][];

  /*
   * an integer (between 4 and 64) to adjust the returned placeholder size
   * Default: 4
   */
  size?: number;
}

const generateBase64 =
  ({ collections, size = 4 }: Base64PluginOptions = {}) =>
  (incomingConfig: Config): Config => {
    const hook: BeforeChangeHook = async ({ data, req }) => {
      if (!req.collection) {
        return data;
      }

      const mediaDir = getMediaDirectory(req.payload, req.collection);

      const { base64 } = await getPlaiceholder(`/${data.filename}`, {
        size,
        dir: mediaDir,
      });

      return {
        ...data,
        base64,
      };
    };

    return {
      ...incomingConfig,
      collections:
        incomingConfig.collections?.map((collection) => {
          if (!collection.upload) {
            return collection;
          }

          if (collections && !collections.includes(collection.slug)) {
            return collection;
          }

          return {
            ...collection,
            fields: [
              ...collection.fields,
              {
                name: 'base64',
                type: 'text',
              },
            ],
            hooks: {
              ...collection.hooks,
              beforeChange: [...(collection.hooks?.beforeChange ?? []), hook],
            },
          };
        }) ?? [],
      admin: {
        ...incomingConfig.admin,
        webpack: (webpackConfig) => {
          const modifiedConfig = {
            ...webpackConfig,
            resolve: {
              ...webpackConfig.resolve,
              alias: {
                ...webpackConfig.resolve?.alias,
                'payload-base64-plugin': path.resolve(
                  __dirname,
                  './mock-plugin',
                ),
              },
            },
          };

          return (
            incomingConfig.admin?.webpack?.(modifiedConfig) ?? modifiedConfig
          );
        },
      },
    };
  };

export default generateBase64;
