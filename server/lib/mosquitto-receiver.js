var mqtt = require('mqtt');

client = mqtt.createClient(1883, '10.0.0.2')
    .on('connect', function () {
        client.subscribe('#');
    }).on('message', function (topic, message) {
        console.log('topic= ' + topic + ' | message= ' + message);
    });