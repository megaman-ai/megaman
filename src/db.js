// db.js
import Dexie from 'dexie';

const db = new Dexie('Megaman');

db.version(1).stores({
  webpage: 'id, title, icon, bannerImage, metadata, source', // id is url, source is recognized page category for example "JIRA", "slack", "confluence"
  messengerChannels: 'id, name, team, webpageId', // id is channelId, name is channel name, team is the teamId
  messengerPosts: 'id, channelId, html, type', // type is either post or thread, id is either postId or threadId
  assets: 'id, type', // id is unique fileKey, could be original URL
  files: '',
});

export default db;