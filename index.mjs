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
      "The file or the files to process. Must be text files that contain each a mermaid diagram definition. A glob description of the file locations is possible.",
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
    name: "configFile",
    alias: "c",
    type: String,
    description: "The mermaid config file (optional)",
  },
  {
    name: "cssFile",
    alias: "C",
    type: String,
    description: "The mermaid theme CSS file (optional)",
  },
  {
    name: "verbose",
    type: Boolean,
    description: "Verbose logging (otional)",
  },
  { name: "version", alias: "V", type: Boolean, description: "Print the help" },
];

const args = commandLineArgs(argDefinitions);
const renderer = createMermaidRenderer();

if (args.help) {
  const usage = commandLineUsage([
    {
      header: `${pkg.name} version ${pkg.version}`,
      content: `Command line processing of batches of mermaid diagram definitions into SVG images (PNG optional)`,
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

function getCSS() {
  if (args.cssFile) {
    const css = fs.readFileSync(args.cssFile);
    if (css) {
      return css.toString();
    }
  }
}

function getMermaidConfig() {
  if (args.configFile) {
    const config = fs.readFileSync(args.configFile);
    if (config) {
      return config.toString();
    }
  }
}

function writeLog(message) {
  if (args.verbose) {
    console.log(message);
  }
}

function enforceLog(message) {
  console.log(message);
}

async function writeSvgFile(inputFileName, outputFileName) {
  writeLog(`Writing mermaid diagram ${inputFileName} to ${outputFileName}`);

  const chartDefinition = fs.readFileSync(inputFileName).toString();
  if (chartDefinition) {
    const renderOutput = await renderer([chartDefinition], {
      screenshot: args.screenshot,
      mermaidOptions: getMermaidConfig(),
      css: getCSS(),
    });

    if (renderOutput?.length) {
      let chart = renderOutput.at(0)?.value?.svg;
      const id = renderOutput.at(0)?.value?.id;
      const screenshot = renderOutput.at(0)?.value?.screenshot;

      if (chart) {
        chart = chart.replace(
          new RegExp(escapeRegExp(id), "g"),
          `mermaid-${nanoid()}`,
        );

        //ensure the output folder exists
        fs.mkdirSync(path.parse(outputFileName).dir, { recursive: true });
        //write the chart svg
        fs.writeFileSync(outputFileName, chart);

        if (screenshot) {
          //write the chart screenshot png
          const location = path.parse(outputFileName);
          const screenshotFileName =
            path.join(location.dir, location.name) + ".png";
          writeLog(
            `Writing mermaid diagram ${inputFileName} to ${screenshotFileName}`,
          );

          fs.writeFileSync(screenshotFileName, screenshot);
        }

        return;
      }
    }
  }
  enforceLog(chalk.red(`Error transforming mermaid diagram ${inputFileName}`));
}

async function processCharts() {
  if (args.input) {
    for (const inputFileName of args.input) {
      let input = path.parse(inputFileName);
      const output = args.output || input.dir;
      const outputFileName = path.join(output, input.name) + ".svg";

      await writeSvgFile(inputFileName, outputFileName);
    }
  }
}

await processCharts();

/**
 * Options:
   -V, --version                                   output the version number
   -t, --theme [theme]                             Theme of the chart (choices: "default", "forest", "dark", "neutral", default: "default")
   -w, --width [width]                             Width of the page (default: 800)
   -H, --height [height]                           Height of the page (default: 600)
   -i, --input <input>                             Input mermaid file. Files ending in .md will be treated as Markdown and all charts (e.g. ```mermaid (...)``` or :::mermaid (...):::) will be extracted and
                                                   generated. Use `-` to read from stdin.
   -o, --output [output]                           Output file. It should be either md, svg, png, pdf or use `-` to output to stdout. Optional. Default: input + ".svg"
   -a, --artefacts [artefacts]                     Output artefacts path. Only used with Markdown input file. Optional. Default: output directory
   -e, --outputFormat [format]                     Output format for the generated image. (choices: "svg", "png", "pdf", default: Loaded from the output file extension)
   -b, --backgroundColor [backgroundColor]         Background color for pngs/svgs (not pdfs). Example: transparent, red, '#F0F0F0'. (default: "white")
   -c, --configFile [configFile]                   JSON configuration file for mermaid.
   -C, --cssFile [cssFile]                         CSS file for the page.
   -I, --svgId [svgId]                             The id attribute for the SVG element to be rendered.
   -s, --scale [scale]                             Puppeteer scale factor (default: 1)
   -f, --pdfFit                                    Scale PDF to fit chart
   -q, --quiet                                     Suppress log output
   -p --puppeteerConfigFile [puppeteerConfigFile]  JSON configuration file for puppeteer.
   --iconPacks <icons...>                          Icon packs to use, e.g. @iconify-json/logos. These should be Iconify NPM packages that expose a icons.json file, see
                                                   https://iconify.design/docs/icons/json.html. These will be downloaded from https://unkpg.com when needed. (default: [])
   -h, --help                                      display help for command
 */
