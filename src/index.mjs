#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execa } from 'execa';
import ora from 'ora';

program
    .version('1.1.0')
    .description('Creates a foundation for your NPM package.')
    .arguments('<packageName>')
    .option('--esm', 'Creates an EcmaScript file in src/.')
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
            const { includeSrc, includeTest, startGitRepo, includeDependabot, includeWorkflows, includeGitIgnore, includeReadme, includeContributing, includeChangelog, includeLicense } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'includeSrc', // src prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('src')} directory?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeTest', // test prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('test')} directory?`),
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
                    name: 'includeDependabot', // dependabot prompt
                    message: chalk.cyan(`Would you like to include ${chalk.magenta('Dependabot')}?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeWorkflows', // github workflows prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('GitHub Workflows')} folder?`)
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
                    name: 'includeLicense', // license prompt
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('LICENSE')} file?`),
                    default: true
                }
            ]);

            await createPkgStructure(packageName, description, options, includeSrc, includeTest, startGitRepo, includeDependabot, includeWorkflows, includeGitIgnore, includeReadme, includeContributing, includeChangelog, includeLicense);

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

    async function createPkgStructure(packageName, description, options, includeSrc, includeTest, startGitRepo, includeDependabot, includeWorkflows, includeGitIgnore, includeReadme, includeContributing, includeChangelog, includeLicense) {
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
    
            // workflows folder
            if (includeWorkflows) {
                const workflowsFolder = path.join(process.cwd(), '.github', 'workflows');
                await fs.ensureDir(workflowsFolder);
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

program.parse(process.argv);