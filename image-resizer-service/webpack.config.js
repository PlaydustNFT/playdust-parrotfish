const path = require('path');
const ZipFilesPlugin = require('webpack-zip-files-plugin');

module.exports = {
    // Specify the entry point for our app.
    entry: {
        ["lambda1"]: "./src/index.js",
        ["lambda2"]: "./src/lambda2/index.js",
    },
    // Specify the output file containing our bundled code
    output: {
        path: __dirname + '/dist',
        filename: '[name]/index.js',
        library: 'index',
        libraryTarget: 'umd'
    },
    target: "node",
    externals: [
        //provided by Lambda runtime
        "aws-sdk",
        "imagick",
        "sharp"
    ],
    module: {
        /**
         * Tell webpack how to load 'json' files.
         * When webpack encounters a 'require()' statement
         * where a 'json' file is being imported, it will use
         * the json-loader.
         */
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/
            },
            {
                test: /\.json$/,
                exclude: /node_modules/,
                loaders: ['json-loader']
            }
        ]
    },
    plugins: [
        new ZipFilesPlugin({
            entries: [
                {src: path.join(__dirname, './dist/lambda1/index.js'), dist: 'index.js'},
            ],
            output: path.join(__dirname, './dist/lambda1/bundle'),
            format: 'zip',
        }),
        new ZipFilesPlugin({
            entries: [
                {src: path.join(__dirname, './dist/lambda2/index.js'), dist: '/index.js'},
            ],
            output: path.join(__dirname, './dist/lambda2/bundle'),
            format: 'zip',
        }),
    ]
};