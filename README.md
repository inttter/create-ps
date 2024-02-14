# create-ps

**create-ps** (kriˈeɪt-ps) creates a foundation for your NPM package.

## Why?

Simple answer? **Saves time.** I don't want to create new files that I know I'll need every time I want to make a new package.

## Installation

```bash
$ npm install -g create-ps

# Node 18 or higher
# You should install globally to run in any new project.
```

## Usage

* Create a folder where you want to store your package. For example,  ```C:/Users/User/Projects/package-name```

* Run ```cps <packageName>```,
replacing ```<packageName>``` with the name of your package.

* This will first run  ```npm init -y``` to create a  ```package.json```
    
    * *(you'll be notified of this again once you finish answering the prompts)*

* You'll be provided a set of prompts to answer ```Yes``` / ```No``` to.

* Based on your responses to them, the files you picked to create will be created.

> [!NOTE]
> This does not install dependencies, you must install them yourself based on your package's needs. ```package-lock.json``` will be automatically be created when you install dependencies.

## Demo

https://github.com/inttter/mdbadges-cli/assets/73017070/346b6932-fd1b-49d5-a182-fdc0c339c622

## CLI Flags

| Flag | Description |
| :---: | :--- |
| `--esm`, `--ecmascript` | Creates an EcmaScript file in `src`, as long as the option for having a `src` folder is selected. |

## License

Licensed under the MIT License. See ```LICENSE```, or click [here](https://github.com/inttter/create-ps) for more information.