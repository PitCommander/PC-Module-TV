var vol = require('vol');
var zmq = require('zeromq'),
  sock = zmq.socket('sub');

sock.connect('tcp://10.0.0.2:5800');
sock.subscribe('');
sock.on('message', function (message) {
  var messageObj = JSON.parse(message);
  var data = messageObj.payload;

  var tv = document.querySelector('tv-app');
  var timerView = document.querySelector('timer-view');
  var scheduleView = document.querySelector('schedule-view');
  var streamView = document.querySelector('stream-view');

  switch (messageObj.id) {
  case 'TimeTick':
    try {
      timeTickHandler(data, timerView);
    } catch (err) {}
    break;
  case 'MatchContainerUpdate':
    data = data.container;
    try {
      matchContainerHandler(data, timerView, scheduleView)
    } catch (err) {}
    break;
  case 'TV_SET':
    try {
      tvHandler(data, tv);
    } catch (err) {}
    break;
  case 'GeneralContainerUpdate':
    data = data.container;
    try {
      generalContainerHandler(data, streamView);
    } catch (err) {}
    break;
  }
});

function timeTickHandler(data, timerView) {
  var seconds = data.timeToZero % 60;
  var minutes = Math.floor(data.timeToZero / 60);
  var hours = Math.floor(minutes / 60);
  var timeString = '';

  if (hours != 0) {
    minutes = minutes % 60;
    timeString = hours + 'h ' + minutes + 'm ' + seconds + 's';
  } else {
    timeString = minutes + 'm ' + seconds + 's';
  }

  timerView.ttz = timeString;
}

function matchContainerHandler(data, timerView, scheduleView) {
  timerView.nextNum = data.currentMatch.matchNumber;
  scheduleView.record = data.wins + "-" + data.losses + "-" + data.ties;
  timerView.bumperColor = data.currentMatch.bumperColor.toLocaleLowerCase();
  timerView.allies = data.currentMatch.allies.filter(ignoreOurTeam);
  timerView.oppo = data.currentMatch.opponents;

  var date = new Date(data.currentMatch.scheduledTime * 1000);
  var predictedDate = new Date(data.currentMatch.predictedTime * 1000);

  timerView.scheduledTime = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  timerView.predictedTime = predictedDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  var schedule = data.schedule;

  schedule.forEach(function (e) {
    var schedDate = new Date(e.scheduledTime * 1000);
    var predDate = new Date(e.predictedTime * 1000);

    var schedString = schedDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    var predString = predDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    e.schedString = schedString;
    e.predString = predString;
    e.allyString = e.allies.filter(ignoreOurTeam);

    var result = "LOSS"
    if (e.bumperColor === e.winner) {
      result = "WIN"
    }
    if (e.winner === "TIE") {
      result = "TIE";
    }

    e.result = result;
  });

  scheduleView.data = schedule;
}

function generalContainerHandler(data, streamView) {
  streamView.streamType = data.streamType;
  streamView.video = data.video; //<------------THIS WILL PROBABLY NEED A HELPER....
}

function tvHandler(data, tv) {
  if (tv.screen == data.name) {
    tv.set('page', data.selected);
    setVolume(data.volume);
  }
}

function powerHandler() {
  //memes
}

function setVolume(newVol) {
  vol.set(newVol, function (err) {});
}

function ignoreOurTeam(value) {
  return value != 401;
}
