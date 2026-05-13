#!/usr/bin/env node
/**
 * yaml-to-gmat.mjs - CLI tool to convert YAML mission files to GMAT scripts
 *
 * Usage:
 *   node yaml-to-gmat.mjs <input.yaml> [output.script]
 *
 * Examples:
 *   node yaml-to-gmat.mjs missions/Ex_FiniteBurn.yaml
 *   node yaml-to-gmat.mjs missions/Ex_FiniteBurn.yaml output/Ex_FiniteBurn.script
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get script directory for relative imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import YAML parser
let yaml;
try {
  yaml = await import('js-yaml');
} catch (e) {
  console.error('Error: js-yaml is required. Install with: npm install js-yaml');
  process.exit(1);
}

// Import converter (relative path from scripts/ to base/interpreter/)
const { YamlMissionConverter } = await import('../base/interpreter/YamlMissionConverter.js');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
  console.log(`
YAML to GMAT Script Converter

Usage:
  node yaml-to-gmat.mjs <input.yaml> [output.script]

Arguments:
  input.yaml     Path to YAML mission definition file
  output.script  Path for output GMAT script (optional, defaults to input name with .script extension)

Options:
  --help, -h     Show this help message
  --verbose, -v  Show detailed conversion information

Examples:
  node yaml-to-gmat.mjs missions/Ex_FiniteBurn.yaml
  node yaml-to-gmat.mjs missions/Ex_FiniteBurn.yaml output/Ex_FiniteBurn.script
`);
  process.exit(0);
}

const verbose = args.includes('--verbose') || args.includes('-v');
const inputFile = args.find(arg => !arg.startsWith('-'));
const outputArg = args.find((arg, i) => !arg.startsWith('-') && args.indexOf(inputFile) !== i);

if (!inputFile) {
  console.error('Error: Input YAML file required');
  process.exit(1);
}

// Determine output file path
const outputFile = outputArg || inputFile.replace(/\.ya?ml$/i, '.script');

console.log(`[yaml-to-gmat] Reading: ${inputFile}`);

// Read and parse YAML
let yamlContent;
try {
  yamlContent = readFileSync(inputFile, 'utf8');
} catch (e) {
  console.error(`Error: Could not read file "${inputFile}": ${e.message}`);
  process.exit(1);
}

let yamlObj;
try {
  yamlObj = yaml.load(yamlContent);
} catch (e) {
  console.error(`Error: Invalid YAML in "${inputFile}": ${e.message}`);
  process.exit(1);
}

if (verbose) {
  console.log(`[yaml-to-gmat] Mission: ${yamlObj.name || 'Unnamed'}`);
  if (yamlObj.description) {
    console.log(`[yaml-to-gmat] Description: ${yamlObj.description}`);
  }
}

// Convert YAML to GMAT script
const converter = new YamlMissionConverter();
const result = converter.convert(yamlObj);

// Report warnings
if (result.warnings.length > 0) {
  console.warn('\nWarnings:');
  for (const warn of result.warnings) {
    console.warn(`  - ${warn}`);
  }
}

// Report errors and exit if any
if (result.errors.length > 0) {
  console.error('\nErrors:');
  for (const err of result.errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

// Ensure output directory exists
const outputDir = dirname(outputFile);
if (outputDir && outputDir !== '.') {
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
}

// Write output script
try {
  writeFileSync(outputFile, result.script);
} catch (e) {
  console.error(`Error: Could not write file "${outputFile}": ${e.message}`);
  process.exit(1);
}

console.log(`[yaml-to-gmat] Generated: ${outputFile}`);

if (verbose) {
  // Count objects and commands
  const lines = result.script.split('\n');
  const createCount = lines.filter(l => l.startsWith('Create ')).length;
  const cmdLines = lines.slice(lines.findIndex(l => l.includes('BeginMissionSequence')));
  const cmdCount = cmdLines.filter(l => l.trim() && !l.startsWith('%') && !l.includes('BeginMissionSequence')).length;
  console.log(`[yaml-to-gmat] Created ${createCount} objects, ${cmdCount} mission commands`);
}
