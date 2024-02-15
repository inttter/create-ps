# create-ps

**create-ps** (kriˈeɪt-ps) creates a foundation for your NPM package.

[![NPM Weekly Downloads](https://img.shields.io/npm/dw/create-ps.svg?style=flat&colorA=black&colorB=blue)](https://npmjs.org/package/create-ps "Weekly downloads from NPM.")
[![NPM version](https://img.shields.io/npm/v/create-ps.svg?style=flat&colorA=black)](https://www.npmjs.com/package/create-ps "The latest NPM version.")
[![License](https://shields.io/github/license/inttter/create-ps?labelColor=black&colorB=blue)](https://github.com/inttter/create-ps/blob/master/LICENSE/ "create-ps's license.")
[![License](https://img.shields.io/badge/donate-kofi-f39f37?labelColor=black&colorB=blue)](https://ko-fi.com/intter "My Ko-fi donation page.")


<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/inttter/create-ps/assets/73017070/a1a0362e-9124-49bc-ac73-922e1e607595" width="500">
  <img alt="Prompts (Dark Mode)" src="https://github.com/inttter/create-ps/assets/73017070/8941348a-eb01-46e7-ac69-62c3fdc65e6c" width="500">
</picture>
</div>


## Why?

Simple answer? **Saves time.** I don't want to create new files that I know I'll need every time I want to make a new package.

## Installation

```bash
$ npm install -g create-ps

# Node 18 or higher
# You should install globally to run in any new project.
```

## Usage

> [!TIP]
> To create a .mjs (ESM/EcmaScript) file, run the command with the **```--esm```** flag.

* Create a folder where you want to store your package. For example,  ```C:/Users/User/Projects/package-name```. [^1]

* Run ```cps <packageName>```,
replacing ```<packageName>``` with the name of your package.

* This will first run  ```npm init -y``` to create a  ```package.json```. [^2]

* You'll be provided a set of prompts to answer ```Yes``` / ```No``` to. [^3]

* Based on your responses to them, the files you picked to create will be created. [^4]

## Demo

https://github.com/inttter/create-ps/assets/73017070/3c764394-f186-4ced-9f9a-3d1dc1b1aec6


## License

Licensed under the MIT License. See ```LICENSE```, or click [here](https://github.com/inttter/create-ps/blob/master/LICENSE) for more information.


[^1]: You can run it in any location.

[^2]: You'll be notified of this again once you finish answering the prompts.

[^3]: By default, the value is set to ```Yes```, so if you do not enter anything, ```Yes``` will be assumed as the answer.

[^4]: **create-ps** does not install dependencies, you must install them yourself based on your package's needs. ```package-lock.json``` will be automatically created when you install any dependencies, and thus, is why it's not created by create-ps.