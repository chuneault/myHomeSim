/**
 * Created by chune on 2016-10-25.
 */

var timer = server.vars.WUnderGround.timer || 0;

if (timer == 0)
  server.vars.WUnderGround.timer = setTimeout(function (){
    server.invokeAction('web','httpGet', [
      format('http://weatherstation.wunderground.com/weatherstation/updateweatherstation.php?ID=IQUBECSA63&PASSWORD=Bonjour37&dateutc=now&humidity={hum}&tempf={tempf}&baromin={baro}&action=updateraw',
          {hum: server.vars.METEOHUM.lastValue,
            tempf: server.vars.METEOTEMP.lastValue * 1.8 + 32,
            baro:  server.vars.METEOBARO.lastValue * 0.0295333727})]);

    clearTimeout(timer);
    server.vars.WUnderGround.timer = 0;

  }, 5000);

