module.exports = require('babel-jest').createTransformer({
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins: ["@babel/plugin-proposal-export-default-from"]
});