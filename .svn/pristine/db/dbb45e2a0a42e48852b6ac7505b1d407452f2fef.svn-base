var request = require("request");

var options = { method: 'GET',
  url: 'http://106.15.92.51/hapi/test',
  headers: 
   { 'Postman-Token': '45f04ddc-59b1-1ec9-230d-5aa977b69039',
     'Cache-Control': 'no-cache',
     'Content-Type': 'application/json' },
  body: { word: 'word', level: 'level', explanation: [ 'explanation' ] },
  json: true };

var i = 0;
setInterval(() => request(options, function (error, response, body) {
  if (error) throw new Error(error);
  i++;
  console.log(i);
}), 500);
