const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
    '@/services': path.resolve(__dirname, 'src/services'),
    '@/components': path.resolve(__dirname, 'src/components'),
    '@/pages': path.resolve(__dirname, 'src/pages'),
  })
); 