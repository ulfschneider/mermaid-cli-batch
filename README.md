# mermaid-cli-batch

Process multiple mermaid chart definition files in one pass with the console.

## Install

mermaid-cli-batch has a peer dependencies to playwright that you have to install by yourself prior of using the package:

`npm i playwright`
`npx playwright install --with-deps chromium`

This allows you to update playwright *independent* of mermaid-cli-batch!

## Use

To get a list of the possible options, do `npx mermaid-cli-batch --help`

A sample use is `npx mermaid-cli-batch --input *.mmd`
