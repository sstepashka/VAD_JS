function $(id) {
     return document.getElementById(id);
}

function error() {
    alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia = 
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.msGetUserMedia ||
            navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

var audioContext = null;

window.onload = function() {
    audioContext = new AudioContext();
}

function App () {
    this.isListening = false;
    this.node = null;
}

App.prototype.toggle = function() {
    if (this.isListening) {
        this.stop();
    } else {
        this.start()
    }
};

App.prototype.process = function(first_argument) {
    inp = first_argument.inputBuffer.getChannelData(0);

    var result = inp.reduce(function(sum, current) {
        return Math.abs(sum + current)
    }, 0);
};

App.prototype.start = function() {
    this.isListening = true;
    $("toggle").textContent = "Stop";

    var that = this;

    getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, function(stream) {
            mediaStreamSource = audioContext.createMediaStreamSource(stream);

            resample_processor = audioContext.createResampleProcessor(256, 1, 1, 16000);

            mediaStreamSource.connect(resample_processor);

            endOfSpeechProcessor = audioContext.createEndOfSpeechProcessor(1024);

            endOfSpeechProcessor.endOfSpeechCallback = function() {
                console.log('END OF SPEECH');
            };

            js_node = audioContext.createScriptProcessor(1024, 1, 1);
            js_node.onaudioprocess = function(у) { 
                that.process(у); 
            };

            resample_processor.connect(endOfSpeechProcessor);

            endOfSpeechProcessor.connect(js_node);

            js_node.connect(audioContext.destination);

            that.node = mediaStreamSource;
        });

    console.log("start");
};

App.prototype.stop = function() {
    this.isListening = false;
    $("toggle").textContent = "Start";

    this.node.disconnect();
    this.node = null;

    console.log("stop");
};

var app = new App();