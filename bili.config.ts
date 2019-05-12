import { Config } from "bili";

const config: Config = {
  input: {
    tcomb: "index.js"
  },
  output: {
    format: ["cjs", "umd", "esm"],
    moduleName: "tcomb",
    sourceMap: true,
    sourceMapExcludeSources: true
  },
  babel: {
    minimal: true,
    babelrc: false
  },
  extendConfig(config, { format }) {
    config.env = {
      NODE_ENV: "production"
    };
    if (format === "umd") {
      config.output.minify = true;
    }
    if (format === "esm") {
      config.output.fileName = "[name].module.js";
    }
    return config;
  }
};

export default config;
