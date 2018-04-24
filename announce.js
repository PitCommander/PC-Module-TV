const vol = require('vol');
const fs = require('fs');
const zmq = require('zeromq');

let teamNum = 401;
let tz = "America/New_York";

//Real address to use: 10.0.0.1
const CURRENT_IP = '127.0.0.1';

let tv = document.querySelector('tv-app');
let timerView = document.querySelector('timer-view');
let scheduleView = document.querySelector('schedule-view');
let streamView = document.querySelector('stream-view');
let ranksView = document.querySelector('ranks-view');

const reqSock = zmq.socket('req');
reqSock.connect('tcp://' + CURRENT_IP + ':5801');
reqSock.on('message', function (message) {
    tv = document.querySelector('tv-app');
    timerView = document.querySelector('timer-view');
    scheduleView = document.querySelector('schedule-view');
    streamView = document.querySelector('stream-view');
    ranksView = document.querySelector('ranks-view');

    let messageObj = JSON.parse(message);
    let data = messageObj.payload;

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

const subSock = zmq.socket('sub');
subSock.connect('tcp://' + CURRENT_IP + ':5800');
subSock.subscribe('');
subSock.on('message', function (message) {
    tv = document.querySelector('tv-app');
    timerView = document.querySelector('timer-view');
    scheduleView = document.querySelector('schedule-view');
    streamView = document.querySelector('stream-view');
    ranksView = document.querySelector('ranks-view');

    const messageObj = JSON.parse(message);
    let data = messageObj.payload;
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
            data = data.container;
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
            data = data.container;

            schema = data.schema;
            data = data.rankings;

            try {
                ranksContainerHandler(data, schema);
            } catch (err) {
            }
            break;
    }
});

function timeTickHandler(data) {
    const seconds = data.timeToZero % 60;
    let minutes = Math.floor(data.timeToZero / 60);
    const hours = Math.floor(minutes / 60);
    let timeString = '';

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

    const date = new Date(data.currentMatch.scheduledTime * 1000);
    const predictedDate = new Date(data.currentMatch.predictedTime * 1000);

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

    const schedule = data.schedule;

    schedule.forEach(function (e) {
        const schedDate = new Date(e.scheduledTime * 1000);
        const predDate = new Date(e.predictedTime * 1000);

        const schedString = schedDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: tz
        });

        const predString = predDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: tz
        });

        e.schedString = schedString;
        e.predString = predString;
        e.allyString = e.allies.filter(ignoreOurTeam).join(', ');
        e.oppoString = e.opponents.join(', ');

        let result = "";


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

    console.log(schema);

    ranksView.schema = schema;
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
    const stringPacket = JSON.stringify(packet);
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