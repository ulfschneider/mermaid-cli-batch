# mermaid-cli-batch

A command line tool to process multiple [Mermaid](https://mermaid.js.org) chart definition files in one pass into SVG images.

## Install

mermaid-cli-batch has a peer dependency to Playwright that you have to install by yourself prior of using the package:

```sh
npm i playwright
npx playwright install chromium
```

This allows you to update playwright *independent* of mermaid-cli-batch!

## Use

For instance, to convert all `.mmd` files to SVG images, you run the command:

```sh
npx mermaid-cli-batch --input *.mmd
```

To get a list of the possible options, do

```sh
npx mermaid-cli-batch -h
```
