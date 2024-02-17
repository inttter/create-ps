#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execa } from 'execa';
import ora from 'ora';
import boxen from 'boxen';

program
    .version('1.1.0')
    .description('Creates a foundation for your NPM package.')
    .arguments('<packageName>')
    .option('--esm', 'creates an EcmaScript file in the src directory')
    .action(async (packageName, options) => {
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
            const { includeSrc, includeTest, includeExamples, includeDocs, includeI18n, startGitRepo, includeWorkflows, includeDependabot, includeGitIgnore, includeReadme, includeContributing, includeChangelog, includeAssets, includeLicense } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'includeSrc', // src prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('src')} folder?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeTest', // test prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('test')} folder?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeExamples', // example prompt
                    message: chalk.cyan(`Would you like to include an ${chalk.magenta('examples')} folder?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeDocs', // docs prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('documentation')} folder?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeI18n', // i18n/translation prompt
                    message: chalk.cyan(`Would you like to include an ${chalk.magenta('i18n/translation')} folder?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'startGitRepo', // git init prompt
                    message: chalk.cyan(`Would you like to initialise a local ${chalk.magenta('Git')} repository?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeWorkflows', // github workflows prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('GitHub Workflows')} folder?`)
                },
                {
                    type: 'confirm',
                    name: 'includeDependabot', // dependabot prompt
                    message: chalk.cyan(`Would you like to include ${chalk.magenta('Dependabot')}?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeGitIgnore', // .gitignore prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('.gitignore')} file? `),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeReadme', // readme prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('README')} file?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeContributing', // contributing prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('contributing guidelines')} file?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeChangelog', // changelog prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('changelog')} file?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeAssets', // assets prompt
                    message: chalk.cyan(`Would you like to include an ${chalk.magenta('assets')} folder?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeLicense', // license prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('LICENSE')} file?`),
                    default: true
                }
            ]);

            await createPkgStructure(packageName, description, options, includeSrc, includeTest, includeExamples, includeDocs, includeI18n, startGitRepo, includeWorkflows, includeDependabot, includeGitIgnore, includeReadme, includeContributing, includeChangelog, includeAssets, includeLicense);

            // start a git repo (git init)
            if (startGitRepo) {
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

    async function createPkgStructure(packageName, description, options, includeSrc, includeTest, includeExamples, includeDocs, includeI18n, startGitRepo, includeWorkflows, includeDependabot, includeAssets, includeGitIgnore, includeReadme, includeContributing, includeChangelog, includeLicense) {
        const spinner = ora('Creating package structure...').start();
    
        try {
            // src
            if (includeSrc) {
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
            }
    
            // test
            if (includeTest) {
                const testDir = path.join(process.cwd(), 'test');
                await fs.ensureDir(testDir);
            }

            // examples (ie. examples/example.js shows off an example of the package)
            if (includeExamples) {
                const examplesDir = path.join(process.cwd(), 'examples');
                await fs.ensureDir(examplesDir);
            }

            // docs
            if (includeDocs) {
                const docsDir = path.join(process.cwd(), 'docs');
                await fs.ensureDir(docsDir);
            }

            // i18n/translation
            if (includeI18n) {
                const translationDir = path.join(process.cwd(), 'i18n');
                await fs.ensureDir(translationDir);
            }
    
            // workflows folder
            if (includeWorkflows) {
                const workflowsFolder = path.join(process.cwd(), '.github', 'workflows');
                await fs.ensureDir(workflowsFolder);
            }

            // dependabot
            if (includeDependabot) {
                const workflowsFolder = path.join(process.cwd(), '.github');
                await fs.ensureDir(workflowsFolder);
                
                 const dependabot = 'dependabot.yml';
                 const dependabotFile = path.join(workflowsFolder, dependabot);
                // the \n's below are to properly format the file indentations correctly
                // fun fact: took me a lot of trial and error to do this one
                await fs.writeFile(dependabotFile, 'version: 2\nupdates:\n  - package-ecosystem: "npm"\n    directory: "/"\n    schedule:\n     interval: "daily"', 'utf-8');
            }
    
            // .gitignore
            if (includeGitIgnore) {
                const gitignoreContent = `node_modules/`;
                const gitignoreFile = path.join(process.cwd(), '.gitignore');
                await fs.writeFile(gitignoreFile, gitignoreContent, 'utf8');
            }
    
            // template README.md
            if (includeReadme) {
                const readmeContent = `# ${packageName}\n\n${description}\n\n# Installation\n\n\`\`\`bash\nnpm install ${packageName}\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\nconst ${packageName} = require('${packageName}')\n\n// (code goes here)\n\`\`\``;
                const readmeFile = path.join(process.cwd(), 'README.md');
                await fs.writeFile(readmeFile, readmeContent, 'utf8');
            }
    
            // CONTRIBUTING.md
            if (includeContributing) {
                const contributingFile = path.join(process.cwd(), 'CONTRIBUTING.md');
                await fs.writeFile(contributingFile, '', 'utf8');
            }
    
            // CHANGELOG.md
            if (includeChangelog) {
                const changelogContent = `# Changelog\n\n# v1.0.0`;
                const changelogFile = path.join(process.cwd(),  'CHANGELOG.md');
                await fs.writeFile(changelogFile, changelogContent , 'utf8');
            }

            // assets (ie. images for documentation, example screenshots, logo's, etc...)
            if (includeAssets) {
                const assetsDir = path.join(process.cwd(), 'assets');
                await fs.ensureDir(assetsDir);
            }
    
            // LICENSE
            if (includeLicense) {
                const licenseFilePath = path.join(process.cwd(), 'LICENSE');
                await fs.writeFile(licenseFilePath, '', 'utf8');
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

            const { repository, keywords, homepage, license, bugsTypeInput } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'repository',
                    message: chalk.cyan(`Enter a ${chalk.magenta('repository URL')}:`)
                },
                {
                    type: 'input',
                    name: 'keywords',
                    message: chalk.cyan(`Enter ${chalk.magenta('keywords')} (comma-separated):`),
                    filter: input => input.split(',').map(keyword => keyword.trim())
                },
                {
                    type: 'input',
                    name: 'homepage',
                    message: chalk.cyan(`Enter your ${chalk.magenta('homepage URL')}:`)
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
                `Repository URL: ${repository}\n` +
                `Keywords: ${keywords.join(', ')}\n` +
                `Homepage: ${homepage}\n` +
                `License: ${license}\n` +
                `Bugs Type: ${bugsType}\n` +
                `Bugs URL/Email: ${bugsURL}\n`, 
            { borderStyle: 'round', padding: 1, margin: 1, borderColor: 'cyan', title: 'Confirming Your Configuration', titleAlignment: 'center'});

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
                if (repository) packageJson.repository = repository;
                if (keywords) packageJson.keywords = keywords;
                if (homepage) packageJson.homepage = homepage;
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