# create-ps

**create-ps** is a CLI tool which helps you to create the foundations for an NPM package, saving you time from creating new files and folders.

[![NPM Weekly Downloads](https://img.shields.io/npm/dw/create-ps.svg?style=flat&colorA=black&colorB=blue)](https://npmjs.org/package/create-ps)
[![NPM version](https://img.shields.io/npm/v/create-ps.svg?style=flat&colorA=black)](https://www.npmjs.com/package/create-ps)
[![License](https://shields.io/github/license/inttter/create-ps?labelColor=black&colorB=blue)](https://github.com/inttter/create-ps/blob/master/LICENSE/)
[![Kofi](https://img.shields.io/badge/donate-kofi-f39f37?labelColor=black&colorB=blue)](https://ko-fi.com/intter)
[![Post](https://img.shields.io/badge/blog-post-f39f37?labelColor=black&colorB=blue)](https://iinter.me/blog/creating-packages)


<div align="center">
  <img src="https://github.com/inttter/create-ps/assets/73017070/e4d12625-cf9a-4c63-9c90-472141ca3f54" width="450">
</div>


## Why?

**It saves time.** I don't want to repeatedly create new files that I know I'm going to want to make every time I want to make a new package. Toggling which files I want and don't want makes this faster than manually creating the files and folders.

## Installation

```bash
npm install -g create-ps
```

## Getting Started

> [!TIP]
> To create a .mjs (ESM/EcmaScript) file and use `import` statements, run the command with the **`--esm`** flag.

* Navigate to the directory you are going to create your package in.

* Run `cps <packageName>` in the working directory of the package folder,
replacing `<packageName>` with the name of your package.

* Select which files you'd like to include and exclude.

## Commands

|   Command      |    Description    |     Aliases      | 
|----------|-----------|---------------------------|
`cps pkg-config` | Adds/customises different fields in your `package.json`. A series of prompts will prompt you to fill in different fields of the package.json, such as license ([see here for correct identifiers](https://spdx.org/licenses/)), repository URL, and more. You can also configure existing an existing `package.json`. | N/A | 


## License

Licensed under the MIT License. See `LICENSE`, or click [here](https://github.com/inttter/create-ps/blob/master/LICENSE) for more information.