const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');

// Crappy documentation:
// npm install
// Example usage: `node converter.js MTG/AFRDraftDeckSideboard.csv`

// BUG: Dual sided cards are exported twice by dragon shield, these need to be cleaned up
//      otherwise they're imported twice. See how they appear twice in an exported CSV. Maybe go off set code or duplicate card number?
//      I.e. if card number is the same and there's no other differences, ignore.
// BUG: Tokens don't import correctly. Might need to shave off the " Token" suffix and update the
//      set code to be AFR instead of TAFR for example

const columns = [
  'Count',
  'Name',
  'Edition',
  'Condition',
  'Language',
  'Foil',
  'Collector Number',
];

function transformCondition(condition) {
  // Mint and Played stay the same
  switch (condition) {
    case 'NearMint':
      return 'Near Mint';
    case 'Excellent':
      return 'Near Mint';
    case 'Good':
      return 'Lightly Played';
    case 'LightPlayed':
      return 'Lightly Played';
    case 'Poor':
      return 'Damaged';
  }
}

function transformFoil(foil) {
  if (foil === 'true') {
    return 'foil';
  } else {
    return ''; // blank for no foil
  }
}

function convertDragonShieldToMoxfield() {
  const path = process.argv[2];
  const filename = path.split('\\').pop().split('/').pop();
  const data = [];
  fs.createReadStream(path)
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', (row) => {
      const count = row[0];
      const name = row[1];
      const edition = `${row[3]}`.toLocaleUpperCase();
      const condition = transformCondition(row[7]);
      const language = row[8];
      const foil = transformFoil(row[6]);
      const collectorNumber = row[2];

      data.push([
        count,
        name,
        edition,
        condition,
        language,
        foil,
        collectorNumber,
      ]);
    })
    .on('end', () => {
      const writeableStream = fs.createWriteStream(`converted_${filename}`);
      const stringifier = stringify({ header: true, columns });
      data.forEach((row) => {
        stringifier.write(row);
      });
      stringifier.pipe(writeableStream);
      console.log('finished');
    })
    .on('error', (error) => {
      console.log('something broke', error.message);
    });
}

convertDragonShieldToMoxfield();
