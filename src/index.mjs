#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';
import axios from 'axios';
import gitUserName from 'git-user-name';
import { consola } from 'consola'
import { intro, multiselect, select, confirm, text } from '@clack/prompts';

// api to fetch licenses from. used for the license switch case
const baseURL = 'https://api.github.com/licenses';

program
    .name('cps')
    .description('create-ps is a CLI tool which helps you to create the foundations for an NPM package,')
    .arguments('<packageName>')
    .option('--esm', 'use ESM files and syntax')
    .action(async (packageName, options) => {
        try {
            // runs npm init -y
            await execa('npm', ['init', '-y']);

            console.log();
            intro(`${chalk.bgCyan(chalk.black(' create-ps '))}`);
            
            const description = {};

            // description prompt
            description.userDescription = await text({
                message: chalk.cyan(`Enter a ${chalk.magenta('short description')} of the package:`)
            });
            
            // update package.json with the provided description
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = await fs.readJson(packageJsonPath);
            
            packageJson.description = description.userDescription;
            
            // write the updated package.json back to file
            await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

            const toggles = await multiselect({
                message: chalk.cyan('Select what you\'d like to include:'),
                options: [
                    { value: 'src/', label: 'Source', hint: 'Recommended' },
                    { value: 'test/', label: 'Test' },
                    { value: 'examples/', label: 'Examples' },
                    { value: 'docs/', label: 'Documentation' },
                    { value: 'assets/', label: 'Assets / Images' },
                    { value: 'i18n/', label: 'Internationalization (i18n)' },
                    { value: '.github/workflows', label: 'GitHub workflows' },
                    { value: '.github/dependabot.yml', label: 'Dependabot configuration', hint: 'Recommended' },
                    { value: '.gitignore', label: 'Gitignore', hint: 'Recommended' },
                    { value: 'README.md', label: 'Readme', hint: 'Recommended' },
                    { value: 'CONTRIBUTING.md', label: 'Contributing guidelines' },
                    { value: 'CHANGELOG.md', label: 'Changelog' },
                    { value: 'CODE_OF_CONDUCT.md', label: 'Code of Conduct' },
                    { value: 'LICENSE', label: 'License', hint: 'Recommended' }
                ],
                required: true,
            });

            await createPkgStructure(packageName, description, options, toggles);

            // start a git repo by default by running 'git init'
            try {
                await execa('git', ['init']);
            } catch (err) {
                consola.error(new Error(chalk.red(`An error occurred when initializing a Git repository: ${err}`)));
            }
        } catch (err) {
            consola.error(new Error(chalk.red(`An error occurred when initializing the package: ${err}`)));
        }
    });

