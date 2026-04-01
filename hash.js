const bcrypt = require("bcrypt");

// bcrypt.hash("super$admin", 10).then((hash) => {
//   console.log(hash);
// });

bcrypt.hash("789456", 10).then((hash) => {
  console.log(hash);
});