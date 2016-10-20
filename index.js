const host = 'https://icacto.herokuapp.com';
// const host = 'http://localhost:3000';

var icacto = require('./icacto');

icacto.connect(host, "51aede49-1fc0-4f3b-9cb0-3ea5a1971f8c", function(err, user) {
  icacto.run();
})
