let unirest = require('unirest');


unirest.get('http://api.wunderground.com/api/bccd91f6919ff946/lang:FC/conditions/forecast/astronomy/q/canada/sainte-therese.json')
    .end(function(resp){

      console.log(resp.body.sun_phasegt);
    });

