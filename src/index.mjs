#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execa } from 'execa';
import ora from 'ora';
import boxen from 'boxen';

const asciiArt = chalk.yellow(`
                      _                        
                     | |                       
   ___ _ __ ___  __ _| |_ ___ ______ _ __  ___ 
  / __| '__/ _ \\/ _\` | __/ _ \\______| '_ \\/ __|
 | (__| | |  __/ (_| | ||  __/      | |_) \\__ \\
  \\___|_|  \\___|\\__,_|\\__\\___|      | .__/|___/
                                    | |        
                                    |_|        
`);

program
    .version('2.0.0')
    .description('Creates a foundation for your NPM package.')
    .arguments('<packageName>')
    .option('--esm', 'creates an EcmaScript file in the src directory')
    .action(async (packageName, options) => {
        console.log(asciiArt);
        try {
            // runs npm init -y
            await execa('npm', ['init', '-y']);

            // description prompt
            const { description } = await inquirer.prompt({
                type: 'input',
                name: 'description',
                message: chalk.cyan(`Enter a ${chalk.magenta('short description')} of the package:`)
            });

            // toggle options for files/directories
            const { toggles } = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'toggles',
                    message: chalk.cyan('Select what you\'d like to include:'),
                    choices: [
                        { name: 'src/' },
                        { name: 'test/' },
                        { name: 'examples/' },
                        { name: 'docs/' },
                        { name: 'assets/' },
                        { name: 'i18n/' },
                        { name: 'git init' },
                        { name: '.github/workflows' },
                        { name: '.github/dependabot.yml' },
                        { name: '.gitignore' },
                        { name: 'README.md' },
                        { name: 'CONTRIBUTING.md' },
                        { name: 'CHANGELOG.md' },
                        { name: 'LICENSE' }
                    ],
                    default: ['src/', 'test/', 'examples/', 'docs/', 'i18n/', 'assets/', 'git init', '.github/workflows', '.github/dependabot.yml', '.gitignore', 'README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'LICENSE']
                }
            ]);

            await createPkgStructure(packageName, description, options, toggles);

            // start a git repo (git init)
            if (toggles.includes('git init')) {
                try {
                    await execa('git', ['init']);
                } catch (err) {
                    console.error(chalk.red(`Error initializing Git repository: ${err}`));
                }
            }
        } catch (err) {
            console.error(`Error initializing package: ${err}`);
        }
    });

async function createPkgStructure(packageName, description, options, toggles) {
    const spinner = ora('Creating package structure...').start();

    try {
        // Loop through each toggle answer and create files/directories accordingly
        for (const toggle of toggles) {
            switch (toggle) {
                case 'src/':
                    const srcDir = path.join(process.cwd(), 'src');
                    await fs.ensureDir(srcDir);

                    // if --esm is specified, changes the file name to index.mjs, else, keep as index.js
                    let indexFileName = 'index.js';
                    if (process.argv.includes('--esm') || process.argv.includes('--ecmascript')) {
                        indexFileName = 'index.mjs';
                    }

                    const indexFile = path.join(srcDir, indexFileName);
                    await fs.writeFile(indexFile, '', 'utf8');

                    // updates the main field in package.json
                    const packageJsonPath = path.join(process.cwd(), 'package.json');
                    const packageJson = await fs.readJson(packageJsonPath);

                    // this determines the correct main file based on if --esm is specified
                    // if the file/folder name or location gets changed, the user will have to
                    // manually update it in the package.json themselves
                    const mainFile = process.argv.includes('--esm') || process.argv.includes('--ecmascript') ? './src/index.mjs' : './src/index.js';

                    packageJson.main = mainFile;

                    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 }); // writes to package.json
                    break;
                case 'test/':
                    const testDir = path.join(process.cwd(), 'test');
                    await fs.ensureDir(testDir);
                    break;
                case 'examples/':
                    const examplesDir = path.join(process.cwd(), 'examples');
                    await fs.ensureDir(examplesDir);
                    break;
                case 'docs/':
                    const docsDir = path.join(process.cwd(), 'docs');
                    await fs.ensureDir(docsDir);
                    break;
                case 'i18n/':
                    const translationDir = path.join(process.cwd(), 'i18n');
                    await fs.ensureDir(translationDir);
                    break;
                case 'assets/':
                    const assetsDir = path.join(process.cwd(), 'assets');
                    await fs.ensureDir(assetsDir);
                    break;
                case '.github/workflows':
                    const workflowsFolder = path.join(process.cwd(), '.github', 'workflows');
                    await fs.ensureDir(workflowsFolder);
                    break;
                case '.github/dependabot.yml':
                    const dependabotFolder = path.join(process.cwd(), '.github');
                    await fs.ensureDir(dependabotFolder);
                    
                    const dependabot = 'dependabot.yml';
                    const dependabotFile = path.join(dependabotFolder, dependabot);
                    // the \n's below are to properly format the file indentations correctly
                    // fun fact: took me a lot of trial and error to do this one
                    await fs.writeFile(dependabotFile, 'version: 2\nupdates:\n  - package-ecosystem: "npm"\n    directory: "/"\n    schedule:\n     interval: "daily"', 'utf-8');
                    break;
                case '.gitignore':
                    const gitignoreContent = `node_modules/`;
                    const gitignoreFile = path.join(process.cwd(), '.gitignore');
                    await fs.writeFile(gitignoreFile, gitignoreContent, 'utf8');
                    break;
                case 'README.md':
                    const readmeContent = `# ${packageName}\n\n${description}\n\n# Installation\n\n\`\`\`bash\nnpm install ${packageName}\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\nconst ${packageName} = require('${packageName}')\n\n// (code goes here)\n\`\`\``;
                    const readmeFile = path.join(process.cwd(), 'README.md');
                    await fs.writeFile(readmeFile, readmeContent, 'utf8');
                    break;
                case 'CONTRIBUTING.md':
                    const contributingFile = path.join(process.cwd(), 'CONTRIBUTING.md');
                    await fs.writeFile(contributingFile, '', 'utf8');
                    break;
                case 'CHANGELOG.md':
                    const changelogContent = `# Changelog\n\n# v1.0.0`;
                    const changelogFile = path.join(process.cwd(),  'CHANGELOG.md');
                    await fs.writeFile(changelogFile, changelogContent , 'utf8');
                    break;
                case 'LICENSE':
                    const licenseFilePath = path.join(process.cwd(), 'LICENSE');
                    await fs.writeFile(licenseFilePath, '', 'utf8');
                    break;
                default:
                    break;
            }
        }

        spinner.succeed(chalk.green(`Success! The package structure for '${packageName}' has been created.`));
        console.log(chalk.blue(`NOTE: ${chalk.magenta('npm init -y')} was ran to create your ${chalk.magenta('package.json')} file.`))
    } catch (err) {
        spinner.fail(chalk.red(`Error creating package structure: ${err}`));
    }
}


