// appwrite.js
const { Client, Databases } = require("node-appwrite");

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("68ebb809003e6a0121ab")
  .setKey(
    "standard_c417344b9b41b164f6ca7e4631db18761c0445ecb61e336cb58045634f4b9a75852d1252566fa880e20c00f4cd0288fcad6d41e9ca17577a536957407b313e33b237fd10fc075a97f4cb1b4e84afe2735df306c6a562e1d6b95acfa4424a7e2d5bc559685ef806abcfedb785e4102e1fc73363b2eda3e957eb1b94160c112aee"
  );

const databases = new Databases(client);

module.exports = { databases };
