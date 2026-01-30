const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const redeemRoutes = require("./route/redemption")
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use('/api/auth', require('./route/auth'));
app.use('/api/dashboard', require('./route/dashboard'));
app.use('/api/survey', require('./route/survey'));
app.use("/api/redemption", require("./route/redemption"));



mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});


app.get('/', (req, res) => {
  res.send('server is running with mongoDB');
});

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

module.exports = app;