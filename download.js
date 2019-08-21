const fs = require('fs');
const download = require('download');

const json = JSON.parse(fs.readFileSync('./data.json'));
const styles = ['baseline', 'outline', 'round', 'twotone', 'sharp'];
const fileTypes = [
    '24px.svg',
    'black-18.zip', 'black-24.zip', 'black-36.zip', 'black-48.zip', 'ios-black.zip', 'android-black.zip',
    'white-18.zip', 'white-24.zip', 'white-36.zip', 'white-48.zip', 'ios-white.zip', 'android-white.zip'
];
const downloadType = async (fileType) => {
    let PromiseArray = []
    for (let category of json.categories) {
        for (let icon of category.icons) {
            for (let style of styles) {
                let url = `https://material.io/resources/icons/${json.baseUrl}${style}-${icon.id}-${fileType}`;
                PromiseArray.push(
                    new Promise(async (resolve) => {
                        try { await download(url, `./src/${fileType}/${category.name}/${icon.id}`) } catch (e) { console.log(`Not downloaded: ${url}`) };
                        resolve();
                    })
                );
            }
        }
    }
    return Promise.all(PromiseArray);
}

(async () => {
    for (let fileType of fileTypes) {
        console.log(`Downloading: ${fileType}`);
        await downloadType(fileType);
        console.log(`Downloaded: ${fileType}`);
    }
})();