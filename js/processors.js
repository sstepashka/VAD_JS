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
    Array.prototype.push.apply(this.array_data, array);
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

function _floatTo16BitPCM(output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function encodeRAW(samples) {
    var buffer = new ArrayBuffer(samples.length * 2);
    var view = new DataView(buffer);
    _floatTo16BitPCM(view, 0, samples);
    return view.buffer;
}

AudioContext.prototype.createEndOfSpeechProcessor = function(bufferSize) {
    script_processor = this.createScriptProcessor(bufferSize, 1, 1);

    var vad = new VAD();

    var buffer = new MagicBuffer(160);

    buffer.callback = function(elements) {
        vad.process(elements);
    }

    script_processor.onaudioprocess = function(event) { 
        inp = event.inputBuffer.getChannelData(0);
        out = event.outputBuffer.getChannelData(0);

        console.log("1");

        buffer.push(inp);

        for(var i = 0; i < inp.length; i++) {
            out[i] = inp[i];
        }
    };

    return script_processor;
};