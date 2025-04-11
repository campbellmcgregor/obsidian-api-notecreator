import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.argv[2];
const manifestFile = "manifest.json";
const versionsFile = "versions.json";

// read manifest.json
let manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
const currentVersion = manifest.version;

// update version in manifest.json
manifest.version = targetVersion;
writeFileSync(manifestFile, JSON.stringify(manifest, null, "\t"));

// update versions.json (if it exists)
try {
    let versions = JSON.parse(readFileSync(versionsFile, "utf8"));
    versions[targetVersion] = manifest.minAppVersion;
    writeFileSync(versionsFile, JSON.stringify(versions, null, "\t"));
} catch (error) {
    console.log(`No ${versionsFile} found. Creating one...`);
    const versions = {};
    versions[targetVersion] = manifest.minAppVersion;
    writeFileSync(versionsFile, JSON.stringify(versions, null, "\t"));
}

console.log(`Updated version from ${currentVersion} to ${targetVersion}`);