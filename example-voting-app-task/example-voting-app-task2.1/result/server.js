const e = require('express');

let express = require('express'),
  async = require('async'),
  pg = require('pg'),
  { Pool } = require('pg'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  app = express(),
  server = require('http').Server(app),
  io = require('socket.io')(server);

io.set('transports', ['polling']);


io.sockets.on('connection', function (socket) {

  socket.emit('message', { text: 'Welcome!' });

  socket.on('subscribe', function (data) {
    socket.join(data.channel);
  });
});

let pool = new pg.Pool({
  connectionString: 'postgres://postgres:postgres@db/postgres'
});

let port = process.env.PORT || 4000;
let period;
let period_global;
let period_time;

// get votes with period
function getVotes(client, period_time, period) {
  if (period_global !== period_time) {
    return;
  }
  console.log("period_time in getVotes(): " + period_time);
  console.log("period in getVotes(): " + period);
  const cur_time = Math.floor(new Date().getTime() / 1000);
  if (period_time !== 0) {
    console.log("period time is not zero in getVotes()")
    client.query(`SELECT vote, COUNT(id) AS count FROM votes WHERE ${cur_time} - time <= ${period_time} GROUP BY vote`, [], function (err, result) {
      if (err) {
        console.error("Error performing query: " + err);
      } else {
        let votes = collectVotesFromResult(result, period);
        io.sockets.emit("scores", JSON.stringify(votes));
      }
      setTimeout(function () {
        getVotes(client, period_time, period);
      }, 1000);
    });
  }

}

// collet vote result including period in string
function collectVotesFromResult(result, period) {
  let tem;
  if (period !== 0) {
    switch (period.charAt(period.length - 1)) {
      case "d":
        let day = period.split("d")[0];
        if (day == 1) {
          tem = 1 + " day";
        }
        else tem = day + " days";
        break;
      case "h":
        let hour = period.split("h")[0];
        if (hour == 1) {
          tem = 1 + " hour";
        } else {
          tem = hour + " hours";
        }
        break;
      case "m":
        let minute = period.split("m")[0];
        if (minute == 1) {
          tem = 1 + " minute";
        }
        else {
          tem = minute + " minutes";
        }
        break;
      default:
        break;
    }
  }
  let votes = { a: 0, b: 0, period: tem };
  result.rows.forEach(function (row) {
    votes[row.vote] = parseInt(row.count);
  });
  return votes;
}

// set period string to period seconds
function setPeriodTime(period) {
  let tem;
  switch (period.charAt(period.length - 1)) {
    case "d":
      let day = period.split("d")[0];
      tem = 60 * 60 * 24 * day;
      break;
    case "h":
      let hour = period.split("h")[0];
      tem = 60 * 60 * hour;
      break;
    case "m":
      let minute = period.split("m")[0];
      tem = 60 * minute;
      break;
    default:
      break;
  }
  return tem;
}

app.use(cookieParser());
app.use(bodyParser());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});

app.use(express.static(__dirname + '/views'));

app.get('/', function (req, res) {
});

// handle url with period parameter
app.get('/period?', function (req, res) {
  period = req.query.period;
  period_time = setPeriodTime(period);
  period_global = period_time;
  async.retry(
    { times: 1000, interval: 1000 },
    function (callback) {
      pool.connect(function (err, client, done) {
        if (err) {
          console.error("Waiting for db");
        }
        callback(err, client);
      });
    },
    function (err, client) {
      if (err) {
        return console.error("Giving up");
      }
      console.log("Connected to db");
      getVotes(client, period_time, period);
    }
  );
  res.sendFile(path.resolve(__dirname + '/views/index.html'));
});

server.listen(port, function () {
  let port = server.address().port;
  console.log('App running on port ' + port);
});
