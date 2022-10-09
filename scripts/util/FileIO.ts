import { writeFile } from 'fs';

export const writeToFile = (
    list: string[],
    maxItemsPerWrite: number,
    outputFile: string
) => {
    /** Write them in batches of 5000 */
    let data = '';
    for (let i = 0; i < list.length; ++i) {
        data += list[i] + '\r\n';
        if (i > 0 && i % maxItemsPerWrite === 0) {
            console.log(`Writing ${maxItemsPerWrite} to file (${i} total)!`);
            writeFile(outputFile, data, { flag: 'a+'}, err => {
                if (err) {
                    console.log(`Failed to write signatures to file`);
                }
            })
            data = '';
        }
    }
    if (data) {
        writeFile(outputFile, data, { flag: 'a+'}, err => {
            console.log(`Writing last items to file!`);
            if (err) {
                console.log(`Failed to write signatures to file`);
            }
        })
    }
}