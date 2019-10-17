const download = require('download');
const fetch = require('node-fetch');

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
        let PromiseArray = []
        for (let icon of json.icons) {
            for (let family of json.families) {
                const url = `https://fonts.gstatic.com/s/i/${family.replace(/ /g, '').toLowerCase()}/${icon.name}/v1/${fileType}`;
                PromiseArray.push(
                    new Promise(async (resolve) => {
                        const familyName = family.replace(/Material Icons/, '').replace(/ /g, '').toLowerCase();
                        try { await download(url, `./src/${fileType}/${icon.categories[0]}/${icon.name}`, { filename: `${familyName !== '' ? `${familyName}-` : ''}${icon.name}-${fileType}` }); } catch (e) { console.log(`Not downloaded: ${url}`); };
                        resolve();
                    })
                );
            }
        }
        return Promise.all(PromiseArray);
    }

    for (let fileType of fileTypes) {
        console.log(`Downloading: ${fileType}`);
        await downloadType(fileType);
        console.log(`Downloaded: ${fileType}`);
    }
})();