import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import db from './db'; // your Dexie DB instance

export async function exportDBToZip() {
  const zip = new JSZip();

  // List of tables to export
  const tables = ['channels', 'posts', 'threads'];

  for (const tableName of tables) {
    const data = await db.table(tableName).toArray();
    const json = JSON.stringify(data, null, 2);
    zip.file(`${tableName}.json`, json);
  }

  // Generate and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'SlackCollectorDB.zip');
}