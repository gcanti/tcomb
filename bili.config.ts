import { Config } from "bili";

const config: Config = {
  input: {
    tcomb: "index.js"
  },
  output: {
    format: ["cjs", "esm", "umd", "iife"],
    moduleName: "tcomb",
    sourceMap: true,
    sourceMapExcludeSources: true
  },
  babel: {
    minimal: true,
    babelrc: false
  },
  extendConfig(config, { format }) {
    if (format === "esm") {
      config.output.fileName = "[name].module.js";
    }
    if (format === "umd" || format === "iife") {
      config.env = {
        NODE_ENV: "development"
      };
      config.output.minify = true;
    }
    return config;
  }
};

export default config;
