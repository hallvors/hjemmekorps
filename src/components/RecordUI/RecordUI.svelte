<script>
	import { onMount } from "svelte";
	//import DeltakerDisplay from "../ProjectMain/DeltakerDisplay.svelte";
	import LibLoader from "../utils/LibLoader.svelte";
	import NoteBox from "../ProjectMain/NoteBox.svelte";
	// TODO:
	//  - la bruker lytte til opptaket før det sendes, evt. ta på nytt
	//  - velge korrekt del av notene for akkurat den brukeren (!)
	//  - cursor, vis hvilken note som skal spilles
	//  - nedtelling ved start, korrekt tempoangivelse

	export let project;
	export let user;
	var recorder, input, theStream;
	var meta = [];
	var startTime;

	var WebAudioRecorder;

	onMount(async () => {
		var AudioContext = window.AudioContext || window.webkitAudioContext;
		console.log(user.name, project.sheetmusicFile)
		/*
		var btn = document.createElement("button");
		document.getElementById("toolbar").appendChild(btn);
		btn.className = "rec-btn";
		btn.onclick = toggle;
		btn.appendChild(document.createTextNode("  "));
		document.getElementById("waste-btn").onclick = cancel;
		document.getElementById("send-btn").onclick = toggle;
		*/
	});

	function start() {
		meta.push({ timestamp: 0 });
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then(function (stream) {
				theStream = stream;
				var audioContext = new AudioContext();
				input = audioContext.createMediaStreamSource(stream);
				recorder = new WebAudioRecorder(input, {
					workerDir: "/js/web-audio-recorder/lib-minified/",
					encoding: "mp3",
				});
				recorder.onComplete = function (recorder, blob) {
					var xhr = new XMLHttpRequest();
					xhr.open("post", "/api/submit", true);
					if (user) {
						xhr.setRequestHeader("X-hjemmekorps-name", user._id);
					}
					if (project) {
						xhr.setRequestHeader(
							"X-hjemmekorps-project",
							project._id
						);
					}
					xhr.onload = function () {
						document.body.className = "";
						document.getElementById("state-indicator").src =
							"/images/rec.png";
						alert("Ferdig! Opptaket er sendt. Tusen takk :)");
					};
					var fd = new FormData();
					fd.append("mp3", blob, "opptak.mp3");
					fd.append("meta", JSON.stringify(meta));
					meta = [];
					startTime = null;
					xhr.send(fd);
				};

				recorder.setOptions({
					timeLimit: 360,
					encodeAfterRecord: true,
					mp3: { bitRate: 160 },
				});

				startTime = new Date();
				//start the recording process
				recorder.startRecording();
				startCountdown();
			});
	}

	function startCountdown() {}

	function cancel() {
		if (recorder) {
			recorder.cancelRecording();
			document.body.className = "";
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
			document.body.className = "sending";
		} else {
			start();
			document.body.className = "recording";
		}
	}
</script>

<LibLoader src="/js/web-audio-recorder/lib-minified/WebAudioRecorder.min.js" />

<NoteBox
	{project}
	showPlayButton={true}
	trackForPerson={user.name}
	on:play={start} />

<nav id="rec-toolbar">
	<button id="waste-btn"><img
			src="/images/kast.png"
			alt="Avbryt opptak" /></button>
	<span id="state-indicator" />
	<button id="send-btn"><img
			src="/images/send.png"
			alt="Send opptak til lærer" /></button>
</nav>