async function createPkgStructure(packageName, description, options, toggles) {
    try {
        // check for existing files
        const existingFiles = [];
        for (const toggle of toggles) {
            const filePath = path.join(process.cwd(), toggle);
            const exists = await fs.pathExists(filePath);
            if (exists && (await fs.stat(filePath)).isFile()) {
                existingFiles.push(filePath);
            }
        }

        // warning message which lists what may be overwritten
        if (existingFiles.length > 0) {
            console.log();
            consola.warn(chalk.yellow('The following files already exist and may be overwritten:'));
            existingFiles.forEach(file => console.log(chalk.yellow(`• ${file}`)));
            console.log();
            
            // prompt for if they'd like to continue despite existing files
            const continueCreation = await confirm({
                message: chalk.cyan('Would you like to continue anyway?'),
            });
            
            // when user selects 'N'
            if (!continueCreation) {
                console.log(chalk.red('\n❌ Package creation aborted.\n'));
                process.exit(0);
                return;
            }
        }

        // loop through each toggle answer and create files/directories accordingly
        const files = toggles.map(async (toggle) => {
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

                    const exampleDoc = 'example.md';
                    const docsFile = path.join(docsDir, exampleDoc);
                    await fs.writeFile(docsFile, `<!-- NOTE: This is a template documentation file. Feel free to modify it according to what your package is. !-->\n\n# ${packageName} Documentation 📚\n\nWelcome to the documentation for the ${packageName} package!\n\nThis documentation houses everything you will need to know about how to use ${packageName} within your own projects.`);
                    break;
                case 'i18n/':
                    const i18nDir = path.join(process.cwd(), 'i18n');
                    const localesDir = path.join(i18nDir, 'locales');
                    await fs.ensureDir(localesDir);
                    
                    const defaultLocale = 'en_US';
                    const localeFilePath = path.join(localesDir, `${defaultLocale}.json`);                    
                    await fs.writeFile(localeFilePath, '');
                    break;
                case 'assets/':
                    const assetsDir = path.join(process.cwd(), 'assets');
                    await fs.ensureDir(assetsDir);
                    break;
                case '.github/workflows':
                    const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
                    await fs.ensureDir(workflowsDir);

                    const workflow = 'workflow.yml';
                    const workflowFile = path.join(workflowsDir, workflow);
                    await fs.writeFile(workflowFile, '# You can include any type of workflow here,\n# for example, CI/CD, publishing, making issues stale, and more.\n\n# See the GitHub Workflow docs here: https://docs.github.com/en/actions/using-workflows.')
                    break;
                case '.github/dependabot.yml':
                    const dependabotDir = path.join(process.cwd(), '.github');
                    await fs.ensureDir(dependabotDir);
                    
                    const dependabot = 'dependabot.yml';
                    const dependabotFile = path.join(dependabotDir, dependabot);
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
                    const contributingContent = `# Contributing\n\nThank you for considering contributing to this project! Before you do, please read these guidelines.\n\n## Submitting a Pull Request\n\nTo submit a pull request, follow these steps:\n\n1. Fork the repository\n\n2. Clone your forked repository to your local machine\n\n3. Create a new branch for your changes\n\n4. Make your changes\n\n5. Commit your changes to the branch\n\n6. Push your changes to your forked repository\n\n7. Open a pull request on GitHub\n\n<!-- Continue to list more guidelines which are specific to the package you are making. !-->`;
                    const contributingFile = path.join(process.cwd(), 'CONTRIBUTING.md');
                    await fs.writeFile(contributingFile, contributingContent, 'utf8');
                    break;
                case 'CHANGELOG.md':
                    const currentDate = new Date().toISOString().split('T')[0];
                    const changelogContent = `# Changelog\n\n# v1.0.0 (${currentDate})\n\n* 🎉 Initial commit`;
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
                    try {
                        // Fetch licenses from the GitHub API
                        const licensesResponse = await axios.get(`${baseURL}`);
                        const licenses = licensesResponse.data.map(license => ({
                            label: license.name,
                            value: license.key,
                        }));
                    
                        // Prompt the user to select a license
                        const selectedLicense = await select({
                            message: chalk.cyan(`Select a license:`),
                            options: licenses
                        });
                    
                        // Fetch the selected license text
                        const selectedLicenseResponse = await axios.get(`${baseURL}/${selectedLicense}`);
                        const selectedLicenseText = selectedLicenseResponse.data.body;
                    
                        // Write the selected license text to the LICENSE file
                        const selectedLicenseFilePath = path.join(process.cwd(), 'LICENSE');
                        await fs.writeFile(selectedLicenseFilePath, selectedLicenseText, 'utf8');
                    } catch (error) {
                        consola.error(new Error(chalk.red(`An error occurred when trying to fetch or write the license: ${error}`)));
                    }
                    break;
                default:
                    break;
                }
            }
        )
        await Promise.all(files);

        consola.success(chalk.green(`The package structure for '${packageName}' has been created successfully.\n`));
    } catch (err) {
        consola.error(new Error(chalk.red(`An error occurred when trying to create the structure of your package: ${err}`)));
    }
}

program
    .command('pkg-config')
    .description('customise different fields in your package.json')
    .action(async () => {
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = await fs.readJson(packageJsonPath);

            const toggles = await multiselect({
                message: chalk.cyan('Select what you\'d like to include:'),
                options: [
                    { value: 'Author', label: 'Author' },
                    { value: 'Repository', label: 'Repository' },
                    { value: 'Keywords', label: 'Keywords' },
                    { value: 'Homepage', label: 'Homepage' },
                    { value: 'Funding', label: 'Funding' },
                    { value: 'License', label: 'License' },
                ]
            });

            const responses = {};

            if (toggles.includes('Author')) {
                responses.author = await text({
                    message: chalk.cyan(`Enter the ${chalk.magenta('author')} of this package:`),
                    placeholder: gitUserName()
                });
            }

            if (toggles.includes('Repository')) {
                responses.repository = await text({
                    message: chalk.cyan(`Enter a ${chalk.magenta('repository URL')}:`),
                    placeholder: packageJson.repository || ''
                });
            }

            if (toggles.includes('Keywords')) {
                const keywordsInput = await text({
                    message: chalk.cyan(`Enter some ${chalk.magenta('keywords')} (comma-separated):`),
                    placeholder: packageJson.keywords ? packageJson.keywords.join(', ') : '',
                });
                responses.keywords = keywordsInput.split(',').map(keyword => keyword.trim());
            }

            if (toggles.includes('Homepage')) {
                responses.homepage = await text({
                    message: chalk.cyan(`Enter a ${chalk.magenta('homepage URL')}:`),
                    placeholder: packageJson.homepage || ''
                });
            }

            if (toggles.includes('Funding')) {
                responses.funding = await text({
                    message: chalk.cyan(`Enter a ${chalk.magenta('funding URL')}:`),
                    placeholder: packageJson.funding || ''
                });
            }

            if (toggles.includes('License')) {
                responses.license = await text({
                    message: chalk.cyan(`Enter the ${chalk.magenta('license')} you wish to use:`),
                    placeholder: packageJson.license || ''
                });
            }

            const updatedPackageJson = { ...packageJson, ...responses };
            await fs.writeJson(packageJsonPath, updatedPackageJson, { spaces: 2 });

            console.log()
            consola.success(chalk.green(`Your package.json has been updated successfully.\n`));
        } catch (err) {
            consola.error(new Error(chalk.red(`An error occurred when trying to update your ${chalk.magenta('package.json')}: ${err}`)));
        }
    });

program.parse(process.argv);