import * as fs from 'fs';
import fetch from 'node-fetch';
import isequal from 'lodash.isequal';
import download from 'download';

(async () => {
  const metadata = await (async () => {
    const text = await (await fetch('https://fonts.google.com/metadata/icons')).text();
    return JSON.parse(text.substring(text.indexOf("\n") + 1));
  })();

  const fileTypes = [
    '24px.svg',
    'black-18dp.zip', 'black-24dp.zip', 'black-36dp.zip', 'black-48dp.zip', 'black-ios.zip', 'black-android.zip',
    'white-18dp.zip', 'white-24dp.zip', 'white-36dp.zip', 'white-48dp.zip', 'white-ios.zip', 'white-android.zip'
  ];

  const downloadFileType = async (fileType) => {
    let allDownloaded = true;
    const PromiseArray = metadata.icons.flatMap(icon =>
      metadata.families.map(family =>
        new Promise(async resolve => {
          const familyName = family.replace(/Material Icons/, '').replace(/ /g, '').toLowerCase();
          const url = `https://fonts.gstatic.com/s/i/materialicons${familyName}/${icon.name}/v${icon.version}/${fileType}`;
          const retryLimit = 100;
          let retryCount = 0;
          while (retryCount < retryLimit) {
            try {
              await download(url, `./src/${fileType}/${icon.categories[0]}/${icon.name}`, { filename: `${familyName + (familyName ? '-' : '')}${icon.name}-${fileType}` });
              break;
            } catch (e) {
              retryCount++;
            }
          }
          if (retryCount === retryLimit) {
            allDownloaded = false;
            console.log(`Not downloaded: ${url}`);
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

  if (fs.existsSync('icons.json') && isequal(JSON.parse(fs.readFileSync('icons.json', 'utf8')), metadata)) {
    console.log('No changes found in https://fonts.google.com/metadata/icons');
    return;
  }

  process.stdout.write(`Deleting old src folder`);
  fs.rmdirSync('./src', { recursive: true });
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`Deleted old src folder\n`);

  for (const fileType of fileTypes) {
    await downloadFileType(fileType);
  }

  fs.writeFileSync('icons.json', JSON.stringify(metadata));
})();
