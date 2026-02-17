const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const redeemRoutes = require("./route/redemption")
const surveyRoutes = require("./route/survey");
const speciality = require('./models/speciality');
const specialityRoutes = require('./route/specialityRoutes');
require('dotenv').config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))


app.use(cors());

app.use('/api/auth', require('./route/auth'));
app.use('/api/dashboard', require('./route/dashboard'));
app.use('/api/surveys', surveyRoutes); // Corrected route prefix
app.use("/api/redemption", redeemRoutes);
app.use('/api/specialities', specialityRoutes); // Added speciality routes

//console.log("Speciality route mounted");



mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  // console.log('Connected to MongoDB', mongoose.connection.name);
})
.catch((error) => {
  //console.error('Error connecting to MongoDB:', error);
});


// app.get('/', (req, res) => {
//   res.send('server is running with mongoDB');
// });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {   console.log(`Server is running on port ${PORT}`);
});

//  const PORT = process.env.PORT || 3000;
//  app.listen(PORT, () => {   console.log(`Server is running on port ${PORT}`);
// });

module.exports = app;