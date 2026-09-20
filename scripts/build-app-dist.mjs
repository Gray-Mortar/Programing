import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const outputRoot = path.resolve(projectRoot, "app-dist");

const runtimeFiles = ["index.html", "style.css", "home-iris.js"];
const runtimeDirectories = [
  "account",
  "bgm",
  "components",
  "course",
  "cover",
  "experiments",
  "history",
  "images",
  "members",
  "model",
  "tools",
];

const excludedDirectoryNames = new Set([
  ".git",
  ".github",
  ".idea",
  ".vscode",
  "__tests__",
  "android",
  "app-dist",
  "coverage",
  "docs",
  "logs",
  "node_modules",
  "plans",
  "previews",
  "scripts",
  "test",
  "tests",
]);
const excludedExtensions = new Set([
  ".apk",
  ".aab",
  ".bat",
  ".cmd",
  ".doc",
  ".docx",
  ".ipynb",
  ".log",
  ".map",
  ".md",
  ".pdf",
  ".ps1",
  ".py",
  ".sh",
]);

function assertSafeOutputDirectory() {
  if (
    path.dirname(outputRoot) !== projectRoot ||
    path.basename(outputRoot) !== "app-dist"
  ) {
    throw new Error(`Refusing to clean unexpected output path: ${outputRoot}`);
  }
}

function shouldExclude(relativePath, isDirectory) {
  const normalized = relativePath.replaceAll("\\", "/");
  const segments = normalized.toLowerCase().split("/");
  if (segments.some((segment) => excludedDirectoryNames.has(segment))) {
    return true;
  }
  if (isDirectory) return false;

  const basename = path.basename(normalized).toLowerCase();
  const extension = path.extname(basename);
  if (excludedExtensions.has(extension)) return true;
  if (/^(readme|license|changelog)(\.|$)/i.test(basename)) return true;
  if (/^requirements(?:[-_.].*)?\.txt$/i.test(basename)) return true;
  if (/^(train|training)(?:[-_.].*)?/i.test(basename)) return true;
  return /(?:^|[-_.])(test|tests|spec)(?:[-_.]|$)/i.test(basename);
}

async function copyRuntimeTree(source, destination, relativeBase) {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = path.join(relativeBase, entry.name);
    if (shouldExclude(relativePath, entry.isDirectory())) continue;

    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyRuntimeTree(sourcePath, destinationPath, relativePath);
    } else if (entry.isFile()) {
      await mkdir(path.dirname(destinationPath), { recursive: true });
      await copyFile(sourcePath, destinationPath);
    } else {
      throw new Error(`Unsupported runtime entry: ${sourcePath}`);
    }
  }
}

function isExternalReference(reference) {
  return (
    reference.startsWith("//") ||
    /^(?:data|blob|https?|mailto|tel|javascript):/i.test(reference)
  );
}

function extractReferences(filename, source) {
  const extension = path.extname(filename).toLowerCase();
  const references = [];
  if (extension === ".html") {
    const attributePattern = /\b(?:action|href|poster|src)\s*=\s*["']([^"']+)["']/gi;
    for (const match of source.matchAll(attributePattern)) references.push(match[1]);
    const srcsetPattern = /\bsrcset\s*=\s*["']([^"']+)["']/gi;
    for (const match of source.matchAll(srcsetPattern)) {
      for (const candidate of match[1].split(",")) {
        const reference = candidate.trim().split(/\s+/)[0];
        if (reference) references.push(reference);
      }
    }
  } else if (extension === ".css") {
    const urlPattern = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
    for (const match of source.matchAll(urlPattern)) references.push(match[1]);
  } else if (extension === ".js" || extension === ".mjs") {
    const urlPattern = /new\s+URL\(\s*["']([^"']+)["']/gi;
    for (const match of source.matchAll(urlPattern)) references.push(match[1]);
  }
  return references;
}

function referenceCandidates(sourceFile, rawReference) {
  let reference = rawReference.trim();
  if (
    !reference ||
    reference.startsWith("#") ||
    reference.includes("${") ||
    reference.startsWith("var(") ||
    isExternalReference(reference)
  ) {
    return [];
  }
  reference = reference.split("#", 1)[0].split("?", 1)[0];
  if (!reference) return [];
  try {
    reference = decodeURIComponent(reference);
  } catch {
    // Keep the literal path so the verifier can report it if it is missing.
  }

  const resolved = reference.startsWith("/")
    ? path.resolve(outputRoot, `.${reference}`)
    : path.resolve(path.dirname(sourceFile), reference);
  if (resolved !== outputRoot && !resolved.startsWith(`${outputRoot}${path.sep}`)) {
    return [resolved];
  }
  return [resolved, `${resolved}.html`, path.join(resolved, "index.html")];
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(entryPath)));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

