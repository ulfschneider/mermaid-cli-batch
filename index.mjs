#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 12);
import { createMermaidRenderer } from "mermaid-isomorphic";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import pkg from "./package.json" with { type: "json" };

const argDefinitions = [
  { name: "help", alias: "h", type: Boolean, description: "Print the help" },
  {
    name: "input",
    alias: "i",
    type: String,
    multiple: true,
    description:
      "The file or the files to process. Must be text files that contain each a Mermaid diagram definition. A glob description of the file locations is possible.",
  },
  {
    name: "output",
    alias: "o",
    type: String,
    description: "The output folder (optional)",
  },
  {
    name: "screenshot",
    alias: "s",
    type: Boolean,
    description: "Create a PNG screenshot of the diagram (optional)",
  },
  {
    name: "verbose",
    type: Boolean,
    description: "Verbose logging (optional)",
  },
  {
    name: "version",
    alias: "V",
    type: Boolean,
    description: "Indicate the program version",
  },
];

const args = commandLineArgs(argDefinitions);
const renderer = createMermaidRenderer();

if (args.help) {
  const usage = commandLineUsage([
    {
      header: `${pkg.name} version ${pkg.version}`,
      content: `Process multiple mermaid chart definition files in one pass with the console.

      Example:
      npx mermaid-cli-batch --input *.mmd`,
    },
    { header: "Options", optionList: argDefinitions },
  ]);
  console.log(usage);
} else if (args.version) {
  console.log(`${pkg.name} version ${pkg.version}`);
}

function escapeRegExp(string) {
  //https://stackoverflow.com/a/6969486
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function writeLog(message) {
  if (args.verbose) {
    console.log(chalk.white.bold(`[${pkg.name}]`), message);
  }
}

function enforceLog(message) {
  console.log(chalk.white.bold(`[${pkg.name}]`), message);
}

async function writeOutput(chartDefinitionFileName, outputFileName) {
  writeLog(`Transforming ${chartDefinitionFileName}`);

  const chartDefinition = fs.readFileSync(chartDefinitionFileName).toString();
  if (chartDefinition) {
    const renderOutput = await renderer([chartDefinition], {
      screenshot: args.screenshot,
    });

    if (renderOutput?.length) {
      let chart = renderOutput.at(0)?.value?.svg;
      const id = renderOutput.at(0)?.value?.id;
      const screenshot = renderOutput.at(0)?.value?.screenshot;

      if (chart) {
        //nanoids
        chart = chart.replace(
          new RegExp(escapeRegExp(id), "g"),
          `mermaid-${nanoid()}`,
        );

        //ensure the output folder exists
        const outputLocation = path.parse(outputFileName);
        fs.mkdirSync(outputLocation.dir, { recursive: true });

        //write the svg
        writeLog(`Writing ${outputFileName}.svg`);
        fs.writeFileSync(outputFileName + ".svg", chart);

        if (screenshot) {
          //write the png
          writeLog(`Writing ${outputFileName}.png`);
          fs.writeFileSync(outputFileName + ".png", screenshot);
        }

        return;
      }
    }
  }
  enforceLog(chalk.red(`Error transforming ${chartDefinitionFileName}`));
}

async function processCharts() {
  if (args.input) {
    for (const chartDefinitionFileName of args.input) {
      let inputLocation = path.parse(chartDefinitionFileName);
      const outputLocation = args.output || inputLocation.dir;

      //output file name is without extension
      const outputFileName = path.join(outputLocation, inputLocation.name);

      await writeOutput(chartDefinitionFileName, outputFileName);
    }
  }
}

await processCharts();
