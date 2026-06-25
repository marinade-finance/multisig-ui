// webpack 5 (react-scripts 5) removed the automatic Node core-module polyfills that
// @solana/web3.js and @project-serum/anchor rely on in the browser. Re-add them.
const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        assert: require.resolve("assert"),
        buffer: require.resolve("buffer"),
        constants: require.resolve("constants-browserify"),
        crypto: require.resolve("crypto-browserify"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify/browser"),
        path: require.resolve("path-browserify"),
        process: require.resolve("process/browser"),
        querystring: require.resolve("querystring-es3"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url"),
        util: require.resolve("util"),
        vm: require.resolve("vm-browserify"),
        zlib: require.resolve("browserify-zlib"),
        fs: false,
        net: false,
        tls: false,
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );
      // deps ship broken/missing source maps; don't fail the build on them
      config.ignoreWarnings = [/Failed to parse source map/];
      return config;
    },
  },
};
