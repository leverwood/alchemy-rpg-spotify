const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs-extra");
const chokidar = require("chokidar");
const glob = require("glob");

const DIST_DIR = path.join(__dirname, "../dist");

// Define a function to clear and rebuild your project
function rebuild() {
  // Clean /dist directory
  fs.rmSync(DIST_DIR, { recursive: true, force: true });

  // Create /dist directory
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Copy manifest.json into /dist directory
  fs.copyFileSync(
    path.join(__dirname, "manifest.json"),
    path.join(DIST_DIR, "manifest.json")
  );

  fs.copySync(path.join(__dirname, "assets"), path.join(DIST_DIR, "assets"));

  // esbuild.buildSync({
  //   entryPoints: ["./src/background/sw.js"],
  //   bundle: true,
  //   outfile: "dist/background/sw.js",
  // });

  esbuild.buildSync({
    entryPoints: ["./src/content/content.js"],
    bundle: true,
    outfile: "dist/content/content.js",
  });

  // Build the JSX files
  const jsxFiles = glob.sync("src/**/*.jsx");
  for (const file of jsxFiles) {
    const distPath = path.join(
      DIST_DIR,
      path.relative("src", file.replace(/\.jsx$/, ".js"))
    );
    esbuild.buildSync({
      entryPoints: [file],
      bundle: true,
      outfile: distPath,
      loader: { ".jsx": "jsx" },
      define: { "process.env.NODE_ENV": '"production"' },
    });
  }

  // Copy the HTML file that hosts your React app
  const htmlFiles = glob.sync("src/**/*.html");
  for (const file of htmlFiles) {
    const distPath = path.join(DIST_DIR, path.relative("src", file));
    fs.copySync(file, distPath);
  }
}

// Call rebuild initially
rebuild();

// Only watch for file changes if the NODE_ENV environment variable is set to 'development'
if (process.env.NODE_ENV === "development") {
  chokidar.watch("src").on("change", rebuild);
}
