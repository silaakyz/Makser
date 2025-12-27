
import fs from 'fs';

const files = [
    'setup_base.sql',
    'seed_data.sql',
    'add_oee_columns.sql',
    'realistic_production_data.sql'
];

let finalContent = '';

files.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`Reading ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        finalContent += `\n\n-- START OF ${file} --\n\n`;
        finalContent += content;
        finalContent += `\n\n-- END OF ${file} --\n\n`;
    } else {
        console.warn(`File not found: ${file}`);
    }
});

fs.writeFileSync('FINAL_DB_SETUP_CLEAN.sql', finalContent, 'utf8');
console.log('FINAL_DB_SETUP_CLEAN.sql created successfully with UTF-8 encoding.');
