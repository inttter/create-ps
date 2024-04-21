#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execa } from 'execa';
import ora from 'ora';
import boxen from 'boxen';
import axios from 'axios';

const baseURL = 'https://api.github.com/licenses';

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
            console.log(chalk.green(`\n✔ Ran ${chalk.magenta('npm init -y')} successfully!\n`));

            // description prompt
            const { description } = await inquirer.prompt({
                type: 'input',
                name: 'description',
                message: chalk.cyan(`Enter a ${chalk.magenta('short description')} of the package:`)
            });

            // update package.json with the provided description
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = await fs.readJson(packageJsonPath);
            packageJson.description = description;
            await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

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
                        { name: '.github/workflows' },
                        { name: '.github/dependabot.yml' },
                        { name: '.gitignore' },
                        { name: 'README.md' },
                        { name: 'CONTRIBUTING.md' },
                        { name: 'CHANGELOG.md' },
                        { name: 'CODE_OF_CONDUCT.md' },
                        { name: 'LICENSE' }
                    ],
                    default: ['src/', 'test/', 'examples/', 'docs/', 'i18n/', 'assets/', '.github/workflows', '.github/dependabot.yml', '.gitignore', 'README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'CODE_OF_CONDUCT.md', 'LICENSE']
                }
            ]);

            await createPkgStructure(packageName, description, options, toggles);

            // start a git repo by default by running 'git init'
            try {
                await execa('git', ['init']);
            } catch (err) {
                console.error(chalk.red(`Error initializing Git repository: ${err}`));
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

                    const test = 'example.test.js';
                    const testFile = path.join(testDir, test);
                    await fs.writeFile(testFile, '// You should install a testing framework if you are including tests within your package. Some popular ones include:\n\n// Jest: https://jestjs.io/docs/getting-started\n// Mocha: https://mochajs.org/#getting-started\n// Jasmine: https://jasmine.github.io/pages/getting_started.html\n// AVA: https://github.com/avajs/ava?tab=readme-ov-file#usage')
                    break;
                case 'examples/':
                    const examplesDir = path.join(process.cwd(), 'examples');
                    await fs.ensureDir(examplesDir);
                    
                    // if --esm is present, file extension will be .mjs, else will be .js
                    const exampleExtension = options.esm ? 'mjs' : 'js';
                    const exampleFileName = `example.${exampleExtension}`;
                    
                    const exampleFile = path.join(examplesDir, exampleFileName);
                    await fs.writeFile(exampleFile, '// Show an example of how your package is used here.');
                    break;
                case 'docs/':
                    const docsDir = path.join(process.cwd(), 'docs');
                    await fs.ensureDir(docsDir);

                    const exampleDoc = 'getting-started.md';
                    const docsFile = path.join(docsDir, exampleDoc);
                    await fs.writeFile(docsFile, '# Getting Started\n\n<!-- Include your relevant documentation here !-->')
                    break;
                case 'i18n/':
                    const i18nDir = path.join(process.cwd(), 'i18n');
                    const localesDir = path.join(i18nDir, 'locales');
                    await fs.ensureDir(localesDir);
                    
                    const defaultLocale = 'en_US';
                    const localeFilePath = path.join(localesDir, `${defaultLocale}.json`);                    
                    await fs.writeJson(localeFilePath);
                    break;
                case 'assets/':
                    const assetsDir = path.join(process.cwd(), 'assets');
                    await fs.ensureDir(assetsDir);
                    break;
                case '.github/workflows':
                    const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
                    await fs.ensureDir(workflowsDir);

                    const workflow = 'workflow.yml';
                    const workflowFile = path.join(workflowsFolder, workflow);
                    await fs.writeFile(workflowFile, '# You can include any type of workflow here,\n# for example, CI/CD, publishing, making issues stale, and more.\n\n# See the GitHub Workflow docs here: https://docs.github.com/en/actions/using-workflows.')
                    break;
                case '.github/dependabot.yml':
                    const dependabotFolder = path.join(process.cwd(), '.github');
                    await fs.ensureDir(dependabotFolder);
                    
                    const dependabot = 'dependabot.yml';
                    const dependabotFile = path.join(dependabotFolder, dependabot);
                    // the \n's below are to properly format the file indentations correctly
                    await fs.writeFile(dependabotFile, 'version: 2\nupdates:\n  - package-ecosystem: "npm"\n    directory: "/"\n    schedule:\n     interval: "daily"', 'utf-8');
                    break;
                case '.gitignore':
                    const gitignoreContent = `node_modules/`;
                    const gitignoreFile = path.join(process.cwd(), '.gitignore');
                    await fs.writeFile(gitignoreFile, gitignoreContent, 'utf8');
                    break;
                case 'README.md':
                    let importStatement = `const ${packageName} = require('${packageName}');`;
                    if (options.esm) {
                        importStatement = `import { ${packageName} } from '${packageName}';`;
                    }
                    const readmeContent = `# ${packageName}\n\n${description}\n\n# Installation\n\n\`\`\`bash\nnpm install ${packageName}\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\n${importStatement}\n\n// (code goes here)\n// If needed, you can also tweak your import statement, depending on your needs.\n\`\`\``;
                    const readmeFile = path.join(process.cwd(), 'README.md');
                    await fs.writeFile(readmeFile, readmeContent, 'utf8');
                    break;
                case 'CONTRIBUTING.md':
                    const contributingContent = `# Contributing\n\nThank you for considering contributing to this project! Before you do, please read these guidelines.\n\n<!-- List your package-specific guidelines here !-->`
                    const contributingFile = path.join(process.cwd(), 'CONTRIBUTING.md');
                    await fs.writeFile(contributingFile, contributingContent, 'utf8');
                    break;
                case 'CHANGELOG.md':
                    const changelogContent = `# Changelog\n\n# v1.0.0`;
                    const changelogFile = path.join(process.cwd(),  'CHANGELOG.md');
                    await fs.writeFile(changelogFile, changelogContent , 'utf8');
                    break;
                case 'CODE_OF_CONDUCT.md':
                    // fetch the Covenant Code of Conduct from the official source
                    // Note: coc = Code of Conduct
                    const cocURL = 'https://www.contributor-covenant.org/version/2/0/code_of_conduct/code_of_conduct.md';
                    const cocResponse = await axios.get(cocURL);
                    const cocContent = cocResponse.data;
                    
                    const cocFile = path.join(process.cwd(), 'CODE_OF_CONDUCT.md');
                    await fs.writeFile(cocFile, cocContent, 'utf8');
                    break;
                case 'LICENSE':
                    // fetch licenses from the github api
                    const licensesResponse = await axios.get(`${baseURL}`);
                    const licenses = licensesResponse.data.map(license => license.key);
                    
                    // prompt the user to pick a license
                    const { selectedLicense } = await inquirer.prompt({
                        type: 'list',
                        name: 'selectedLicense',
                        message: chalk.cyan(`\nSelect a license:`),
                        choices: licenses
                    });
                    
                    const selectedLicenseResponse = await axios.get(`${baseURL}/${selectedLicense}`);
                    const selectedLicenseText = selectedLicenseResponse.data.body;
                    
                    // write the selected license text to the LICENSE file
                    const selectedLicenseFilePath = path.join(process.cwd(), 'LICENSE');
                    await fs.writeFile(selectedLicenseFilePath, selectedLicenseText, 'utf8');
                    break;
                default:
                    break;
                }
            }

        spinner.succeed(chalk.green(`Success! The package structure for '${packageName}' has been created.`));
    } catch (err) {
        spinner.fail(chalk.red(`Error creating package structure: ${err}`));
    }
}

