var timerID=null;
var interval=100;

self.onmessage=function(e){
	if (e.data=="start") {
		console.log("mw starting");
		if (timerID) { // paranoia..
			clearInterval(timerID);
		}
		timerID=setInterval(function(){postMessage("tick");},interval)
	}
	else if (e.data.interval) {
		interval=e.data.interval;
		console.log("mw interval="+interval);
		if (timerID) {
			clearInterval(timerID);
			timerID=setInterval(function(){postMessage("tick");},interval)
		}
	}
	else if (e.data=="stop") {
		console.log("mw stopping");
		clearInterval(timerID);
		timerID=null;
	}
};
