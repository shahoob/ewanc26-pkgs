import * as fs from 'fs';
import * as path from 'path';
import type { PlayRecord } from '../types.js';
import type { ListenBrainzRecord } from '../core/types.js';
import { convertListenBrainzToPlayRecord as coreConvert, isListenBrainzListen } from '../core/listenbrainz.js';

import { buildClientAgent } from '../config.js';

/**
 * Parse ListenBrainz JSON export — Node CLI wrapper
 * Supports not only single files and directories with multiple JSON files, but also `.zip` exports.
 * 
 * @remarks
 * ListenBrainz uses .jsonl officially so it would be weird to also not abide their standards.
 * It's just denoting that the JSON file has multiple records splitted by a newline.
 */
export function parseListenBrainzJson(filePathOrDir: string): ListenBrainzRecord[] {
    console.log(`Reading ListenBrainz export: ${filePathOrDir}`);

    const stats = fs.statSync(filePathOrDir);
    let allRecords: ListenBrainzRecord[] = [];

    if (stats.isDirectory()) {
        // Read all JSONL files in the directory
        const files = (fs.readdirSync(filePathOrDir, { recursive: true }) as string[])
            .filter(f => f.endsWith('.jsonl'))
            .map(f => path.join(filePathOrDir, f));

        console.log(`Found ${files.length} ListenBrainz JSON files in directory`);

        for (const file of files) {
            const fileContent = fs.readFileSync(file, 'utf-8');
            const rawRecords = fileContent.split(/\r?\n/).map(l => l.trim()).filter(p => p);
            for (const r of rawRecords) {
                const record = JSON.parse(r) as object;
                if (isListenBrainzListen(record)) allRecords.push(record);
            }
        }
    } else {
        // Single file
        if (path.extname(filePathOrDir) === '.jsonl') {
            const fileContent = fs.readFileSync(filePathOrDir, 'utf-8');
            const rawRecords = fileContent.split('\n');
            for (const r of rawRecords) {
                if (!r) continue;
                const record = JSON.parse(r) as object;
                if (isListenBrainzListen(record)) allRecords.push(record);
            }
        } else if (path.extname(filePathOrDir) === '.zip') {
            // ListenBrainz data export File
            // TODO: Implement support for reading these files.
        }
    }

    return allRecords;
}

export function convertListenBrainzToPlayRecord(record: ListenBrainzRecord): PlayRecord {
    return coreConvert(record, buildClientAgent());
}
