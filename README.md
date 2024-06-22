# create-ps

**create-ps** is a CLI tool which helps you to create the foundations for an `npm` package, saving you time from creating new files and folders.

[![NPM Weekly Downloads](https://img.shields.io/npm/dw/create-ps.svg?style=flat&colorA=black&colorB=blue)](https://npmjs.org/package/create-ps)
[![NPM version](https://img.shields.io/npm/v/create-ps.svg?style=flat&colorA=black)](https://www.npmjs.com/package/create-ps)
[![License](https://shields.io/github/license/inttter/create-ps?labelColor=black&colorB=blue)](https://github.com/inttter/create-ps/blob/master/LICENSE/)
[![Kofi](https://img.shields.io/badge/donate-kofi-f39f37?labelColor=black&colorB=blue)](https://ko-fi.com/intter)
[![Post](https://img.shields.io/badge/read-post-f39f37?labelColor=black&colorB=blue)](https://iinter.me/writing/creating-packages)


<div align="center">
  <img src="https://github.com/inttter/create-ps/assets/73017070/37438a9f-201a-4c56-a103-b5f40dd79043" width="350">
</div>

<br>

> You can view a demo of create-ps [here](https://files.iinter.me/r/create-ps_Demo_v4.mp4).

## Installation

```bash
npm install -g create-ps
```

## Usage

Navigate to your working directory and run the following command:

```bash
cps [packageName]
```
> [!NOTE] 
> By default, packages are set up to use EcmaScript (ESM). To use CommonJS (CJS), run the command with the `--cjs` option instead.

Make sure to replace `[packageName]` with the name of your package. Once the command is ran, select which files/directories you would like to include and fill out any prompts.

## Configuring your package.json

You can also configure any new or pre-existing `package.json` with various information about the package by running the following command:

```bash
cps pkg-config
```

View more descriptive information and an exampls of this command [here](https://iinter.me/writing/creating-packages#pkg-config).


## License

©️ **2024** · Licensed under the [MIT License](LICENSE).