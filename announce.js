var zmq = require('zeromq'),
  sock = zmq.socket('sub');

sock.connect('tcp://10.0.0.4:5800');
sock.subscribe('');

sock.on('message', function (message) {
  var messageObj = JSON.parse(message);
  switch (messageObj.id) {
  case 'TimeTick':

    var seconds = messageObj.payload.timeToZero % 60;
    var minutes = Math.floor(messageObj.payload.timeToZero / 60);
    var hours = Math.floor(minutes / 60);
    var timeString = '';

    if (hours != 0) {
      minutes = minutes % 60;

      timeString = hours + 'h ' + minutes + 'm ' + seconds + 's';
    } else {
      timeString = minutes + 'm ' + seconds + 's';
    }

    document.querySelector('timer-view').ttz = timeString;
    break;
  case 'MatchContainerUpdate':
    var data = messageObj.payload.container;
    document.querySelector('timer-view').nextNum = data.currentMatch.comp_level.toUpperCase() + data.currentMatch.match_number;
    document.querySelector('schedule-view').record = data.wins + "-" + data.losses + "-" + data.ties;

    var date = new Date(data.currentMatch.time * 1000);
    var predictedDate = new Date((data.currentMatch.time + 500) * 1000);
    document.querySelector('timer-view').scheduledTime = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    //document.querySelector('timer-view').predictedTime = predictedDate.toLocaleTimeString();

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

      document.querySelector('timer-view').bumperColor = 'red';
    } else if (bluePos != -1) {
      ally1 = blueTeam[0].split('c')[1];
      ally2 = blueTeam[1].split('c')[1];
      ally3 = blueTeam[2].split('c')[1];

      oppo1 = redTeam[0].split('c')[1];
      oppo2 = redTeam[1].split('c')[1];
      oppo3 = redTeam[2].split('c')[1];

      document.querySelector('timer-view').bumperColor = 'blue';
    }

    var allyString = ally1 + ' ' + ally2 + ' ' + ally3;
    var oppoString = oppo1 + ' ' + oppo2 + ' ' + oppo3;

    document.querySelector('timer-view').allies = allyString;
    document.querySelector('timer-view').oppo = oppoString;

    var schedule = messageObj.payload.container.schedule;

    schedule.forEach(function (e) {
      var tmpDate = new Date(e.time * 1000);
      var matchString = tmpDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      e.timeString = matchString;
    });

    document.querySelector('schedule-view').data = schedule;
    break;
  case 'TV_SET':
    var data = messageObj.payload;
    console.log(data);
    var tv = document.querySelector('tv-app');
    console.log(tv.screen);
    if (tv.screen == data.name) {
      console.log('name matched!')
      tv.set('page', data.selected);
      //powerHandlder(data.power);
      //muteHandler(data.mute);
      //volumeHandler(data.volume)
    }

    break;
  }
});

function powerHandler() {
  //memes
}