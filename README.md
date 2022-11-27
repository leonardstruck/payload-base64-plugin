# payload-blurhash-plugin

Payload CMS plugin for automatic base64 encoding of images.

## Getting started

1. Install the package with `npm i payload-base64-plugin` or `yarn add payload-base64-plugin`.
2. Add the plugin to your `payload.config.ts`:

```ts
import generateBase64 from 'payload-blurhash-plugin';

export default buildConfig({
  /* ... */
  plugins: [generateBase64()],
});
```

## Plugin options

Optionally, you can pass the following options to tweak the behavior of the plugin:

```ts
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
```

# Credits

This plugin is heavily based on the plugin [payload-blurhash-plugin](https://github.com/invakid404/payload-blurhash-plugin) by [invakid404](https://github.com/invakid404).

Since I only changed the encoding to base64, I decided to fork the original plugin instead of creating a new one.

Thank you a lot for your work!
