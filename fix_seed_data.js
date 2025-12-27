
import fs from 'fs';

const path = 'd:/Github/Makser_makinee/seed_data.sql';
let content = fs.readFileSync(path, 'utf8');

// Generate missing IDs from 2021 to 2120
const missingIds = [];
for (let i = 2021; i <= 2120; i++) {
    // Correct order based on seed_data.sql:
    // hammadde_id, stok_adi, satis_fiyati, alis_fiyati, kalan_miktar, 
    // birim, kdv_satis, kdv_alis, grubu, ara_grubu, 
    // aktif, bilgi_kodu, kritik_stok, tedarikci_id
    missingIds.push(
        `(${i}, 'Otomatik Eksik Parça ${i}', '10', '8', '100', 'ADET', 20, 20, 'GENEL', null, 'Evet', 0, '10', 1111)`
    );
}

const insertBlock = `
INSERT INTO public.hammadde (hammadde_id, stok_adi, satis_fiyati, alis_fiyati, kalan_miktar, birim, kdv_satis, kdv_alis, grubu, ara_grubu, aktif, bilgi_kodu, kritik_stok, tedarikci_id)
VALUES
${missingIds.join(',\n')}
ON CONFLICT (hammadde_id) DO NOTHING;
`;

const insertionPoint = "-- 10. URUN RECETESI";

// Clean up previous wrong injections (simple approach: look for the start of the block we added previously)
// The previous block started with "INSERT INTO public.hammadde ... resim_url"
// We'll just replace the whole file content if we find the bad block, or just rely on overwriting if we can identify it.
// Since it's appended/prepended to a known marker, let's just create a fresh version from a clean state? 
// No, I can't easily revert.
// But I can regex replace the bad block if it exists.
const badBlockStart = "INSERT INTO public.hammadde (hammadde_id, stok_adi, satis_fiyati, alis_fiyati, kalan_miktar, birim, kdv_satis, kdv_alis, grubu, resim_url, aktif, kritik_stok, on_stok, tedarikci_id)";
if (content.includes(badBlockStart)) {
    console.log("Removing incorrect previous injection...");
    // Find where it ends. It ends with "ON CONFLICT (hammadde_id) DO NOTHING;"
    const endMarker = "ON CONFLICT (hammadde_id) DO NOTHING;";
    const startIndex = content.indexOf(badBlockStart);
    const endIndex = content.indexOf(endMarker, startIndex);

    if (startIndex !== -1 && endIndex !== -1) {
        // Remove the block including the end marker
        const before = content.substring(0, startIndex);
        const after = content.substring(endIndex + endMarker.length);
        content = before + after;
    }
}

// Check for the "Otomatik Eksik Parça" to see if we still have dirty data (maybe from manual edits or other scripts)
// If so, let's try to remove it broadly?
// Actually, checking if it exists is enough to decide whether to inject. But we want to UPDATE the injection.
// Let's just remove any block that looks like our injection.
// "Otomatik Eksik Parça" is key.
if (content.includes("'Otomatik Eksik Parça")) {
    console.log("Found existing auto-generated records, removing them to regenerate...");
    // This is tricky without a clear block boundary.
    // But we know we inserted it right before "-- 10. URUN RECETESI"
    // Let's rely on the structure we created: Block + \n\n + Marker
}

// Ideally we reload from a backup, but verify step is hard. 
// Let's try to find the insertion point and just doing the replacement again if clean.
// Since the previous attempt likely succeeded in writing the BAD block, we need to remove it.
// We tried specifically removing `badBlockStart` above.

if (content.includes(insertionPoint)) {
    // If we successfully removed the bad block, we can just inject.
    // If the bad block wasn't found (maybe specific whitespace diffs), we might append duplicate.
    // Let's check if the Bad Columns are present near the insertion point.
    // But simpler: just write the new block.

    // Safety check: ensure we don't have the bad column names
    if (!content.includes(badBlockStart)) {
        content = content.replace(insertionPoint, insertBlock + "\n\n" + insertionPoint);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully injected CORRECTED missing hammadde records into seed_data.sql");
    } else {
        console.log("Could not cleanly remove previous block. Replacing it directly.");
        // Fallback: Replace the bad block string with the new block string
        // We need to construct the exact bad block string again? Hard.
        // Let's try to slice it out using the `badBlockStart` again since we found it but maybe didn't save?
        // Ah, the code above altered `content` variable.

        // If `content` still has it (meaning the removal logic failed or wasn't triggered), we are in trouble.
        // But let's assume the removal logic above covers the exact string I wrote in step 920.

        // If we are here, and content DOES NOT have badBlockStart (because we removed it), we inject.
        // Wait, the logic structure above is: 
        // 1. Remove bad block if found.
        // 2. Inject new block.

        // Let's refine the removal logic to be safer.
        // The bad block was: 
        // `INSERT INTO public.hammadde ... tedarikci_id)\nVALUES\n...ON CONFLICT ...;`
        // It's safer to just replace `insertionPoint` BUT we duplicated `insertionPoint` in previous script!
        // Previous script: content.replace(insertionPoint, insertBlock + "\n\n" + insertionPoint);
        // So we have: [InsertBlock] [insertionPoint] [insertionPoint (original)] ? No
        // We replaced `Marker` with `Block + Marker`.
        // So we have `Block \n\n Marker`.

        // If we run this script again, we will match `Marker` again and prepend another block.
        // We should check if `insertBlock` (or characteristic string) is already there.
    }
}

// Let's do a simple robust replace: 
// 1. Read file. 
// 2. Remove ANY usage of "Otomatik Eksik Parça" lines? No, that deletes the header too if we aren't careful.
// 3. Remove the specific bad INSERT statement header.
// 4. Inject the new one.

let newContent = fs.readFileSync(path, 'utf8');

// 1. Remove the bad header if exists
const wrongHeader = "INSERT INTO public.hammadde (hammadde_id, stok_adi, satis_fiyati, alis_fiyati, kalan_miktar, birim, kdv_satis, kdv_alis, grubu, resim_url, aktif, kritik_stok, on_stok, tedarikci_id)";
if (newContent.includes(wrongHeader)) {
    // We need to remove from this header until the semi-colon.
    const parts = newContent.split(wrongHeader);
    if (parts.length > 1) {
        const afterHeader = parts[1];
        const endOfBlock = afterHeader.indexOf("ON CONFLICT (hammadde_id) DO NOTHING;");
        if (endOfBlock !== -1) {
            // Reconstruct content without this block
            newContent = parts[0] + afterHeader.substring(endOfBlock + "ON CONFLICT (hammadde_id) DO NOTHING;".length);
            // Clean up potentially left over newlines or markers
            // We likely left a double marker if we did `Block + Marker` previously?
            // Actually, previous script replaced `Marker` with `Block + Marker`.
            // So removing block leaves `Marker`. 
            // So we are back to original state? Ideally yes.
        }
    }
}

// 2. Inject new block
if (newContent.includes(insertionPoint)) {
    // Only inject if we don't already have the GOOD block
    const goodHeader = "INSERT INTO public.hammadde (hammadde_id, stok_adi, satis_fiyati, alis_fiyati, kalan_miktar, birim, kdv_satis, kdv_alis, grubu, ara_grubu, aktif, bilgi_kodu, kritik_stok, tedarikci_id)";
    if (!newContent.includes(goodHeader)) {
        newContent = newContent.replace(insertionPoint, insertBlock + "\n\n" + insertionPoint);
        fs.writeFileSync(path, newContent, 'utf8');
        console.log("Fixed schema and injected records.");
    } else {
        console.log("Good block already present.");
    }
}

