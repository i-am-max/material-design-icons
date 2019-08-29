const fs = require('fs');
const download = require('download');
const fetch = require('node-fetch');

(async () => {
    const json = await (await fetch('https://material.io/tools/icons/static/data.json')).json();
    const styles = ['baseline', 'outlined', 'round', 'twotone', 'sharp'];
    const fileTypes = [
        '24px.svg',
        'black-18dp.zip', 'black-24dp.zip', 'black-36dp.zip', 'black-48dp.zip', 'black-ios.zip', 'black-android.zip',
        'white-18dp.zip', 'white-24dp.zip', 'white-36dp.zip', 'white-48dp.zip', 'white-ios.zip', 'white-android.zip'
    ];

    const downloadType = async (fileType) => {
        let PromiseArray = []
        for (let category of json.categories) {
            for (let icon of category.icons) {
                for (let style of styles) {
                    let url = `https://fonts.gstatic.com/s/i/materialicons${style !== 'baseline' ? style : ''}/${icon.id}/v1/${fileType}`;
                    PromiseArray.push(
                        new Promise(async (resolve) => {
                            try { await download(url, `./src/${fileType}/${category.name}/${icon.id}`, { filename: `${style}-${icon.id}-${fileType}` }); } catch (e) { console.log(`Not downloaded: ${url}`); };
                            resolve();
                        })
                    );
                }
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