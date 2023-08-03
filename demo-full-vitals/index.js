var url_string = window.location.href; // www.test.com?room=test
var url = new URL(url_string);
var paramRoom = url.searchParams.get("room");

// Check if paramRoom is null or empty, then assign the default value
if (!paramRoom) {
  paramRoom = "la-trobe-telehealth-demo"; // set room default if none given
}

// set initial server status html
//   serve1  = jitsi
//   server2 = rabbitmq
//   browser = jitsi browser support
server_status("server1", "connecting");
server_status("server2", "connecting");
server_status("browser", "checking");

// ===========================
// JITSI API CALL CODE SECTION
// ===========================

// set url for jitsi meet server API
const domain = "jitsi-telehealth.mywire.org";

// set general preferred codec
const videoQuality = {preferredCodec: "VP9", };

// set general preferred video options
var videoFrameRate = { ideal: 30, max: 30, min: 15};
var videoHeight =  { ideal: 1080, max: 1080, min: 360};

var videoConstraints = { frameRate: videoFrameRate,
                         height: videoHeight};

// set p2p preferred video options
var p2pFrameRate = { ideal: 30, max: 30, min: 15}

var p2p = { preferredCodec: "VP9",
            video: { frameRate: p2pFrameRate}};

// config overwire
var config = { disableTileView: true,
               resolution: 1080,
               videoQuality: videoQuality,
               constraints: {video: videoConstraints},
               //enableNoisyMicDetection: false,
               disableAGC: true, // <- requires audio testing!
               disableAP: true,  // <- requires audio testing!
               p2p: p2p};

// set jitsi meet API connection options
var options = {
    roomName: paramRoom,
    disableSimulcast: true,
    userInfo: { displayName: "unspecified",},
    parentNode : document.getElementById("meet"),
    configOverwrite : config,
    interfaceConfigOverwrite: { },

    // update server status
    onload: function set_state() {
        server_status("server1", "connected");
   }
};

var api = {};

// instantiate jitsi meet connection to API
try {
    api = new JitsiMeetExternalAPI(domain, options);
} catch (error) {
    console.log("== [jitsi] FAILED! ==", error);
    server_status("server1", "disconnected");
};

// set password for moderator
//api.addEventListener('participantRoleChanged', function (event) {
//    if (event.role === "moderator") {
//        api.executeCommand('password', 'demo');
//    }
//});

// turn on lobby for moderators room
try {
    api.addEventListener('participantRoleChanged', function (event) {
        if(event.role === 'moderator') {
            api.executeCommand('toggleLobby', true);
        }
    });
} catch (error) {
    console.log("== [jitsi] FAILED! ==", error);
    server_status("server1", "disconnected");
}

// check browser support
try{
    api.addEventListener('browserSupport', function (event) {
        if(event.supported === true) {
            server_status("browser", "supported");
            console.log("== [JITSI] BROWSER SUPPORTED:", event.supported);
        } else if (event.supported === false) {
            server_status("browser", "not supported");
            console.log("== [JITSI] BROWSER SUPPORTED:", event.supported);
        }
    });
} catch (error) {
    console.log("== [jitsi] FAILED! ==", error);
    server_status("server1", "disconnected");
}

// set jitsi user name via html radio buttons
function setUser() {
    var userType = document.getElementById("user_type_form").user_type;

    if (userType.value == "RD") {
        console.log("== [JITSI] SETTING USER TYPE AS: ", "\"Remote Doctor\"", " ==");
        api.executeCommand("displayName", "Remote Doctor");
    } else if (userType.value == "AN") {
        console.log("== [JITSI] SETTING USER TYPE AS: ", "\"Attending Nurse\"", " ==");
        api.executeCommand("displayName", "Attending Nurse");
    }
};


// ===============================
// MQTT PAHO/RABBITMQ CODE SECTION
// ===============================

// set broker url
var wsbroker = "rabbitmq-telehealth.freeddns.org";

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
        server_status("server2", "connected");
        
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
        server_status("server2", "disconnected");
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

