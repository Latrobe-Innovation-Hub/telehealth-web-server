// // ===========================
// // JITSI API CALL CODE SECTION
// // ===========================

// // set url for jitsi meet server API
// const domain = "jitsi-telehealth.mywire.org";

// // set jitsi meet API connection options
// const options = {
//     roomName: "telehealth-demo",
//     userInfo: {
//         displayName: "unspecified",
//     },
//     //width: 1200px,
//     //height: 900px,
//     parentNode: document.getElementById("meet"),    //Now, you declare here which element should parent your stream.
//     configOverwrite: { disableTileView: true },     //You can turn on or off config elements with this prop.
//     interfaceConfigOverwrite: {
//         //TOOLBAR_BUTTONS: []
//     },
// };


// //Testing to see if the live button will hide after a delay. 
// // Potential method could be to add a dot for 5 seconds when a message is received
// // var temp_live = document.getElementById("thermometer_dot");
// // temp_live.innerHTML=".";
// //             setTimeout(() => {
// //                 temp_live.style.display="none"
// //             },5000);

// var api = {}; 

// // instantiate jitsi meet connection to API
// try {
//     api = new JitsiMeetExternalAPI(domain, options);
// } catch (error) {
//     console.log("== [jitsi] FAILED! ==", error);
// };

// // set jitsi user name via html radio buttons
// function setUser() {
//     var userType = document.getElementById("user_type_form").user_type;
    
//     if (userType.value == "RD") {
//         console.log("== [JITSI] SETTING USER TYPE AS: ", "\"Remote Doctor\"", " ==");
//         api.executeCommand("displayName", "Remote Doctor");
//     } else if (userType.value == "AN") {
//         console.log("== [JITSI] SETTING USER TYPE AS: ", "\"Attending Nurse\"", " ==");
//         api.executeCommand("displayName", "Attending Nurse");
//     }
// };

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
            // var temp_live = document.getElementById("thermometer_dot");
            // temp_live.innerHTML = ".";
            // setTimeout(() => {
            //   temp_live.style.display="none";

            // },5000);
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
            // if (heartrate > 40){ 
            //     addData(myLineChart, time, heartrate);
            // }

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

// does...
function getDate(){
    var new_date = new Date();
    var date_array = new_date.toString().split(" ");
    var month = date_array[1];
    var day = date_array[2];
    var year = date_array[3];
    var time = date_array[4];
    var date_time = time + " - " + day + " " + month + " " + year
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

//Chart

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
