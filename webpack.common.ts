import path from "path";
import webpack from "webpack";
import CopyWebpackPlugin from "copy-webpack-plugin";
import fg from "fast-glob";
import {EsbuildPlugin} from 'esbuild-loader';

const entries: Record<string, string> = fg.sync("./src/**/*.{ts,tsx,js}").reduce((acc: Record<string, string>, file: string) => {
  const relativePath = path.relative("./src", file);
  const entryKey = relativePath.replace(/\.(ts|tsx|js)$/, '');
  acc[entryKey] = file;
  return acc;
}, {});

const config: webpack.Configuration = {
  entry: entries,
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'vendor',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/](jszip|pdf-lib)[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts', // 'ts' or 'js'
          target: 'es2015',
          minify: true,
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: ["postcss-import", "tailwindcss"],
              },
            },
          },
        ],
      },
    ],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true, // limpa o diretório antes de emitir.
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: "static" }],
    }),
    new EsbuildPlugin(),
    new webpack.ProvidePlugin({
      JSZip: 'jszip',
      PDFLib: 'pdf-lib',
    }),
  ],
};

export default config;
