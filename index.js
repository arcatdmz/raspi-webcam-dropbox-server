var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
require('datejs');

var Dropbox = require('dropbox');
var config = require('./config');

var dbx = new Dropbox({ accessToken: config.accessToken });

var http = require("http");
var url = require("url");

var server = http.createServer(function (req, res) {
  var parsed = url.parse(req.url);
  console.log("incoming request:", parsed.pathname);
  if (parsed.pathname === "/") {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<html><body><img src="/api/take-picture"/></body></html>');
    res.end();
    return;
  }
  if (parsed.pathname === "/api/take-picture") {
    var date = new Date();
    var fileName = date.toString(config.fileName);
    takePicture(fileName, date, function (data) {
      res.writeHead(200, {"Content-Type": "image/jpeg"});
      res.end(data);
    })
    return;
  }
  res.writeHead(404, {"Content-Type": "text/plain"});
  res.write("404 Not Found");
  res.end();
});

server.listen(config.port);
console.log("starting a web server");

function takePicture(fileName, date, callback) {
  console.log('taking a picture');
  var filePath = path.join(config.directory, fileName);
  exec("fswebcam -d /dev/video0 -r 1920x1080 --no-banner '" + filePath + "'",
      function(err, stdout, stderr) {
    var data = fs.readFileSync(filePath);
    if (typeof config.accessToken === "string") {
      console.log('saving it to Dropbox');
      dbx.filesUpload({
        path: "/" + fileName,
        autorename: true,
        client_modified: date.toString("yyyy-MM-ddTHH:mm:ssZ"),
        contents: data
      })
      .then(function(response) {
        console.log('done:', response.path_display);
      })
      .catch(function(res) {
        console.log('error:', res.error);
      });
    }
    if (callback) callback(data);
  });
}
