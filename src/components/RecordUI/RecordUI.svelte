<script>
	// TODO:
	//  - la bruker lytte til opptaket før det sendes, evt. ta på nytt
	//  - velge korrekt del av notene for akkurat den brukeren (!)
	//  - OSMD cursor, vis hvilken note som skal spilles
	//  - nedtelling ved start, korrekt tempoangivelse

    export let project;
	export let user;
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	var sheetMusicRenderer;
	var recorder, input, theStream;
	var meta = [];
	var startTime;

    // Audio recorder and note rendering libraries use browser APIs and must
    // therefore be imported in the onMount method, which does not run during
    // server-side rendering
    import { onMount } from 'svelte';
    var WebAudioRecorder;

    onMount(async () => {
		WebAudioRecorder = await import('web-audio-recorder-js');
        const module = await import('opensheetmusicdisplay');
        sheetMusicRenderer = new module.default.OpenSheetMusicDisplay('sheetmusic', {
            autoResize: true,
            drawTitle: true,
        });
        sheetMusicRenderer.load('/api/mxml/' + project._id)
        .then(() => sheetMusicRenderer.render());
		var btn = document.createElement('button');
		document.getElementById('toolbar').appendChild(btn);
		btn.className = 'rec-btn';
		btn.onclick = toggle;
		btn.appendChild(document.createTextNode('  '));
		document.getElementById('waste-btn').onclick = cancel;
		document.getElementById('send-btn').onclick = toggle;
    });

function start() {
	meta.push({timestamp:0});
	navigator.mediaDevices.getUserMedia({audio: true}).then(function(stream) {
		theStream = stream;
		var audioContext = new AudioContext();
		input = audioContext.createMediaStreamSource(stream);
		recorder = new WebAudioRecorder(input, {
			workerDir: '/js/web-audio-recorder/lib-minified/',
			encoding: 'mp3',
		});
		recorder.onComplete = function(recorder, blob) {
			var xhr = new XMLHttpRequest();
			xhr.open('post', '/api/submit', true);
			if (user) {
				xhr.setRequestHeader('X-hjemmekorps-name', user._id);
			}
			if (project) {
				xhr.setRequestHeader('X-hjemmekorps-project', project._id);
			}
			xhr.onload = function() {
				document.body.className = '';
				document.getElementById('state-indicator').src = '/images/rec.png';
				alert('Ferdig! Opptaket er sendt. Tusen takk :)');
			}
			var fd = new FormData();
			fd.append('mp3', blob, 'opptak.mp3');
			fd.append('meta', JSON.stringify(meta));
			meta = [];
			startTime = null;
			xhr.send(fd);
		}

		recorder.setOptions({
		  timeLimit:360,
		  encodeAfterRecord:true,
	      mp3: {bitRate: 160}
	    });

		startTime = new Date();
		//start the recording process
		recorder.startRecording();
		startCountdown();
	});
}

function startCountdown() {

}

function stepCursor() {
	sheetMusicRenderer.cursor.show();

	sheetMusicRenderer.cursor.NotesUnderCursor()[0].length.realValue
}

function cancel() {
	if (recorder) {
		recorder.cancelRecording();
		document.body.className = '';
		meta = [];
	}
}

function stop() {
	if (recorder) {
		theStream.getAudioTracks()[0].stop();
		recorder.finishRecording();
	}
}

function toggle(e) {
	if (recorder && recorder.isRecording()) {
		stop();
		document.body.className = 'sending';
	} else {
		start();
		document.body.className = 'recording';
	}
}

</script>

<div id="sheetmusic"></div>

<nav id="rec-toolbar">
	<button id="waste-btn"><img src="/images/kast.png" alt="Avbryt opptak"></button>
	<span id="state-indicator"></span>
	<button id="send-btn"><img src="/images/send.png" alt="Send opptak til lærer"></button>
</nav>
