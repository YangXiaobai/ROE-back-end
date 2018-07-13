var http = require('http');
var fs = require('fs');
var conf = require('../conf');
var webpush = require('web-push');

function EndUser(sys) {

    this.sys = sys;

}

let userList = {},
    counts = 0;

EndUser.prototype.init = function() {

    var _this = this;

    var app = require('http').createServer(handler);
    var io = require('socket.io')(app);

    app.listen(3000);

    function handler(req, res) {
        fs.readFile(__dirname + '/index.html',
            function(err, data) {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading index.html');
                }
                res.writeHead(200);
                res.end(data);
            });
    }

    let clearData = function() {

        userList = {};

        counts = 0;

    };

    io.on('connection', function(socket) {

        let socketId = socket.id;

        socket.on('disconnect', function() {

            console.log('disconnected:', counts);

            if (userList[socketId]) {

                delete userList[socketId];

                counts--;

                if (!counts) {
                    clearData();
                }

            }

        });

        _this.sys.app.post('/score', function(req, res) {

            var data = req.body;

            if (data) {

                var score = data.score;

                userList[data.userInfo.id] = {
                    score: score,
                    name: data.userInfo.name
                };

                let list = {
                    userList: userList
                }

                let userLength = 0;

                for(let i in userList){
                    if(userList[i] != -1){
                        userLength++;
                    }
                }

                if (userLength == counts) {

                    let total = 0;

                    for (let i in userList) {
                        if(userList[i] != -1){

                            total += Number(userList[i].score);

                        }
                    }

                    let average = total / userLength;

                    let options = [1, 3, 5, 8, 13, 21];

                    for (let i = 0; i < options.length; i++) {
                        let prev = average - options[i],
                            next = options[i + 1] - average;
                        if (prev >= 0 && next >= 0) {
                            var sysScore = prev < Math.abs(next) ? options[i] : options[i + 1];
                            break;
                        }
                    }

                    list.sysScore = sysScore;

                    list.isAll = 1;

                }

                socket.broadcast.emit('list', JSON.stringify(list));

                res.send(list);

            } else {

                res.sendStatus(400);

            };

        });

        _this.sys.app.post('/voter', function(req, res) {

            var data = req.body;

            if (data) {

                let id = data.id;

                userList[id] = -1;

                counts++;

                console.log('connected:', counts);

                res.sendStatus(200);

            }

        });

        _this.sys.app.post('/observer', function(req, res) {

            var data = req.body;

            if (data) {

                let id = data.id;

                res.sendStatus(200);

            }

        });

        _this.sys.app.get('/reset', function(req, res) {

            for(let i in userList){

                userList[i] = -1;

            }

            socket.broadcast.emit('reset', 'reset');

            res.sendStatus(200);

        });

    });

};

module.exports = EndUser;