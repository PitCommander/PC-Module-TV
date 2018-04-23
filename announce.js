var vol = require('vol');
var fs = require('fs');
var zmq = require('zeromq');

var teamNum = 401;
var tz = "America/New_York";

//Real address to use: 10.0.0.1
var CURRENT_IP = '127.0.0.1';

var tv = document.querySelector('tv-app');
var timerView = document.querySelector('timer-view');
var scheduleView = document.querySelector('schedule-view');
var streamView = document.querySelector('stream-view');
var ranksView = document.querySelector('ranks-view');

var reqSock = zmq.socket('req')
reqSock.connect('tcp://' + CURRENT_IP + ':5801')
reqSock.on('message', function (message) {
    tv = document.querySelector('tv-app');
    timerView = document.querySelector('timer-view');
    scheduleView = document.querySelector('schedule-view');
    streamView = document.querySelector('stream-view');

    messageObj = JSON.parse(message);
    let data = messageObj.payload;
    let schema = [];

    switch (messageObj.id) {
        case 'GENERALC_DATA':
            try {
                generalContainerHandler(data);
            } catch (err) {
            }
            break;
        case 'MATCH_DATA':
            try {
                matchContainerHandler(data)
            } catch (err) {
            }
            break;
        case 'TV_DATA':
            try {
                tvHandler(data);
            } catch (err) {
            }
            break;
        case 'RANKS_DATA':
            try {
                ranksContainerHandler(data);
            } catch (err) {
            }
            break;
    }
});

var subSock = zmq.socket('sub');
subSock.connect('tcp://' + CURRENT_IP + ':5800');
subSock.subscribe('');
subSock.on('message', function (message) {
    tv = document.querySelector('tv-app');
    timerView = document.querySelector('timer-view');
    scheduleView = document.querySelector('schedule-view');
    streamView = document.querySelector('stream-view');

    var messageObj = JSON.parse(message);
    var data = messageObj.payload;
    let schema = [];

    switch (messageObj.id) {
        case 'TimeTick':
            try {
                timeTickHandler(data);
            } catch (err) {
            }
            break;
        case 'MatchContainerUpdate':
            data = data.container;
            try {
                matchContainerHandler(data)
            } catch (err) {
            }
            break;
        case 'TvContainerUpdate':
            data = data.container
            try {
                tvHandler(data, tv);
            } catch (err) {
            }
            break;
        case 'GeneralContainerUpdate':
            data = data.container;
            try {
                generalContainerHandler(data);
            } catch (err) {
            }
            break;
        case 'RankContainerUpdate':
            data = data.container.rankings;
            schema = data.container.scema;

            console.log("rank data")
            try {
                ranksContainerHandler(data, schema);
            } catch (err) {
            }
            break;
    }
});

function timeTickHandler(data) {
    var seconds = data.timeToZero % 60;
    var minutes = Math.floor(data.timeToZero / 60);
    var hours = Math.floor(minutes / 60);
    var timeString = '';

    if (hours !== 0) {
        minutes = minutes % 60;
        timeString = hours + 'h ' + minutes + 'm ' + seconds + 's';
    } else {
        timeString = minutes + 'm ' + seconds + 's';
    }

    timerView.ttz = timeString;
}

function matchContainerHandler(data) {
    timerView.nextNum = data.currentMatch.matchNumber;

    scheduleView.record = data.wins + "-" + data.losses + "-" + data.ties;
    timerView.bumperColor = data.currentMatch.bumperColor.toLocaleLowerCase();
    timerView.allies = data.currentMatch.allies.filter(ignoreOurTeam);
    timerView.oppo = data.currentMatch.opponents;

    var date = new Date(data.currentMatch.scheduledTime * 1000);
    var predictedDate = new Date(data.currentMatch.predictedTime * 1000);

    timerView.scheduledTime = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz
    });
    timerView.predictedTime = predictedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz
    });

    var schedule = data.schedule;

    schedule.forEach(function (e) {
        var schedDate = new Date(e.scheduledTime * 1000);
        var predDate = new Date(e.predictedTime * 1000);

        var schedString = schedDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: tz
        });

        var predString = predDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: tz
        });

        e.schedString = schedString;
        e.predString = predString;
        e.allyString = e.allies.filter(ignoreOurTeam).join(', ');
        e.oppoString = e.opponents.join(', ');

        var result = "";


        if (e.bumperColor === e.winner) {
            result = "WIN"
        }

        if (e.bumperColor !== e.winner) {
            result = "LOSS"
        }

        if (e.winner === "TIE") {
            result = "TIE";
        }

        if (e.redScore === -1) {
            result = ""
        }
        e.result = result;

        if (e.redScore === -1) {
            e.redScore = "";
            e.blueScore = "";
        }
    });

    scheduleView.data = schedule;
}

function generalContainerHandler(data) {
    teamNum = data.teamNumber;
    tz = data.timeZone;
    streamView.streamType = data.streamType;
    streamView.video = data.video;
    ranksView.event = data.event;
}

function tvHandler(data) {
    tv.set('page', data.tvs[tv.screen].content.toLowerCase());
    setVolume(data.tvs[tv.screen].volume);

    if (data.tvs[tv.screen].muted) {
        setVolume(0);
    }
}

function ranksContainerHandler(data, schema) {
    console.log(data);
    ranksView.schema = schema
    ranksView.data = data;
}

//function powerHandler() {
//  //memes
//}

function setVolume(newVol) {
    vol.set(newVol / 100, function (err) {
        console.log(err);
    });
}

function ignoreOurTeam(value) {
    return value !== teamNum;
}

function updateScreenID(tv) {
    tv.screen = fs.readFileSync('tvname.txt').toString().replace(" ", "").replace("\n", "");
}

function sendRequest(packet) {
    var stringPacket = JSON.stringify(packet);
    reqSock.send(stringPacket);
}

function sendGeneralContainerRequest() {
    sendRequest({id: 'GENERAL_FETCH'});
}

function sendMatchContainerRequest() {
    sendRequest({id: 'MATCH_FETCH'});
}

function sendTvRequest() {
    sendRequest({id: 'TV_FETCH'});
}

function sendRanksRequest() {
    sendRequest({id: 'RANK_FETCH'});
}