var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require("fs");

var conf = require('./conf');

app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", "*");
    if (req.method == 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(conf.app.port);

module.exports = {
    app: app,
    conf: conf
}