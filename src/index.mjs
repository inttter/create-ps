#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';
import axios from 'axios';
import gitUserName from 'git-user-name';
import { consola } from 'consola'
import { intro, multiselect, select, confirm, text, outro, spinner, cancel, isCancel } from '@clack/prompts';

// api to fetch licenses from
const baseURL = 'https://api.github.com/licenses';

// allow exiting prompts with `CTRL+C`
async function checkCancellation(input, cancelMessage = 'Cancelled because `CTRL+C` was pressed.') {
    if (isCancel(input)) {
        cancel(cancelMessage);
        process.exit(0);
    }
}

// validate dependency names (along with dependency versions)
async function validateDependencies(depNames) {
    const validDeps = [];
    const invalidDeps = [];
    
    for (const dep of depNames) {
        const [depName, version] = dep.split('@');
        try {
            const response = await axios.get(`https://registry.npmjs.org/${depName}`);
            if (response.status === 200) {
                if (version) { // handling versions
                    const versions = Object.keys(response.data.versions);
                    if (versions.includes(version)) {
                        validDeps.push(dep);
                    } else {
                        invalidDeps.push(dep);
                    }
                } else {
                    validDeps.push(dep);
                }
            }
        } catch (error) {
            invalidDeps.push(dep);
        }
    }
    
    return { validDeps, invalidDeps };
}

