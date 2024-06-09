# create-ps

**create-ps** is a CLI tool which helps you to create the foundations for an NPM package, saving you time from creating new files and folders.

[![NPM Weekly Downloads](https://img.shields.io/npm/dw/create-ps.svg?style=flat&colorA=black&colorB=blue)](https://npmjs.org/package/create-ps)
[![NPM version](https://img.shields.io/npm/v/create-ps.svg?style=flat&colorA=black)](https://www.npmjs.com/package/create-ps)
[![License](https://shields.io/github/license/inttter/create-ps?labelColor=black&colorB=blue)](https://github.com/inttter/create-ps/blob/master/LICENSE/)
[![Kofi](https://img.shields.io/badge/donate-kofi-f39f37?labelColor=black&colorB=blue)](https://ko-fi.com/intter)
[![Post](https://img.shields.io/badge/read-post-f39f37?labelColor=black&colorB=blue)](https://iinter.me/writing/creating-packages)


<div align="center">
  <img src="https://github.com/inttter/create-ps/assets/73017070/37438a9f-201a-4c56-a103-b5f40dd79043" width="350">
</div>

<br>

> You can view a video demo of running create-ps [here](http://files.iinter.me/r/create-ps_Demo.mp4).


## Why?

**It saves time.** I don't want to repeatedly create new files that I know I might possibly want to make every time I want to make a new package. Toggling which files I want and don't want makes this faster than manually creating the files and folders.

## Installation

```bash
npm install -g create-ps
```

## Usage

**create-ps** handles the creation of files and folders and their contents behind the scenes using switch cases. By default, packages are setup to use ESM.

> [!NOTE]
> If you want to use **CommonJS**, use the `--cjs` option instead.

* Navigate to the directory you are going to create your package in.
* Run `cps [packageName]` in the working directory. Make sure to replace `[packageName]` with the name of your package.
* Select which files you'd like to include and exclude, and follow any extra prompts given in the terminal.

## Commands

|   Command      |    Description    |     Aliases      | 
|----------|-----------|---------------------------|
`cps pkg-config` | Adds/customises different fields in your `package.json`. For the license field, see [here](https://spdx.org/licenses/) for correct identifiers. You can also configure existing an existing `package.json`. | N/A | 


## License

©️ **2024** · Licensed under the MIT License. See [here](https://github.com/inttter/create-ps/blob/main/LICENSE) for more information.