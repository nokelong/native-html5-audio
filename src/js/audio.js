var HAudio = function (options) {

	this.RequiredFunctions = [
	    'canplay', 'waiting', 'playing', 'progress', 'loadstart', 'error', 'pause','play'
	];
	this.fun = function () {};
    this.options = options;
    this.EL = options.el;
    this.soundURL = options.url;    
    this.initAudio();
    this.initEvents(options);
}

HAudio.prototype = {
	initAudio: function (url) {
        if (!this.EL) {
        	console.warn('this audio does not exist');
        	return ;
        }
        if (!url) {
        	url = this.soundURL;
        }

        this.EL.src = url;
	},
	initEvents: function (options) {
        for (var key of this.RequiredFunctions) {    
		    if (!options[key]) {
		        console.warn('DOUAUDIO: missing option', key)
		        options[key] = this.fun;
		    } else if (typeof (options[key]) === 'function') {			        	        
		        EventUtil.addEvent(this.EL, key, options[key]);
		    }
	    }
	},
	pause: function () {
        this.EL.pause();
	},
	play: function () {
        this.EL.play();
	},
	setPosition: function (position) {
		
		if (!this.EL) {
            return;
        }

        var seekable = this.EL.seekable;
        var buffered = this.EL.buffered;
        var currentTime = this.EL.currentTime;

        console.log('seekable.end(0): ' +seekable.end(0))
        console.log('currentTime: '+currentTime)
        if (seekable.start(0) < position && position < seekable.end(0)) {
            console.log('seekable.start(0) < currentTime < seekable.end(0)')
            this.EL.currentTime = currentTime;
        } else if (seekable.end(0) < position) {
            console.log('seekable.end(0) < currentTime')
            
            if ('fastSeek' in this.EL) {
                console.log('-----------------fastSeek-------')
                this.EL.fastSeek(position);
                // this.whileplaying(currentTime);
                // clearTimeout(this.ticktInterval);
                // if (!this.isPlaying) {
                //     this.isloading = true;
                // }
                // mpostAudio.play();
            } else {
                position = buffered.end(buffered.length-1)
                this.EL.currentTime = buffered.end(buffered.length-1);
                // this.whileplaying(currentTime);
                // if (this.isPlaying) {
                //     mpostAudio.play();
                // }
            }
        } 
	}
}

