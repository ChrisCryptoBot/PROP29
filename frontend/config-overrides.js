const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
    '@/services': path.resolve(__dirname, 'src/services'),
    '@/components': path.resolve(__dirname, 'src/components'),
    '@/pages': path.resolve(__dirname, 'src/pages'),
  }),
  // Exclude node_modules from source-map-loader to avoid errors with packages like zod
  (config) => {
    // Find source-map-loader rule and exclude node_modules
    config.module.rules.forEach((rule) => {
      if (rule.enforce === 'pre' && rule.use) {
        const useArray = Array.isArray(rule.use) ? rule.use : [rule.use];
        const hasSourceMapLoader = useArray.some(
          (use) => typeof use === 'string' ? use.includes('source-map-loader') : (use.loader && use.loader.includes('source-map-loader'))
        );
        if (hasSourceMapLoader) {
          rule.exclude = /node_modules/;
        }
      }
    });
    return config;
  }
); 