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
    this.resample_processor = null;
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
                // "mandatory": {
                //     "googEchoCancellation": "false",
                //     "googAutoGainControl": "false",
                //     "googNoiseSuppression": "false",
                //     "googHighpassFilter": "false"
                // },
                "optional": []
            },
        }, function(stream) {
            mediaStreamSource = audioContext.createMediaStreamSource(stream);

            resample_processor = audioContext.createResampleProcessor(1024, 1, 1, 16000);

            mediaStreamSource.connect(resample_processor);

            endOfSpeechProcessor = audioContext.createEndOfSpeechProcessor(1024);

            endOfSpeechProcessor.endOfSpeechCallback = function() {
                console.log('END OF SPEECH');
                that.stop();
            };

            resample_processor.connect(endOfSpeechProcessor);

            that.resample_processor = resample_processor;
            that.node = mediaStreamSource;
        });

    console.log("start");
};

App.prototype.stop = function() {
    this.isListening = false;
    $("toggle").textContent = "Start";

    try {
        this.node.disconnect();
        this.node = null;
        this.resample_processor.disconnect();
        this.resample_processor = null;
    } catch(e) {
        //pass
    }

    console.log("stop");
};

var app = new App();