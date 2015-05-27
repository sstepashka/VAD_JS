
function VAD() {
    this.reset()
}

VAD.prototype.process = function(frame) {
    var active = this.frameActive(frame);
    this.time = this.frameNumber * 160.0 / 16000.0;

    if (active) {
        if (this.lastActiveTime >= 0 && (this.time - this.lastActiveTime) < this.silenceLengthMilis) {
            this.sequenceCounter ++;
            if (this.sequenceCounter >= this.minSequenceCount) {
                this.lastSequenceTime = this.time;
                this.silenceLengthMilis = Math.max(this.minSilenceLengthMilis, (this.silenceLengthMilis - this.minSilenceLengthMilis) / 4.0);
            }
        } else {
            this.sequenceCounter = 1;
        }

        this.lastSequenceTime = this.time;
    } else {
        if (this.time - this.lastSequenceTime > this.silenceLengthMilis) {
            if (this.lastSequenceTime > 0) {
                //terminate
                console.log("terminate");
            } else {
                //no speech
                console.log("no speech");
            }
        }
    }

    // console.log(this.time);
    // console.log(this.silenceLengthMilis);
};

VAD.prototype.frameActive = function(frame) {
    var energy = 0;
    var czCount = 0;

    var lastsign = 0;

    for (var i = 0; i < frame.length; i++) {
        energy += (frame[i] * frame[i]) / 160;

        var sign = 0;
        if (frame[i] > 0) {
            sign = 1;
        } else {
            sign = -1;
        }

        if (lastsign != 0 && sign != lastsign) {
            czCount ++;
        }

        lastsign = sign;
    }

    this.frameNumber += 1;

    var result = false;

    if (this.frameNumber < this.noiseFrames) {
        this.noiseEnergy += energy / this.noiseFrames;
    } else {
        if (czCount >= this.minCZ && czCount <= this.maxCZ) {
            if (energy > this.noiseEnergy * this.energyFactor) {
                result = true;
            }
        }
    }

    return result;
};

VAD.prototype.reset = function(first_argument) {
    this.minCZ = 5
    this.maxCZ = 15

    this.frameLengthMilis = 10.0;
    this.maxSilenceLengthMilis = 3.5;
    this.minSilenceLengthMilis = 0.8;
    this.silenceLengthMilis = this.maxSilenceLengthMilis;
    this.sequenceLengthMilis = 0.03;
    this.minSequenceCount = 3;
    this.energyFactor = 3.1;

    this.noiseFrames = Math.round(150. / this.frameLengthMilis);
    this.noiseEnergy = 0.0;
    this.frameNumber = 0;
    this.lastActiveTime = -1.0;
    this.lastSequenceTime = 0.0;
    this.sequenceCounter = 0;
    this.time = 0.0;
};