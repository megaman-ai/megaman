// db.js
import Dexie from 'dexie';

const db = new Dexie('SlackCollectorDB');

db.version(1).stores({
  channels: '++id, name, channelId',
  posts: '++id, channelId, postId, html, text',
  threads: '++id, channelId, threadId, html, text',
});

export default db;