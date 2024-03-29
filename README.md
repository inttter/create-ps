# create-ps

**create-ps** creates a foundation for your NPM package, saving you time from creating new files and folders.

[![NPM Weekly Downloads](https://img.shields.io/npm/dw/create-ps.svg?style=flat&colorA=black&colorB=blue)](https://npmjs.org/package/create-ps "Weekly downloads from NPM.")
[![NPM version](https://img.shields.io/npm/v/create-ps.svg?style=flat&colorA=black)](https://www.npmjs.com/package/create-ps "The latest NPM version.")
[![License](https://shields.io/github/license/inttter/create-ps?labelColor=black&colorB=blue)](https://github.com/inttter/create-ps/blob/master/LICENSE/ "create-ps's license.")
[![License](https://img.shields.io/badge/donate-kofi-f39f37?labelColor=black&colorB=blue)](https://ko-fi.com/intter "My Ko-fi donation page.")


<div align="center">
<img src="https://github.com/inttter/create-ps/assets/73017070/c13136f3-86b3-4841-aba7-dcfd22491c6c" width="450">
</div>


## Why?

**Simply put, saves time.** I don't want to repeatedly create new files that I know I'm gonna want to make every time I want to make a new package. Answering some prompts does the trick enough for me to make my project structure faster than manually creating the files and folders.

## Installation

```bash
$ npm install -g create-ps

# Node 18 or higher
# You should install globally to run from any location.
```

## Usage

> [!TIP]
> To create a .mjs (ESM/EcmaScript) file, run the command with the **```--esm```** flag.

* Create a folder where you want to store your package. For example,  ```C:/Users/User/Projects/package-name```. [^1]

* Run ```cps <packageName>```,
replacing ```<packageName>``` with the name of your package.

* This will first run  ```npm init -y``` to create a  ```package.json```. [^2]

* You'll be provided a list to toggle what you'd like to include in your project structure. [^3]

* Based on your responses to them, the files you picked to create will be created. [^4]

## Commands

|   Command      |    Description    |     Aliases      | 
|----------|-----------|---------------------------|
```cps pkg-config``` | Adds/customises different fields in your ```package.json```. A series of prompts will prompt you to fill in different fields of the package.json, such as license [(see here for correct identifiers)](https://spdx.org/licenses/), repository URL, and more. You can also configure existing ```package.json```. | N/A | 


## License

Licensed under the MIT License. See ```LICENSE```, or click [here](https://github.com/inttter/create-ps/blob/master/LICENSE) for more information.


[^1]: You can run it in any location.

[^2]: You'll be notified of this again once you finish answering the prompts.

[^3]: ```(*)``` means Yes,  ```( )``` means No. By default, all options are selected, and keybinds are given in the prompt.

[^4]: **create-ps** does not install dependencies, you must install them yourself based on your package's needs. ```package-lock.json``` will be automatically created when you install any dependencies, and thus, is why it's not created by create-ps.