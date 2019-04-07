const fs = require('fs');
const process = require('process');
const download = require('download');

const styles = ['baseline', 'outline', 'round', 'twotone', 'sharp'];
const fileTypes = [
    '24px.svg',
    'black-18.zip', 'black-24.zip', 'black-36.zip', 'black-48.zip', 'ios-black.zip', 'android-black.zip',
    'white-18.zip', 'white-24.zip', 'white-36.zip', 'white-48.zip', 'ios-white.zip', 'android-white.zip'
];
const ft = process.argv[2];

fs.readFile('./data.json', (err, data) => {
    let json = JSON.parse(data);
    for (let c in json.categories) {
        for (let i in json.categories[c].icons) {
            for (let s in styles) {
                try { download(`https://material.io/tools/icons/${json.baseUrl}${styles[s]}-${json.categories[c].icons[i].id}-${fileTypes[ft]}`, `./src/${fileTypes[ft]}/${json.categories[c].name}/${json.categories[c].icons[i].id}`).then(() => {}); } catch (e) {};
            }
        }
    }
});