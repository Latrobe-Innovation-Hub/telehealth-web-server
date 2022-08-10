// var hostname = "rabbitmq-telehealth.mywire.org";
// var port = 15675;
// console.log("Javascript file");

client = new Paho.MQTT.Client("rabbitmq-telehealth.mywire.org", Number(15675), "/ws", "clientId");

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({
	onSuccess: onConnect, 
	userName : "telehealth",
	password : "latrobe"
});

// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe("thermometer-temperature", {qos: 1});
  client.subscribe("pulse-oximeter", {qos: 1});
  //message = new Paho.MQTT.Message("Hello");
  //message.destinationName = "World";
  //client.send(message);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
  }
}

// called when a message arrives
function onMessageArrived(message) {
  console.log("onMessageArrived:"+message.payloadString);

  var temp_data = document.getElementById("thermometer");
  var temp = parseInt(message.payloadString.slice(34, 38));
  temp = (temp/100).toFixed(2);
  temp_data.innerHTML = "Temp: " + temp;

  var oxygen_data = document.getElementById("bloodoxygen");
  var oxygen = parseInt(message.payloadString.slice(38, 40));
  oxygen_data.innerHTML = oxygen;
  var heart_data = document.getElementById("heartrate");
  
  

}