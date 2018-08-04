// app.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('hello http');
})

let etag = 0;
app.get('/test', (req, res) => {
  etag++;
  res.set('ETag', etag);
  res.send('ETag');
})

app.listen(3000, () => {
  console.log('The server is running at http://127.0.0.1:3000/')
})