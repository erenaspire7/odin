import { build } from "esbuild";
import fs from "fs";
import path from "path";
import { promises as fsPromises } from "fs";

const isProd = process.env.NODE_ENV === "production"; // Check if we're in production

let fileArray = [];
const getFilesRecursively = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath);
    } else {
      fileArray.push(filePath);
    }
  });
};
getFilesRecursively("src");

const entryPoints = fileArray.filter((file) => file.endsWith(".ts"));

const myPlugin = {
  name: "fastify-autoreload",
  setup(build) {
    build.onLoad({ filter: /\.(ts)$/ }, async (args) => {
      try {
        const source = await new Promise((resolve, reject) => {
          fs.readFile(args.path, "utf8", (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });

        const actualDirname = path
          .dirname(args.path)
          .replace("src", `${build.initialOptions.outdir}`);

        // Create a modified version with the actual dirname injected
        // This approach uses a function wrapper to provide the correct dirname
        const modifiedSource = `
          const __dirname = ${JSON.stringify(actualDirname)};
          ${source}
        `;

        // Return the modified content with the appropriate loader
        return {
          contents: modifiedSource,
          loader: path.extname(args.path).substring(1) || "js",
        };
      } catch (error) {
        return {
          errors: [{ text: `Failed to process file: ${error.message}` }],
        };
      }
    });
  },
};

build({
  entryPoints,
  tsconfig: "tsconfig.json",
  bundle: true,
  platform: "node",
  outdir: "dist",
  plugins: [myPlugin],
  resolveExtensions: [".ts", ".js", ".json"],
  sourcemap: !isProd, // Enable source maps in development
  minify: isProd, // Minify in production
  target: "ES2022", // Target modern JavaScript
  external: [
    "@mikro-orm/better-sqlite",
    "@mikro-orm/migrations",
    "@mikro-orm/entity-generator",
    "@mikro-orm/mariadb",
    "@mikro-orm/mongodb",
    "@mikro-orm/mysql",
    "@mikro-orm/mssql",
    "@mikro-orm/seeder",
    "@mikro-orm/sqlite",
    "@mikro-orm/libsql",
    "@vscode/sqlite3",
    "sqlite3",
    "better-sqlite3",
    "mysql",
    "mysql2",
    "oracledb",
    "pg-native",
    "pg-query-stream",
    "tedious",
    "libsql",
    "mariadb",
  ],
}).catch(() => process.exit(1)); // Exit process if build fails