// pkg-config Command
//
// This command is similar to the main one, in which a series of prompts appear asking the user to
// fill in different fields in the package.json. After this, it'll update the fields accordingly.
// Based on my testing, it can also update already existing package.json's.
program
    .command('pkg-config')
    .description('adds/customises different fields in your package.json')
    .action(async () => {
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = await fs.readJson(packageJsonPath);

            let bugsURL, bugsType;

            const { author, repository, keywords, homepage, funding, license, bugsTypeInput } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'author',
                    message: chalk.cyan(`Enter the ${chalk.magenta('author')} of this package:`)
                },
                {
                    type: 'input',
                    name: 'repository',
                    message: chalk.cyan(`Enter a ${chalk.magenta('repository URL')}:`)
                },
                {
                    type: 'input',
                    name: 'keywords',
                    message: chalk.cyan(`Enter some ${chalk.magenta('keywords')} (comma-separated):`),
                    filter: input => input.split(',').map(keyword => keyword.trim())
                },
                {
                    type: 'input',
                    name: 'homepage',
                    message: chalk.cyan(`Enter a ${chalk.magenta('homepage URL')}:`)
                },
                {
                    type: 'input',
                    name: 'funding',
                    message: chalk.cyan(`Enter a ${chalk.magenta('funding URL')}:`)
                },
                {
                    type: 'input',
                    name: 'license',
                    message: chalk.cyan(`Enter the ${chalk.magenta('license')} you wish to use:`)
                },
                {
                    type: 'list',
                    name: 'bugsTypeInput',
                    message: chalk.cyan(`Choose the type of way you'd like to specify the ${chalk.magenta('bugs')} field:`),
                    choices: ['URL', 'Email']
                }
            ]);

            // im setting the bugs type for later use
            bugsType = bugsTypeInput;

            if (bugsType === 'URL') {
                const { bugsURLInput } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'bugsURLInput',
                        message: chalk.cyan(`Enter the ${chalk.magenta('URL')} to report bugs to:`)
                    }
                ]);
                bugsURL = bugsURLInput;
            } else if (bugsType === 'Email') {
                const { bugsEmailInput } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'bugsEmailInput',
                        message: chalk.cyan(`Enter the ${chalk.magenta('email')} to report bugs to:`)
                    }
                ]);
                bugsURL = bugsEmailInput;
            }

            // confirmation message box
            let confirmationMessage = boxen(chalk.bold('The following will be added to your package.json:\n\n') +
                `Author: ${author}\n` +
                `Repository URL: ${repository}\n` +
                `Keywords: ${keywords.join(', ')}\n` +
                `Homepage: ${homepage}\n` +
                `Funding: ${funding}\n` +
                `License: ${license}\n` +
                `Bugs Type: ${bugsType}\n` +
                `Bugs URL/Email: ${bugsURL}\n`, 
            { borderStyle: 'round', padding: 1, margin: 1, borderColor: 'cyan', title: 'Just A Heads Up!', titleAlignment: 'center'});

            console.log(confirmationMessage);

            // prompt that asks the user to confirm
            const { confirm } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'confirm',
                    message: 'Would you like to proceed?',
                    choices: ['Yes', 'No']
                }
            ]);

            if (confirm === 'Yes') {
                // updates package.json if confirmed
                if (author) packageJson.author = author;
                if (repository) packageJson.repository = repository;
                if (keywords) packageJson.keywords = keywords;
                if (homepage) packageJson.homepage = homepage;
                if (funding) packageJson.funding = funding;
                if (license) packageJson.license = license;

                if (bugsType === 'URL') {
                    if (bugsURL) packageJson.bugs = { url: bugsURL };
                } else if (bugsType === 'Email') {
                    if (bugsURL) packageJson.bugs = { email: bugsURL };
                }

                await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
                console.log();
                console.log(chalk.green(`Success! Your package.json has been updated successfully.`));
                console.log();
            } else {
                // if "No"
                console.log(chalk.yellow('Operation cancelled.'));
            }

        } catch (err) {
            console.error(chalk.red(`Error updating package.json: ${err}`));
        }
    });

program.parse(process.argv);