// initialise first message bools << ADDED FIRST MESSAGE TESTING...
var first_msg_oxy = true;
var first_msg_thermo = true;
var first_msg_bp = true;
var pulse_array = []
// called when a message arrives
client.onMessageArrived = function (message) {
    console.log("== [PAHO] MESSAGE ARRIVED! : " + message.payloadString + " ==");

    // get current timestamp
    var new_date = new Date();
    var date_array = new_date.toString().split(" ");
    var month = date_array[1];
    var day = date_array[2];
    var year = date_array[3];
    var time = date_array[4];

    // =========================
    //  thermometer message
    // =========================
    if (message.payloadString.includes("--thermometer--")){
        // test for first message and update bool
        if (first_msg_thermo == true) {
            console.log("== [PAHO] DISREGARDING FIRST TEMPERATURE MESSAGE RECEIVED ==");
            first_msg_thermo = false;
        } else {
            console.log("== [PAHO] TEMPERATURE MESSAGE RECEIVED ==");

            // grab relevant data from message
            var temp_data = document.getElementById("thermometer");
            var temp_array = message.payloadString.split(",");
            var temp = parseInt(temp_array[1]);
            temp = (temp/100).toFixed(2);

            // update message web data
            temp_data.innerHTML = "temp(c): " + temp;

            // update message web timestamp
            var time_temp = document.getElementById("temp_time");
            time_temp.innerHTML =  getDate();
            addData(myLineChart, time, temp);


        // Set live dot to appear
        // Delay of 5 seconds which will hide the live button when no messages received.
        //     var temp_live = document.getElementById("thermometer_dot");
        //     temp_live.innerHTML = ".";
        //     setTimeout(() => {
        //       temp_live.style.display="none";

        //     },5000);
        }
    }

    // =========================
    //  oximeter message
    // =========================
    if (message.payloadString.includes("--oximeter--")){
        // test for first message and update bool
        if (first_msg_oxy == true) {
            console.log("== [PAHO] DISREGARDING FIRST OXIMETER MESSAGE RECEIVED ==");
            first_msg_oxy = false;
        } else {
            console.log("== [PAHO] OXIMETER MESSAGE RECEIVED ==");

            // grab relevant data from message
            var oxygen_data = document.getElementById("bloodoxygen");
            var oximeter_array = message.payloadString.split(",");
            var oxygen = parseInt(oximeter_array[1]);

            var payload = message.payloadString;
            var start_index = payload.indexOf("[") + 1;
            var end_index = payload.indexOf("]");
            var pulsewave_str = payload.slice(start_index, end_index);
            var pulsewave_array = pulsewave_str.split(",");
            console.log("LOGGING" + pulsewave_array)
            pulse_array.push(pulsewave_array);
            const y_data = pulse_array
            const x_data = time

           pulsewave_array.forEach((pulse) => {
               addData(myLineChart, " ", pulse);
           })

            // update message web data
            oxygen_data.innerHTML = "spO2: " + oxygen;

            // grab relevant data from message
            var heartrate_data = document.getElementById("heartrate");
            var heartrate = parseInt(oximeter_array[2]);

            // update message web data
            heartrate_data.innerHTML = "hr(bpm): " + heartrate;

            // update message web timestamp
            var oximeter_temp = document.getElementById("oximeter_time");
            oximeter_temp.innerHTML =  getDate();
        }
    }

    // =========================
    //  blood-pressure  message
    // =========================
    if (message.payloadString.includes("--bpressure--")){
        // test for first message and update bool
        if (first_msg_bp == true) {
            console.log("== [PAHO] DISREGARDING FIRST BLOOD PRESSURE MESSAGE RECEIVED ==");
            first_msg_bp = false;
        } else {
            console.log("== [PAHO] BLOOD PRESSURE MESSAGE RECEIVED ==");

            // grab relevant data from message
            var bp_data_high = document.getElementById("bpressure_high");
            var bp_data_low = document.getElementById("bpressure_low");
            var bp_array = message.payloadString.split(",");
            var bp_high = parseInt(bp_array[1]);
            var bp_low = parseInt(bp_array[2]);

            // update message web data
            bp_data_high.innerHTML = "bp high: " + bp_high;
            bp_data_low.innerHTML = "bp low: " + bp_low;

            // update message web timestamp
            var bp_temp = document.getElementById("bp_time");
            bp_temp.innerHTML =  getDate();
        }
    }
};

// connect the client
console.log("== [PAHO] CONNECTING TO: " + wsbroker + ":" + wssport + " ==");
client.connect(pahoOptions);


// =======================
// HELPER FUNCTION SECTION
// =======================

// update system state html
// NOTE: I know this code is messy...
function server_status(server, state) {
    var icon = "-icon";
    var text = "-text";

    let server_icon = server.concat(icon);
    let server_text = server.concat(text);

    var server_state_icon = document.getElementById(server_icon);
    var server_state_text = document.getElementById(server_text);

    if (state == "connecting" || state == "checking") {
      server_state_icon.textContent="[-] ";
      server_state_icon.style.color="orange";
      if (state == "connecting") {
        server_state_text.textContent=" connecting";
        return server.concat(" connecting");
      } else {
        server_state_text.textContent=" checking";
        return server.concat(" checking");
      }
    } else if (state == "connected" || state == "supported") {
      server_state_icon.textContent="[+] ";
      server_state_icon.style.color="green";
      if (state == "connected") {
        server_state_text.textContent=" connected";
        return "connected";
      } else {
        server_state_text.textContent=" supported";
        return server.concat(" supported");
      }
    } else if (state == "disconnected" || state == "not supported") {
      server_state_icon.textContent="[x] ";
      server_state_icon.style.color="red";
      if (state == "disconnected") {
        server_state_text.textContent=" disconnected";
        return "disconnected";
      } else {
        server_state_text.textContent=" not supported";
        return server.concat(" not supported");
      }
    }

    return "no indicators set";
};

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

// does...
function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = seconds / 31536000;
    if (interval > 1) { return Math.floor(interval) + " years"; }

    interval = seconds / 2592000;
    if (interval > 1) { return Math.floor(interval) + " months"; }

    interval = seconds / 86400;
    if (interval > 1) { return Math.floor(interval) + " days"; }

    interval = seconds / 3600;
    if (interval > 1) { return Math.floor(interval) + " hours"; }

    interval = seconds / 60;
    if (interval > 1) { return Math.floor(interval) + " minutes"; }

    return Math.floor(seconds) + " seconds";
}


const ctx = document.getElementById('myChart');
const xdata = []


const data = {
  labels: xdata,
  datasets: [
  {
    label: 'Pulse Wave',
    data: [],
    fill: false,
    borderColor: 'rgb(255, 99, 132)',
    tension: 0.8
  }
//   
]
};
      
const myLineChart = new Chart(ctx, {
                        type: 'line',
                        data: data,
                        options: {
                            maintainAspectRatio: false,
                            // aspectRatio: 2,
                            scales: {
                                y: {
                                    beginAtZero: false
                                }
                            }
                        }
                    });

function addData(chart, label, pulse) {
    
    const max_data = 90;
    
    if (data.labels.length > max_data){
        data.labels.shift()
    }
    chart.data.labels.push(label);

    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(pulse);
        console.log("Length + " + dataset.data.length)
        if (dataset.data.length > max_data){
            dataset.data.shift()
        }
    });
    chart.update();
}
