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

    var app = require('https').createServer(handler);
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

    io.on('connection', function(socket) {

        let id = socket.id;

        counts++;

        console.log('connected: ');
        console.log(counts);

        socket.on('disconnect', function() {

            counts--;
            console.log('disconnected: ');
            console.log(counts);

            if (userList[id]) {

                delete userList[id];

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

                let userLength = Object.keys(userList).length;

                if (userLength == counts) {

                    let total = 0;

                    for (let i in userList) {
                        total += Number(userList[i].score);
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

        _this.sys.app.post('/push', function(req, res) {

            let scription = req.body;

            scription.endpoint = 'http://localhost:8080/dpTKjWf1VJg:APA91bHa9OJddbWq-4nZab2B1kiyS4ibs8nIohr67_7VFtBWAZ7RuWxYZt3-8ZslyHkUGuWEnGRc7tx4HITDbR8lMiI3v7DtbUbmxzky9Xad6qBjQaGBBDbGSbb_HvLf7mX7YLKi7Gih_69m1Og2O0BjiWhiQcIYFA'

            console.log(scription);
            
            webpush.sendNotification(scription, 'test').then(function(res){
                console.log(res);
            }).catch(error => {
                console.error(error.stack);
            });

        });

        _this.sys.app.get('/reset', function(req, res) {

            userList = {};

            socket.broadcast.emit('reset', 'reset');

            res.sendStatus(200);

        });

    });

};

module.exports = EndUser;