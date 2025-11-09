// appwrite.js
const { Client, Databases, Storage, ID, InputFile, Query } = require("node-appwrite");
require("dotenv").config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

module.exports = { client, databases, storage, ID, InputFile, Query };
