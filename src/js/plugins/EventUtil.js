var EventUtil = {
	addEvent: function (element, type, handler) {
	    element = element? element: window;
	    if (element.addEventListener) {
            element.addEventListener(type, handler);
	    } else if (element.attachEvent) {
	    	element.attachEvent('on' + type, handler);
	    } else {
	    	element['on'+ type] = handler;
	    }
	},
	removeEvent: function (element=window, type, handler) {
		if (element.removeEventListener) {
			element.removeEventListener(type, handler, false);
		} else if(element.detachEvent) {
			element.detachEvent('on' + type, handler);
		} else {
			element['on'+ type] = null;
		}
	},
	getEvent: function (event) {
		return event ? event: window.event;
	},
	getTarget: function (event) {
		return event.target || event.srcElement;
	},
	preventDefault: function (event) {
	    if (event.preventDefault) {
	        event.preventDefault();
	    } else {
	    	event.returnValue = false;
	    }
	},
	stopPropagation: function (event) {
	    if (event.stopPropagation) {
	        event.stopPropagation();
	    } else {
	    	event.cancelBubble = true;
	    }
	}
}