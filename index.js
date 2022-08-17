// set broker url
var wsbroker = "rabbitmq-telehealth.mywire.org";

// set websocket ports
var wsport = 15675;
var wssport = 15676;

// build PAHO client object
var client = new Paho.Client(wsbroker, wssport, "/ws", "clientId_" + parseInt(Math.random() * 100, 10));

// set client options and callbacks
var pahoOptions = {
    userName : "telehealth",
    password : "latrobe",
    timeout : 3,
    keepAliveInterval: 90,
    reconnect : true,
    useSSL: true,
    
    // called when the client connection succeeds
    onSuccess: function () {
        console.log("== [PAHO] CONNECTION SUCCESS ==");
        
        // subscribe to topics
        // ===================
        console.log("== [PAHO] SUBSCRIBING TO: PULSE-OXIMETER ==");
        client.subscribe("pulse-oximeter", {qos: 1});

        console.log("== [PAHO] SUBSCRIBING TO: THERMOMETER-TEMPERATURE ==");
        client.subscribe("thermometer-temperature", {qos: 1});
        
        
        console.log("== [PAHO] SUBSCRIBING TO: BLOOD-PRESSURE ==");
        client.subscribe("blood-pressure", {qos: 1});
        // ===================
    },
    
    // called when the client connection fails
    onFailure: function () {
        console.log("== [PAHO] CONNECTION FAILURE ==");
    },
};

// called when the client loses its connection
client.onConnectionLost = function (responseObject) {
    if (responseObject.reconnect) {
        console.log("== [PAHO] AUTOMATIVE RECONNECT WAS ACTIVATED! ==");
    } else {
        console.log("== [PAHO] CONNECTION LOST! : " + responseObject.errorMessage + " ==");
    }
};

// called when a message arrives
client.onMessageArrived = function (message) {
    console.log("== [PAHO] MESSAGE ARRIVED! : " + message.payloadString + " ==");
    console.log("HERERERERERERE");
    var new_date = new Date();
    var date_array = new_date.toString().split(" ");
    var month = date_array[1];
    var day = date_array[2];
    var year = date_array[3];
    var time = date_array[4];

    if (message.payloadString.includes("--thermometer--")){
        console.log("TEMPERATURE MESSAGE RECEIVED")
        var temp_data = document.getElementById("thermometer");
        var temp_array = message.payloadString.split(",");
        var temp = parseInt(temp_array[1]);
        temp = (temp/100).toFixed(2);
        temp_data.innerHTML = "Temp: " + temp;
        var time_temp = document.getElementById("temp_time");
        time_temp.innerHTML =  getDate(); 
    }
    if (message.payloadString.includes("--oximeter--")){
        console.log("OXIMETER MESSAGE RECEIVED") 
        var oxygen_data = document.getElementById("bloodoxygen");
        var oximeter_array = message.payloadString.split(",");
        var oxygen = parseInt(oximeter_array[1]);
        console.log("Oxygen: " + oxygen)
        oxygen_data.innerHTML = "spO2: " + oxygen;

        var heartrate_data = document.getElementById("heartrate");
        var heartrate = parseInt(oximeter_array[2]);
        console.log("Heartrate: " + heartrate);
        heartrate_data.innerHTML = "BPM: " + heartrate;
       
        var oximeter_temp = document.getElementById("oximeter_time");
        oximeter_temp.innerHTML =  getDate(); 

    }
    if (message.payloadString.includes("--bpressure--")){
      console.log("BLOOD PRESSURE MESSAGE RECEIVED")
      var bp_data_high = document.getElementById("bpressure_high");
      var bp_data_low = document.getElementById("bpressure_low");
      var bp_array = message.payloadString.split(",");
      var bp_high = parseInt(bp_array[1]);
      var bp_low = parseInt(bp_array[2]);
      bp_data_high.innerHTML = "BP HIGH: " + bp_high;
      bp_data_low.innerHTML = "BP LOW: " + bp_low;

      var bp_temp = document.getElementById("bp_time");
      bp_temp.innerHTML =  getDate(); 
    }

        
    //var heart_data = document.getElementById("heartrate");
};

// connect the client
console.log("== [PAHO] CONNECTING TO: " + wsbroker + ":" + wssport + " ==");
client.connect(pahoOptions); 

function getDate(){
    var new_date = new Date();
    var date_array = new_date.toString().split(" ");
    var month = date_array[1];
    var day = date_array[2];
    var year = date_array[3];
    var time = date_array[4];
    var date_time = time + "  " + day + " " + month + " " + year 
    return date_time;
}

function timeSince(date) {

  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " years";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}