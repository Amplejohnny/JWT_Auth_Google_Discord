const http = require('http');
const app = require('./app');

const {API_PORT} = process.env;

const server = http.createServer(app);
server.listen(API_PORT, () => {
  console.log(`Server running on port ${API_PORT}`);
});