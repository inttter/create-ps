#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execa } from 'execa';
import ora from 'ora';

program
    .version('1.0.0')
    .description('Creates a foundation for your NPM package.')
    .arguments('<packageName>')
    .option('--esm', '--ecmascript', 'Creates an EcmaScript file in src/.')
    .action(async (packageName, options) => {
        try {
            // Run npm init -y using execa
            await execa('npm', ['init', '-y']);

            // Prompt user for description
            const { description } = await inquirer.prompt({
                type: 'input',
                name: 'description',
                message: chalk.cyan(`Enter a ${chalk.magenta('short description')} of the package:`)
            });

            // Toggle options for files/directories
            const { includeSrc, includeTest, includeDependabot, includeReadme, includeContributing, includeLicense } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'includeSrc',
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('src')} directory?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeTest',
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('test')} directory?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeDependabot',
                    message: chalk.cyan(`Would you like to include ${chalk.magenta('Dependabot')}?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeReadme',
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('README')} file?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeContributing',
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('contributing guidelines')} file?`),
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'includeLicense',
                    message: chalk.cyan(`Would you like to include a ${chalk.magenta('LICENSE')} file?`),
                    default: true
                }
            ]);

            // Create package structure and update package.json
            await createPkgStructure(packageName, description, options, includeSrc, includeTest, includeDependabot, includeReadme, includeContributing, includeLicense);
        } catch (err) {
            console.error(`Error initializing package: ${err}`);
        }
    });

async function createPkgStructure(packageName, description, options, includeSrc, includeTest, includeDependabot, includeReadme, includeContributing, includeLicense) {
    const spinner = ora('Creating package structure...').start();

    try {
        // Create src directory if selected
        if (includeSrc) {
            const srcDir = path.join(process.cwd(), 'src');
            await fs.ensureDir(srcDir);

            // Determine index file name based on --esm flag
            const indexFileName = options.esm ? 'index.mjs' : 'index.js';
            const indexFile = path.join(srcDir, indexFileName);
            await fs.writeFile(indexFile, '', 'utf8');
        }

        // Create test directory if selected
        if (includeTest) {
            const testDir = path.join(process.cwd(), 'test');
            await fs.ensureDir(testDir);
        }

        if (includeDependabot) {
            const WorkflowsFolder = path.join(process.cwd(), '.github');
            await fs.ensureDir(WorkflowsFolder);

            const dependabot = 'dependabot.yml';
            const dependabotFile = path.join(WorkflowsFolder, dependabot);
            await fs.writeFile(dependabotFile, 'version: 2\nupdates:\n  - package-ecosystem: "npm"\n    directory: "/"\n    schedule:\n     interval: "daily"', 'utf-8');
        }

        // Create README.md with placeholder for description if selected
        if (includeReadme) {
            const readmeContent = `# ${packageName}\n\n${description}\n\n# Installation\n\n\`\`\`bash\nnpm install ${packageName}\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\nconst ${packageName} = require('${packageName}')\n\n// (code goes here)\n\`\`\``;
            const readmeFile = path.join(process.cwd(), 'README.md');
            await fs.writeFile(readmeFile, readmeContent, 'utf8');
        }

        // Create CONTRIBUTING.md if selected
        if (includeContributing) {
            const contributingFile = path.join(process.cwd(), 'CONTRIBUTING.md');
            await fs.writeFile(contributingFile, '', 'utf8');
        }

        // Create LICENSE file if selected
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