program
    .name('cps')
    .description('create-ps is a CLI tool which helps you to create the foundations for an NPM package.')
    .arguments('[packageName]')
    .option('--cjs', 'use CommonJS instead')
    .action(async (packageName, options) => {
        try {
            // runs npm init -y
            await execa('npm', ['init', '-y']);

            // warn user if they use commonjs that they should probably use esm instead
            if (options.cjs) {
                consola.warn(chalk.gray(`${chalk.yellow('You are creating a package using CommonJS (CJS).')}\n\nIt is recommended to use EcmaScript (ESM) instead to guarantee the longevity of your package in the future.\nTo use ESM with create-ps, remove the ${chalk.magenta('`--cjs`')} option from the command you just ran.\n\nRead more: ${chalk.magenta('https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c')}`));
            }

            console.log();
            intro(`${chalk.bgCyan(chalk.black(' create-ps '))}`);
            
            const description = {};

            // description prompt
            description.userDescription = await text({
                message: chalk.cyan(`Enter a ${chalk.magenta('short description')} of the package:`)
            });

            await checkCancellation(description.userDescription);
            
            // update package.json with the provided description
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = await fs.readJson(packageJsonPath);
            
            packageJson.description = description.userDescription;
            packageJson.name = packageName
            
            // remove optional "directories" field from package.json which
            // for some reason generated when running npm init -y with create-ps
            // https://docs.npmjs.com/cli/v10/configuring-npm/package-json#directories
            delete packageJson.directories;

            // taken from: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
            if (!options.cjs) {
                packageJson.type = 'module';
                packageJson.engines = { node: '>=18' };
            }

            // write the updated package.json back to file
            await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

            const toggles = await multiselect({
                message: chalk.cyan('Select what you\'d like to include:'),
                options: [
                    { value: 'src/', label: 'Source', hint: 'Recommended' },
                    { value: 'test/', label: 'Test', hint: 'Recommended' },
                    { value: 'examples/', label: 'Examples' },
                    { value: 'docs/', label: 'Documentation' },
                    { value: 'assets/', label: 'Assets / Images' },
                    { value: 'i18n/', label: 'Internationalization (i18n)' },
                    { value: '.github/workflows', label: 'GitHub workflows' },
                    { value: '.github/dependabot.yml', label: 'Dependabot configuration' },
                    { value: '.gitignore', label: 'Gitignore', hint: 'Recommended' },
                    { value: 'README.md', label: 'Readme', hint: 'Recommended' },
                    { value: 'CONTRIBUTING.md', label: 'Contributing guidelines' },
                    { value: 'CHANGELOG.md', label: 'Changelog' },
                    { value: 'CODE_OF_CONDUCT.md', label: 'Code of Conduct' },
                    { value: 'LICENSE', label: 'License', hint: 'Recommended' },
                    { value: 'dependencies', label: 'Dependencies', hint: 'Select to install dependencies' }
                ],
                required: true,
            });

            await checkCancellation(toggles);
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

    let selectedLicenseName = '';
    let readmeContent = '';

    async function createPkgStructure(packageName, description, options, toggles) {
        try {
            // Check for existing files
            const existingItems = [];
            for (const toggle of toggles) {
                const filePath = path.join(process.cwd(), toggle);
                const exists = await fs.pathExists(filePath);
                if (exists) {
                    const stats = await fs.stat(filePath);
                    if (stats.isFile() || stats.isDirectory()) {
                        existingItems.push(filePath);
                   }
                }
            }
    
            // warning message which lists what files may be overwritten
            if (existingItems.length > 0) {
                console.log();
                consola.warn(chalk.yellow('The following file paths will be overwritten with template content:'));
                existingItems.forEach(item => console.log(chalk.yellow(`• ${item}`)));
                console.log();

                // prompt for if they'd like to continue despite existing files
                const continueCreation = await confirm({
                    message: chalk.cyan('Would you like to skip the listed file paths?'),
                });

                await checkCancellation(continueCreation);

                // when user selects 'Y'
                if (continueCreation) {
                    toggles = toggles.filter(toggle => !existingItems.includes(path.join(process.cwd(), toggle)));
                }
            }
    
            // loop through each toggle answer and create files/directories accordingly
            for (const toggle of toggles) {
                switch (toggle) {
                    case 'src/':
                        const srcDir = path.join(process.cwd(), 'src');
                        await fs.ensureDir(srcDir);
    
                        // if --cjs is specified, changes the file name to index.js, else, keep as index.mjs
                        let indexFileName = 'index.mjs';
                        if (process.argv.includes('--cjs')) {
                            indexFileName = 'index.js';
                        }
    
                        const indexFile = path.join(srcDir, indexFileName);
                        await fs.writeFile(indexFile, '', 'utf8');
    
                        // updates the main field in package.json
                        const packageJsonPath = path.join(process.cwd(), 'package.json');
                        const packageJson = await fs.readJson(packageJsonPath);
    
                        // this determines the correct main file based on if --cjs is specified
                        const mainFile = process.argv.includes('--cjs') ? './src/index.js' : './src/index.mjs';

                        if (options.cjs) {
                            packageJson.main = mainFile;
                            delete packageJson.exports;
                        } else {
                            packageJson.exports = `./src/${indexFileName}`;
                            delete packageJson.main;
                        }
        
                        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 }); // writes to package.json
                        break;
                    case 'test/':
                        const testDir = path.join(process.cwd(), 'test');
                        await fs.ensureDir(testDir);
    
                        const test = 'example.test.js';
                        const testFile = path.join(testDir, test);
                        await fs.writeFile(testFile, '// You should install a testing framework if you are including tests within your package. Some popular ones include:\n\n// Jest: https://jestjs.io/docs/getting-started\n// Mocha: https://mochajs.org/#getting-started\n// Jasmine: https://jasmine.github.io/pages/getting_started.html\n// AVA: https://github.com/avajs/ava?tab=readme-ov-file#usage');
                        break;
                    case 'examples/':
                        const examplesDir = path.join(process.cwd(), 'examples');
                        await fs.ensureDir(examplesDir);
                        
                        // if --cjs is present, file extension will be .js, else will be .mjs
                        const exampleExtension = options.cjs ? 'js' : 'mjs';
                        const exampleFileName = `example.${exampleExtension}`;
                        
                        const exampleFile = path.join(examplesDir, exampleFileName);
                        await fs.writeFile(exampleFile, '// Show an example of how your package is used here.');
                        break;
                    case 'docs/':
                        const docsDir = path.join(process.cwd(), 'docs');
                        await fs.ensureDir(docsDir);

                        const docsURL = 'https://gist.githubusercontent.com/inttter/6ae09a5d578746239c8983326ce6f1e0/raw/23eba517b3924c09eab82ecd005d1a72a5c380bb/example.md';
                        const docsResponse = await axios.get(docsURL);
                        let docsContent = docsResponse.data;
                        docsContent = docsContent.replace(/\[Project Name\]/g, packageName);
    
                        const exampleDoc = 'example.md';
                        const docsFile = path.join(docsDir, exampleDoc);
                        await fs.writeFile(docsFile, docsContent);
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

                        const workflowURL = 'https://gist.githubusercontent.com/inttter/f8c8a0286cf8e79645965d99694a412f/raw/e1fbd2d3a8c5904225f2c54738dfa1e39b3cbc1f/workflow.yml';
                        const workflowResponse = await axios.get(workflowURL);
                        const workflowContent = workflowResponse.data;
    
                        const workflow = 'workflow.yml';
                        const workflowFile = path.join(workflowsDir, workflow);
                        await fs.writeFile(workflowFile, workflowContent);
                        break;
                    case '.github/dependabot.yml':
                        const dependabotDir = path.join(process.cwd(), '.github');
                        await fs.ensureDir(dependabotDir);
                        
                        const dependabot = 'dependabot.yml';
                        const dependabotFile = path.join(dependabotDir, dependabot);
                        await fs.writeFile(dependabotFile, 'version: 2\nupdates:\n  - package-ecosystem: "npm"\n    directory: "/"\n    schedule:\n     interval: "daily"', 'utf-8');
                        break;
                    case '.gitignore':
                        // https://github.com/github/gitignore/blob/main/Node.gitignore
                        const gitignoreURL = 'https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore';
                        const gitIgnoreResponse = await axios.get(gitignoreURL);
                        const gitignoreContent = gitIgnoreResponse.data;
    
                        const gitignoreFile = path.join(process.cwd(), '.gitignore');
                        await fs.writeFile(gitignoreFile, gitignoreContent, 'utf8');
                        break;
                    case 'README.md':
                        let importStatement = `import ${packageName} from '${packageName}';`;
                        if (options.cjs) {
                            importStatement = `const ${packageName} = require('${packageName}');`;
                        }
                        
                        // due to the amount of content being replaced here, i think its not smart
                        // to grab the content from a gist then try to replace it (in case i mess something up)
                        readmeContent = `# ${packageName}\n\n${description.userDescription}\n\n# Installation\n\nInstall this package to use in your project using the following command:\n\n\`\`\`bash\nnpm install ${packageName}\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\n${importStatement}\n\n// Your example code will go here, below the import statement.\n\`\`\``;

                        // if the CONTRIBUTING.md file gets added, then append this to the README
                        if (toggles.includes('CONTRIBUTING.md')) {
                            readmeContent += `\n\n# Contributing\n\nWe welcome all contributions! If you would like to make a contribution, please see the [contributing guidelines](CONTRIBUTING.md) for more information.`;
                        }

                        // if the LICENSE file gets added, then append this to the README,
                        // along with the license name (defined as `selectedLicenseName`) 
                        if (toggles.includes('LICENSE') && selectedLicenseName) {
                            readmeContent += `\n\n# License\n\nThis project is licensed under the [${selectedLicenseName}](LICENSE).`;
                        }

                        const readmeFile = path.join(process.cwd(), 'README.md');
                        await fs.writeFile(readmeFile, readmeContent, 'utf8');
                        break;
                    case 'CONTRIBUTING.md':
                        // fetches a template contributing guidelines template from a gist
                        const contributingURL = 'https://gist.githubusercontent.com/inttter/5c691a422c64804c02931da965a17400/raw/171b812879339b4a6758002c2665172fcff070cd/CONTRIBUTING.md';
                        const contributingResponse = await axios.get(contributingURL);
                        let contributingContent = contributingResponse.data;
                        contributingContent = contributingContent.replace(/\[Project Name\]/g, packageName);
                        
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
                        // fetches the Covenant Code of Conduct from the official source
                        const cocURL = 'https://www.contributor-covenant.org/version/2/0/code_of_conduct/code_of_conduct.md';
                        const cocResponse = await axios.get(cocURL);
                        const cocContent = cocResponse.data;
                        
                        const cocFile = path.join(process.cwd(), 'CODE_OF_CONDUCT.md');
                        await fs.writeFile(cocFile, cocContent, 'utf8');
                        break;
                    case 'LICENSE':
                        try {                            
                            // fetch licenses from the GitHub API
                            const licensesResponse = await axios.get(`${baseURL}`);
                            const licenses = licensesResponse.data.map(license => ({
                                label: license.name,
                                value: license.key,
                            }));
                        
                            // prompt the user to select a license
                            const selectedLicense = await select({
                                message: chalk.cyan(`Select a license:`),
                                options: licenses
                            });

                            await checkCancellation(selectedLicense);

                            selectedLicenseName = licenses.find(license => license.value === selectedLicense).label;
                        
                            // fetches the selected license text
                            let selectedLicenseResponse = await axios.get(`${baseURL}/${selectedLicense}`);
                            let selectedLicenseText = selectedLicenseResponse.data.body;

                            // replaces [name] and [fullname] fields with git user name and current year
                            const fullname = gitUserName();
                            const currentYear = new Date().getFullYear();
                            selectedLicenseText = selectedLicenseText
                                .replace('[year]', currentYear)
                                .replace('[fullname]', fullname);
                        
                            // write the selected license text to the LICENSE file
                            const selectedLicenseFilePath = path.join(process.cwd(), 'LICENSE');
                            await fs.writeFile(selectedLicenseFilePath, selectedLicenseText, 'utf8');
                        } catch (error) {
                            consola.error(new Error(chalk.red(`An error occurred when trying to fetch or write the license: ${error}`)));
                        }
                        break;
                    case 'dependencies':
                        let depNamesPrompt = await text({
                            message: chalk.cyan(`Enter the name of the dependencies you want to install (comma-separated):`)
                        });

                        await checkCancellation(depNamesPrompt);
                            
                        let depNames = depNamesPrompt.split(',').map(dep => dep.trim());
                        
                        let { validDeps, invalidDeps } = await validateDependencies(depNames);
                        
                        while (invalidDeps.length > 0) {
                            consola.warn(chalk.yellow(`The following dependencies are invalid: ${invalidDeps.join(', ')}`));
                            depNamesPrompt = await text({
                                message: chalk.cyan(`Please re-enter the invalid dependencies correctly (comma-separated):`)
                            });
                            
                            await checkCancellation(depNamesPrompt);
                            
                            depNames = depNamesPrompt.split(',').map(dep => dep.trim());
                            
                            const validationResults = await validateDependencies(depNames);
                            validDeps = [...validDeps, ...validationResults.validDeps];
                            invalidDeps = validationResults.invalidDeps;
                        }
            
                        try {
                            const s = spinner();
                            s.start(chalk.cyan('Installing dependencies from npm'));
                            await execa('npm', ['install', ...validDeps]);
                            s.stop(chalk.green('🎉 Installed all dependencies!'));
            
                            // check if '--cjs' option is present
                            const isCJS = process.argv.includes('--cjs');
            
                            // check if 'src/' is selected
                            const isSrcSelected = toggles.includes('src/');
                                
                            if (isSrcSelected) {
                                const indexFileName = isCJS ? 'index.js' : 'index.mjs';
                                const indexFile = path.join(process.cwd(), 'src', indexFileName);
                                let indexContent = await fs.readFile(indexFile, 'utf-8');
                                // theres no way to tell exactly how the package is called (ie. with modules, if they use {} or not), so we just use ${dep} for the name for both parts. 
                                // the comments below are there to warn users about this.
                                indexContent += `// NOTE: You might need to change these statements based on how the modules of these packages are added.\n//       Make sure you check the documentations for these packages.\n//       To run this script, run 'node src/${indexFileName}'\n`;
                                validDeps.forEach(dep => {
                                    const depName = dep.replace(/@.*/, '');
                                    const statement = isCJS ? `const ${depName} = require('${depName}');` : `import ${depName} from '${depName}';`;
                                    indexContent += `${statement}\n`;
                                });
                        
                                await fs.writeFile(indexFile, indexContent, 'utf-8');
                            }
                        } catch (error) {
                            consola.error(new Error(chalk.red(`An error occurred when trying to install dependencies: ${error}`)));
                        }
                        break;
                }
            }
    
            outro(chalk.green(`✨ You're all set! The structure for ${chalk.green.bold(packageName)} has been created successfully.`));
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
            const packageName = packageJson.name;

            const toggles = await multiselect({
                message: chalk.cyan('Select what you\'d like to include:'),
                options: [
                    { value: 'Author', label: 'Author', hint: 'Recommended' },
                    { value: 'Repository', label: 'Repository' },
                    { value: 'Keywords', label: 'Keywords', hint: 'Recommended' },
                    { value: 'Homepage', label: 'Homepage' },
                    { value: 'Funding', label: 'Funding' },
                    { value: 'License', label: 'License', hint: 'Recommended' },
                ]
            });

            await checkCancellation(toggles);

            const responses = {};

            // check for valid urls
            const isValidURL = (url) => {
                try {
                    new URL(url);
                    return true;
                } catch (error) {
                    return false;
                }
            };

            if (toggles.includes('Author')) {
                responses.author = await text({
                    message: chalk.cyan(`Enter the ${chalk.magenta('author')} of this package:`),
                    placeholder: gitUserName(),
                });
            }

            await checkCancellation(responses.author);

            if (toggles.includes('Repository')) {
                responses.repository = await text({
                    message: chalk.cyan(`Enter a ${chalk.magenta('repository URL')}:`),
                    validate: input => {
                        if (!isValidURL(input)) {
                            return "Please enter a valid URL.";
                        }
                        return;
                    }
                });
            }

            await checkCancellation(responses.repository);

            if (toggles.includes('Keywords')) {
                const keywordsInput = await text({
                    message: chalk.cyan(`Enter some ${chalk.magenta('keywords')} (comma-separated):`),
                });
                await checkCancellation(keywordsInput);
                responses.keywords = keywordsInput.split(',').map(keyword => keyword.trim());
            }
            

            if (toggles.includes('Homepage')) {
                responses.homepage = await text({
                    message: chalk.cyan(`Enter a ${chalk.magenta('homepage URL')}:`),
                    validate: input => {
                        if (!isValidURL(input)) {
                            return "Please enter a valid URL.";
                        }
                        return;
                    }
                });
            }

            await checkCancellation(responses.homepage);

            if (toggles.includes('Funding')) {
                let fundingType = await text({
                    message: chalk.cyan(`Enter the ${chalk.magenta('funding type')} you want to use:`),
                });

                await checkCancellation(fundingType);

                // if user enters nothing, it will default to individual
                if (!fundingType) {
                    fundingType = 'individual';
                    consola.warn(chalk.yellow(`No funding type specified. The field will have a default of 'individual'.`));
                }
            
                const fundingURL = await text({
                    message: chalk.cyan(`Enter the ${chalk.magenta('funding URL')}:`),
                    validate: input => {
                        if (!isValidURL(input)) {
                            return "Please enter a valid URL.";
                        }
                        return;
                    }
                });

                await checkCancellation(fundingURL);

                const funding = { type: fundingType, url: fundingURL };
                responses.funding = funding;
            }

            if (toggles.includes('License')) {
                responses.license = await text({
                    message: chalk.cyan(`Enter the ${chalk.magenta('license')} you wish to use:`),
                });
            }

            await checkCancellation(responses.license);

            const updatedPackageJson = { ...packageJson, ...responses };
            await fs.writeJson(packageJsonPath, updatedPackageJson, { spaces: 2 });

            // `npm pkg fix` takes a few seconds to run sometimes so
            // this adds a spinner to notify the user
            const s = spinner();
            s.start(chalk.cyan('Running `npm pkg fix` to fix any issues'));

            // run npm pkg fix here to properly fix any lingering mistakes
            await execa('npm', ['pkg', 'fix']);

            s.stop(chalk.green('🎉 `npm pkg fix` was ran successfully!'));

            outro(chalk.green(`✨ Your all set! The ${chalk.green.bold('package.json')} for ${chalk.green.bold(packageName)} has been updated successfully.`));
        } catch (err) {
            consola.error(new Error(chalk.red(`An error occurred when trying to update your ${chalk.magenta('package.json')}: ${err}`)));
        }
    });

program.parse(process.argv);