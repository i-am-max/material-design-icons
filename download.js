import * as fs from 'fs';
import fetch from 'node-fetch';
import opentype from 'opentype.js';
import _ from 'lodash';
import download from 'download';

(async () => {
  const metadata = await (async () => {
    const text = await (await fetch('https://fonts.google.com/metadata/icons')).text();
    return JSON.parse(text.substring(text.indexOf("\n") + 1));
  })();

  // Get list of removed icons from font ligatures of MaterialIcons-Regular.ttf
  const removedIcons = (() => {
    const font = opentype.loadSync('./src/icon-font/Material_Icons/MaterialIcons-Regular.ttf');
    const invertedGlyphIndexMap = _.invert(font.tables.cmap.glyphIndexMap);
    const ligatures = font.tables.gsub.lookups.flatMap(lookup =>
      lookup.subtables.flatMap(subtable => {
        const coverage = subtable.coverage.ranges.flatMap(range => _.range(range.start, range.end + 1).map(i => String.fromCharCode(parseInt(invertedGlyphIndexMap[i]))));
        return subtable.ligatureSets.flatMap((ligatureSet, ligatureSetIndex) =>
          ligatureSet.map(ligature => `${coverage[ligatureSetIndex]}${ligature.components.map(component => String.fromCharCode(parseInt(invertedGlyphIndexMap[component]))).join('')}`)
        );
      })
    );
    // Remove duplicates with Set constructor and spread syntax 
    return [...new Set(ligatures)]
      .filter(ligature => !metadata.icons.find(icon => icon.name === ligature))
      .map(iconName => ({ name: iconName, version: 20, categories: ['removed'] })); // Start downloading from version 20, end at version 1
  })();

  const fileTypes = [
    '24px.svg',
    'black-18dp.zip', 'black-24dp.zip', 'black-36dp.zip', 'black-48dp.zip', 'black-ios.zip', 'black-android.zip',
    'white-18dp.zip', 'white-24dp.zip', 'white-36dp.zip', 'white-48dp.zip', 'white-ios.zip', 'white-android.zip'
  ];

  const downloadFileType = async (fileType) => {
    let allDownloaded = true;
    const PromiseArray = [...removedIcons, ...metadata.icons].flatMap(icon =>
      metadata.families.map(family =>
        new Promise(async resolve => {
          for (let version = icon.version; version > 0; version--) {
            const familyName = family.replace(/Material Icons/, '').replace(/ /g, '').toLowerCase();
            const url = `https://fonts.gstatic.com/s/i/materialicons${familyName}/${icon.name}/v${version}/${fileType}`;
            const retryLimit = 100;
            let retryCount = 0;
            while (retryCount < retryLimit) {
              try {
                await download(url, `./src/${fileType}/${icon.categories[0]}/${icon.name}/v${version}`, { filename: `${familyName + (familyName ? '-' : '')}${icon.name}-${fileType}` });
                break;
              } catch (error) {
                if (error.statusCode === 404) break;
                else retryCount++;
              }
            }
            if (retryCount === retryLimit) {
              allDownloaded = false;
              console.log(`Not downloaded: ${url}`);
            }
          }
          resolve();
        })
      )
    );
    process.stdout.write(`Downloading: ${fileType}`);
    await Promise.all(PromiseArray);
    if (allDownloaded) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
    }
    process.stdout.write(`Downloaded: ${fileType}\n`);
  };

  if (fs.existsSync('icons.json') && _.isEqual(JSON.parse(fs.readFileSync('icons.json', 'utf8')), metadata)) {
    console.log('No changes found in https://fonts.google.com/metadata/icons');
    return;
  }

  for (const fileType of fileTypes) {
    await downloadFileType(fileType);
  }

  fs.writeFileSync('icons.json', JSON.stringify(metadata));
})();
