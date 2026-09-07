import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '..', 'public', 'assets', 'backgrounds');
const outputDir = path.join(__dirname, '..', 'public', 'assets', 'backgrounds');

fs.readdirSync(inputDir)
    .filter(file => {
    const isPng = path.extname(file).toLowerCase() === '.png';
    const startsWithBg = file.toLowerCase().startsWith('background');
    return isPng && startsWithBg;
    })
    .forEach(file => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, `${path.parse(file).name}.webp`);

    sharp(inputPath)
        .webp({quality: 85, effort: 6})
        .toFile(outputPath)
        .then(() => console.log(`'Converted to webp: ${file}'`))
        .catch(err => console.error(`Converted fail: ${file}`))
    });