async function exists(filename) {
  try {
    await lstat(filename);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function verifyOutput() {
  const expectedTopLevel = new Set([...runtimeFiles, ...runtimeDirectories]);
  const actualTopLevel = await readdir(outputRoot);
  const unexpected = actualTopLevel.filter((name) => !expectedTopLevel.has(name));
  const missing = [];
  for (const name of expectedTopLevel) {
    if (!(await exists(path.join(outputRoot, name)))) missing.push(name);
  }
  if (unexpected.length || missing.length) {
    throw new Error(
      `Invalid app-dist top level. Missing: ${missing.join(", ") || "none"}; ` +
        `unexpected: ${unexpected.join(", ") || "none"}`,
    );
  }

  const files = await collectFiles(outputRoot);
  const excludedFiles = files
    .map((filename) => path.relative(outputRoot, filename))
    .filter((relativePath) => shouldExclude(relativePath, false));
  if (excludedFiles.length) {
    throw new Error(`Excluded files reached app-dist:\n${excludedFiles.join("\n")}`);
  }

  const brokenReferences = [];
  for (const filename of files) {
    const extension = path.extname(filename).toLowerCase();
    if (![".css", ".html", ".js"].includes(extension)) continue;
    const source = await readFile(filename, "utf8");
    for (const reference of extractReferences(filename, source)) {
      const candidates = referenceCandidates(filename, reference);
      if (!candidates.length) continue;
      let found = false;
      for (const candidate of candidates) {
        if (await exists(candidate)) {
          found = true;
          break;
        }
      }
      if (!found) {
        brokenReferences.push(
          `${path.relative(outputRoot, filename)} -> ${reference}`,
        );
      }
    }
  }
  if (brokenReferences.length) {
    throw new Error(`Broken local references:\n${brokenReferences.join("\n")}`);
  }

  let totalBytes = 0;
  const manifestHash = createHash("sha256");
  for (const filename of files.sort()) {
    const contents = await readFile(filename);
    const relativePath = path.relative(outputRoot, filename).replaceAll("\\", "/");
    totalBytes += contents.byteLength;
    manifestHash.update(relativePath);
    manifestHash.update("\0");
    manifestHash.update(contents);
  }
  return {
    bytes: totalBytes,
    files: files.length,
    manifestSha256: manifestHash.digest("hex"),
  };
}

async function build() {
  assertSafeOutputDirectory();
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  for (const filename of runtimeFiles) {
    const source = path.join(projectRoot, filename);
    if (!(await exists(source))) throw new Error(`Missing runtime file: ${source}`);
    await copyFile(source, path.join(outputRoot, filename));
  }
  for (const directory of runtimeDirectories) {
    const source = path.join(projectRoot, directory);
    if (!(await exists(source))) throw new Error(`Missing runtime directory: ${source}`);
    await copyRuntimeTree(source, path.join(outputRoot, directory), directory);
  }

  const result = await verifyOutput();
  console.log(
    `app-dist ready: ${result.files} files, ${result.bytes} bytes, ` +
      `sha256 ${result.manifestSha256}`,
  );
}

await build();