program
    .command('pkg-config')
    .description('adds/customises different fields in your package.json')
    .action(async () => {
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = await fs.readJson(packageJsonPath);

            const toggles = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'toggles',
                    message: chalk.cyan('Select what you\'d like to include:'),
                    choices: [
                        { name: 'Author', checked: !!packageJson.author },
                        { name: 'Repository', checked: !!packageJson.repository },
                        { name: 'Keywords', checked: !!packageJson.keywords },
                        { name: 'Homepage', checked: !!packageJson.homepage },
                        { name: 'Funding', checked: !!packageJson.funding },
                        { name: 'License', checked: !!packageJson.license },
                    ]
                }
            ]);

            const prompts = [];

            if (toggles.toggles.includes('Author')) {
                prompts.push({
                    type: 'input',
                    name: 'author',
                    message: chalk.cyan(`Enter the ${chalk.magenta('author')} of this package:`),
                    default: packageJson.author || ''
                });
            }

            if (toggles.toggles.includes('Repository')) {
                prompts.push({
                    type: 'input',
                    name: 'repository',
                    message: chalk.cyan(`Enter a ${chalk.magenta('repository URL')}:`),
                    default: packageJson.repository || ''
                });
            }

            if (toggles.toggles.includes('Keywords')) {
                prompts.push({
                    type: 'input',
                    name: 'keywords',
                    message: chalk.cyan(`Enter some ${chalk.magenta('keywords')} (comma-separated):`),
                    filter: input => input.split(',').map(keyword => keyword.trim()),
                    default: packageJson.keywords ? packageJson.keywords.join(', ') : ''
                });
            }

            if (toggles.toggles.includes('Homepage')) {
                prompts.push({
                    type: 'input',
                    name: 'homepage',
                    message: chalk.cyan(`Enter a ${chalk.magenta('homepage URL')}:`),
                    default: packageJson.homepage || ''
                });
            }

            if (toggles.toggles.includes('Funding')) {
                prompts.push({
                    type: 'input',
                    name: 'funding',
                    message: chalk.cyan(`Enter a ${chalk.magenta('funding URL')}:`),
                    default: packageJson.funding || ''
                });
            }

            if (toggles.toggles.includes('License')) {
                prompts.push({
                    type: 'input',
                    name: 'license',
                    message: chalk.cyan(`Enter the ${chalk.magenta('license')} you wish to use:`),
                    default: packageJson.license || ''
                });
            }

            const responses = await inquirer.prompt(prompts);

            const updatedPackageJson = { ...packageJson, ...responses };
            await fs.writeJson(packageJsonPath, updatedPackageJson, { spaces: 2 });

            console.log(chalk.green(`\nSuccess! Your package.json has been updated successfully.\n`));

        } catch (err) {
            console.error(chalk.red(`Error updating package.json: ${err}`));
        }
    });

program.parse(process.argv);