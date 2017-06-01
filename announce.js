var vol = require('vol');
var zmq = require('zeromq'),
  sock = zmq.socket('sub');

sock.connect('tcp://10.0.0.4:5800');
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
    timeTickHandler(data, timerView);
    break;
  case 'MatchContainerUpdate':
    data = data.container;
    matchContainerHandler(data, timerView, scheduleView)
    break;
  case 'TV_SET':
    tvHandler(data, tv);
    break;
  case 'GeneralContainerUpdate':
    data = data.container;
    generalContainerHandler(data, streamView);
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
  timerView.nextNum = data.currentMatch.comp_level.toUpperCase() + data.currentMatch.match_number;
  scheduleView.record = data.wins + "-" + data.losses + "-" + data.ties;

  var date = new Date(data.currentMatch.time * 1000);
  var predictedDate = new Date((data.currentMatch.time + 500) * 1000);
  timerView.scheduledTime = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  //timerView.predictedTime = predictedDate.toLocaleTimeString();

  var redTeam = data.currentMatch.redTeams;
  var blueTeam = data.currentMatch.blueTeams;

  var redPos = redTeam.indexOf('frc401');
  var bluePos = blueTeam.indexOf('frc401');

  var ally1, ally2, ally3, oppo1, oppo2, oppo3 = '';

  if (redPos != -1) {
    ally1 = redTeam[0].split('c')[1];
    ally2 = redTeam[1].split('c')[1];
    ally3 = redTeam[2].split('c')[1];

    oppo1 = blueTeam[0].split('c')[1];
    oppo2 = blueTeam[1].split('c')[1];
    oppo3 = blueTeam[2].split('c')[1];

    timerView.bumperColor = 'red';
  } else if (bluePos != -1) {
    ally1 = blueTeam[0].split('c')[1];
    ally2 = blueTeam[1].split('c')[1];
    ally3 = blueTeam[2].split('c')[1];

    oppo1 = redTeam[0].split('c')[1];
    oppo2 = redTeam[1].split('c')[1];
    oppo3 = redTeam[2].split('c')[1];

    timerView.bumperColor = 'blue';
  }

  var allyString = ally1 + ' ' + ally2 + ' ' + ally3;
  var oppoString = oppo1 + ' ' + oppo2 + ' ' + oppo3;

  timerView.allies = allyString;
  timerView.oppo = oppoString;

  var schedule = data.container.schedule;

  schedule.forEach(function (e) {
    var tmpDate = new Date(e.time * 1000);
    var matchString = tmpDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    e.timeString = matchString;
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
