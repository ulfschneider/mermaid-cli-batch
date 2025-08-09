# mermaid-cli-batch

A command line tool to process multiple [Mermaid](https://mermaid.js.org) chart definition files in one pass into SVG diagrams.

## Install

mermaid-cli-batch has a peer dependency to playwright that you have to install by yourself prior of using the package:

```sh
npm i playwright
npx playwright install chromium
```

This allows you to update playwright *independent* of mermaid-cli-batch!

## Use

To get a list of the possible options, do

```sh
npx mermaid-cli-batch --help
```

A sample use is

```sh
npx mermaid-cli-batch --input *.mmd
```
