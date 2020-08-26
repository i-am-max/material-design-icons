import fs from 'fs';
import path from 'path';
import download from 'download';
import decompress from 'decompress';
import fetch from 'node-fetch';
import opentype from 'opentype.js';
import _ from 'lodash';

(async () => {
  // Download icon font
  const downloadIconFont = async () => {
    const filename = 'icon-font.zip';
    const destination = 'src/icon-font';
    return fs.promises.rmdir(destination, { recursive: true })
      .then(() => download('https://fonts.google.com/download?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Sharp|Material+Icons+Round|Material+Icons+Two+Tone', destination, { filename: filename }))
      .then(() => decompress(`${destination}/${filename}`, destination))
      .then(() => console.log(`Downloaded: icon font`));
  };
  await downloadIconFont();

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

  const newIcons = (() => {
    if (!fs.existsSync('icons.json')) {
      return metadata.icons;
    } else {
      const oldMetadata = JSON.parse(fs.readFileSync('icons.json', 'utf8'));
      return metadata.icons.filter(icon => {
        if (typeof oldMetadata.icons.find(oldIcon => (oldIcon.name === icon.name && oldIcon.version === icon.version)) === 'undefined') return true;
        else return false;
      });
    }
  })();

  const fileTypes = [
    '24px.svg',
    'black-18dp.zip', 'black-24dp.zip', 'black-36dp.zip', 'black-48dp.zip', 'black-ios.zip', 'black-android.zip',
    'white-18dp.zip', 'white-24dp.zip', 'white-36dp.zip', 'white-48dp.zip', 'white-ios.zip', 'white-android.zip'
  ];

  const notDownloaded = [];

  const downloadFileType = async (fileType) => {
    let downloadedCount = 0;
    process.stdout.write(`Downloading: ${fileType}`);
    const PromiseArray = [...newIcons, ...removedIcons].flatMap(icon =>
      metadata.families.map(async family => {
        for (let version = icon.version; version > 0; version--) {
          const familyName = family.replace(/Material Icons/, '').replace(/ /g, '').toLowerCase();
          const destination = `./src/${fileType}/${icon.categories[0]}/${icon.name}/v${version}`;
          const filename = `${familyName + (familyName ? '-' : '')}${icon.name}-v${version}-${fileType}`;
          // Only download file if it doesn't exist
          if (!fs.existsSync(path.resolve(destination, filename))) {
            const url = `https://fonts.gstatic.com/s/i/materialicons${familyName}/${icon.name}/v${version}/${fileType}`;
            const retryLimit = 100;
            let retryCount = 0;
            while (retryCount < retryLimit) {
              try {
                await download(url, destination, { filename: filename });
                break;
              } catch (error) {
                if (error.statusCode === 404) break;
                else retryCount++;
              }
            }
            if (retryCount === retryLimit) notDownloaded.push(url);
          }
        }
        downloadedCount++;
        process.stdout.cursorTo(0);
        // https://stackoverflow.com/a/59805130/11077662
        process.stdout.clearLine(1);
        // PromiseArray may not be initialized yet
        try { process.stdout.write(`Downloading: ${fileType} ${downloadedCount}/${PromiseArray.length}`); } catch (e) { }
      })
    );
    await Promise.all(PromiseArray);
    process.stdout.cursorTo(0);
    process.stdout.clearLine(1);
    console.log(`Downloaded: ${fileType}`);
  };

  if (newIcons.length === 0) {
    console.log('No changes found in https://fonts.google.com/metadata/icons');
  } else {
    console.log(`New/modified icons since last download: ${newIcons.map(icon => icon.name).join(', ')}`);
    for (const fileType of fileTypes) {
      await downloadFileType(fileType).catch(console.error);
    }
    fs.writeFileSync('icons.json', JSON.stringify(metadata));
  }
  console.log(`Download completed ${notDownloaded.length === 0 ? 'successfully' : `with errors\nNot downloaded:\n${notDownloaded.join('\n')}`}`);
})();
