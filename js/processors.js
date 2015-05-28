window.AudioContext = window.AudioContext || window.webkitAudioContext;

AudioContext.prototype.createResampleProcessor = function(bufferSize, numberOfInputChannels, numberOfOutputChannels, destinationSampleRate) {
    script_processor = this.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
    var resampler  = new Resampler(this.sampleRate, destinationSampleRate, numberOfInputChannels, bufferSize, true);

    script_processor.onaudioprocess = function(event) { 
        inp = event.inputBuffer.getChannelData(0);
        out = event.outputBuffer.getChannelData(0);
        var l = resampler.resampler(inp);
        for (var i=0; i < l; ++i) {
            out[i] = resampler.outputBuffer[i];
        }
    };

    return script_processor;
};

function MagicBuffer(chunkSize) {
    this.chunkSize = chunkSize;
    this.array_data = Array()

    this.callback = null;
} 

MagicBuffer.prototype.push = function(array) {
    new_array = new Array();

    for (i = 0; i < array.length; i+= 2) {
        new_array[i / 2] = array[i];
    }

    Array.prototype.push.apply(this.array_data, new_array);
    this.process();
};

MagicBuffer.prototype.process = function(first_argument) {
    while(this.array_data.length > this.chunkSize) {
        elements = this.array_data.splice(0, this.chunkSize);

        if (this.callback) {
            this.callback(elements);
        }
    }
};

MagicBuffer.prototype.drop = function() {
    this.array_data.splice(0, this.array_data.length);
};

AudioContext.prototype.createEndOfSpeechProcessor = function(bufferSize) {
    script_processor = this.createScriptProcessor(bufferSize, 1, 1);

    script_processor.endOfSpeechCallback = null;

    var vad = new VAD();

    script_processor.vad = vad;

    var buffer = new MagicBuffer(160);

    buffer.callback = function(elements) {
        vad_result = vad.process(elements);

        if (vad_result !== 'CONTINUE' && script_processor.endOfSpeechCallback) {
            script_processor.endOfSpeechCallback();
            buffer.drop();
        }
    }

    script_processor.onaudioprocess = function(event) { 
        console.log("1");
        
        inp = event.inputBuffer.getChannelData(0);
        out = event.outputBuffer.getChannelData(0);
        buffer.push(inp);

        for(var i = 0; i < inp.length; i++) {
            out[i] = inp[i];
        }
    };

    return script_processor;
};