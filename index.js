// const host = 'https://icacto.herokuapp.com';
const host = 'http://localhost:3000';

var icacto = require('./icacto');

icacto.connect(host, undefined, function(err, user) {
  icacto.run();
})
