import * as fs from 'fs';
import fetch from 'node-fetch';
import isequal from 'lodash.isequal';
import download from 'download';

(async () => {
    const json = await (async () => {
        const text = await (await fetch('https://fonts.google.com/metadata/icons')).text();
        return JSON.parse(text.substring(text.indexOf("\n") + 1));
    })();

    const fileTypes = [
        '24px.svg',
        'black-18dp.zip', 'black-24dp.zip', 'black-36dp.zip', 'black-48dp.zip', 'black-ios.zip', 'black-android.zip',
        'white-18dp.zip', 'white-24dp.zip', 'white-36dp.zip', 'white-48dp.zip', 'white-ios.zip', 'white-android.zip'
    ];

    const downloadType = async (fileType) => {
        process.stdout.write(`Downloading: ${fileType}`);
        let PromiseArray = [];
        let allDownloaded = true;
        for (let icon of json.icons) {
            for (let family of json.families) {
                const familyName = family.replace(/Material Icons/, '').replace(/ /g, '').toLowerCase();
                const url = `https://fonts.gstatic.com/s/i/materialicons${familyName}/${icon.name}/v${icon.version}/${fileType}`;
                PromiseArray.push(
                    new Promise(async (resolve) => {
                        try {
                            await download(url, `./src/${fileType}/${icon.categories[0]}/${icon.name}`, { filename: `${familyName + (familyName ? '-' : '')}${icon.name}-${fileType}` });
                        } catch (e) {
                            console.log(`Not downloaded: ${url}`);
                            allDownloaded = false;
                        };
                        resolve();
                    })
                );
            }
        }
        await Promise.all(PromiseArray);
        if (allDownloaded) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
        process.stdout.write(`Downloaded: ${fileType}\n`);
    }

    if (fs.existsSync('icons.json') && isequal(JSON.parse(fs.readFileSync('icons.json', 'utf8')), json)) {
        console.log('No changes found in https://fonts.google.com/metadata/icons');
        return;
    }

    process.stdout.write(`Deleting old src folder`);
    fs.rmdirSync('./src', { recursive: true });
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Deleted old src folder\n`);

    for (let fileType of fileTypes) {
        await downloadType(fileType);
    }

    fs.writeFileSync('icons.json', JSON.stringify(json));
})();