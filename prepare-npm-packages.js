/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const fs = require('fs');
const file = require(process.cwd() + '/package.json');
const importRegex = /import .*? from '([^.][\s\S]*?)';/gm;
const usedImports = [];
const indexFile = './src/index.ts';
const indexRegex = /import .*? from '([\s\S]*?)';/gm;

function fix() {
    const indexContent = fs.readFileSync(indexFile, 'utf8');
    const indexMatches = indexContent.matchAll(indexRegex);

    for (const match of indexMatches) {
        const path = match[1].replace('./', './src/');
        console.log(path);

        fs.readdirSync(path).forEach(file => {
            if (file != 'index.ts') {
                const fileContent = fs.readFileSync(`${path}/${file}`, 'utf8');
                const matches = fileContent.matchAll(importRegex);

                for (const match of matches) {
                    if (!usedImports.includes(match[1])) {
                        usedImports.push(match[1]);
                    }
                }
            }
        });
    }

    // remove prepare script, it will fail in the dist folder.
    delete file.devDependencies;

    // remove all dependencies not used in dataTypes.
    for (var name in file.dependencies) {
        if (file.dependencies.hasOwnProperty(name) && !usedImports.includes(name)) {
            console.log(`Removing ${name} from dependencies`);
            delete file.dependencies[name];
        }
    }

    // write the modified package.json to be used in NPM publish.
    fs.writeFileSync(process.cwd() + `/package${process.argv[2] ?? ""}.json`, JSON.stringify(file, null, 2), {
        flag: 'w'
    });

    console.log('Prepared package.json for NPM');
}

if (fs.existsSync(indexFile)) {
    fix();
} else {
    console.error('index.ts not found');
}