// db.js
import Dexie from 'dexie';

const db = new Dexie('SlackCollectorDB');

db.version(1).stores({
  channels: 'id, name, team',
  posts: 'id, channelId, html',
  threads: 'id, channelId, html',
});

export default db;