import { Config } from 'payload/config';
import { CollectionConfig } from 'payload/types';
import { BeforeChangeHook } from 'payload/dist/globals/config/types';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import axios from 'axios';

import { getPlaiceholder } from 'plaiceholder';

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

  /*
   * turn on/off the alpha channel removal
   * Default: true
   */
  removeAlpha?: boolean;
}

/*  This function is used to get the currently uploaded image
 *  and convert it into a buffer so it can be parsed into getPlaiceholder
 */
const getOriginalDocBuffer = async (originalDoc: any) => {
  const response = await axios.get(originalDoc.url, {
    responseType: 'arraybuffer',
  });
  const buffer = Buffer.from(response.data, 'utf-8');
  return buffer;
};

const generateBase64 =
  ({ collections, size = 4, removeAlpha = true }: Base64PluginOptions = {}) =>
  (incomingConfig: Config): Config => {
    const hook: BeforeChangeHook = async ({ data, req, originalDoc }) => {
      if (!req.collection) {
        return data;
      }

      const file = req.files.file;

      const { base64 } = await getPlaiceholder(
        //if file is undefined (e.g. an existing upload object that already has a file uploaded) and no base64 property exists,
        //it will be created by the getOriginalDocBuffer and then parsed into getPlaiceholder
        file && !data.base64
          ? file.data
          : await getOriginalDocBuffer(originalDoc),
        {
          size,
          removeAlpha,
        },
      );

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
