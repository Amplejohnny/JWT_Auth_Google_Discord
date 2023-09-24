const mongoose = require('mongoose');
function connect() {
    const {DB_HOST, DB_PORT, DB_NAME} = process.env;
  
    mongoose
      .connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log('Successfully connected to the database');
      })
      .catch((error) => {
        console.log('Database connection failed. Exiting now...');
        console.error(error);
        process.exit(1);
      });
  }

  module.exports = connect;



// const {DB_HOST, DB_PORT, DB_NAME} = process.env;
// const connectionString = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
// const options = {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// };
// mongoose.connect(connectionString, options);
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', () => console.log(`Connected to the database`));