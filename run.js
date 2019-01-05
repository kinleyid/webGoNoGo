
var filename = 'defaultFilename'

var preFixationMs = 1000;
var fixationMs = 1000;
var postFixationMs = 0;
var allowResponsesMs = 2500; // How long should participants be allowed to respond?

var masterBlockwiseLengths = [20, 20, 20];
var masterBlockwisePpnGos = [0.8, 0.2, 0.5];
var masterIsGo = generateStimuli(masterBlockwiseLengths, masterBlockwisePpnGos)

var isPractice = true;
if(isPractice) {
	var practiceBlockwiseLengths = [20];
	var practiceBlockwisePpnGos = [0.8];
	var practiceIsGo = generateStimuli(practiceBlockwiseLengths, practiceBlockwisePpnGos)
}

var trialIdx, wasResponse = false, presentationTime = 0, responseTime = 0;

var ALL = document.getElementsByTagName("html")[0];
var dialogArea = document.getElementById("dialogArea");
var textArea = document.getElementById("textArea");

window.addEventListener("click", respondToInput);
window.onkeydown = respondToInput;
allowResponses = false;

outputText = 'Trial,IsGo,WasResponse,PresentationTime,ResponseTime\n';

function start() {
	if(isPractice) {
		isGo = practiceIsGo;
	} else {
		isGo = masterIsGo;
	}
	
	ALL.style.cursor = "none";
    dialogArea.style.display = "none";
	textArea.style.display = 'block';
	
	trialIdx = 0;
	runTrial();
}

function runTrial() {
	setTimeout(function() {		
		fixationCross();
		setTimeout(function() {
			if(postFixationMs > 0) {
				textArea.textContent = '';
				setTimeout(showStim, postFixationMs);
			} else {
				showStim();
			}
		}, fixationMs);
	}, preFixationMs);
}

function fixationCross() {
	textArea.textContent = "\u2022";
}

function showStim() {
	if(isGo[trialIdx]) {
		textArea.textContent = "M";
	} else {
		textArea.textContent = "W";
	}
	allowResponses = true;
	presentationTime = performance.now();
	timeoutID = setTimeout(endTrial, allowResponsesMs);
}

function respondToInput(event) {
	responseTime = performance.now();
	if(allowResponses && event.code == 'Space') {
		clearTimeout(timeoutID);
		endTrial();
	}
}

function endTrial() {
	allowResponses = false;
	textArea.textContent = ''
	outputText +=
		(trialIdx + 1) + ',' +
		isGo[trialIdx] + ',' +
		presentationTime + ',' +
		responseTime + '\n';
	trialIdx++;
	if(trialIdx == isGo.length) {
		if(isPractice) {
			postPracticeScreen();
		} else {
			saveData();
		}
	} else {
		runTrial();
	}
}

function postPracticeScreen() {
	isPractice = false;
	ALL.style.cursor = "default";
    dialogArea.style.display = "block";
	textArea.style.display = 'none';
	dialogArea.innerHTML = '<p class="dialog">That was the end of the practice round.<br><br>Click to start the game for real.<br><br>' +
		'<button onclick="start()">Start game</button>';
}

function saveData() {
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.status == 200) {
            textArea.style.display = 'none';
            dialogArea.style.display = 'block';
            dialogArea.textContent = 'Thank you!';
        } else if(xhttp.status == 500) {
            saveData();
        }
    };
    xhttp.open("POST", "saveData.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    VarsToSend = "filename="+filename + "&txt="+outputText;
    xhttp.send(VarsToSend);
}

function generateStimuli(lens, ppnGos) {
	var allBlocks = new Array();
	for(i = 0; i < lens.length; i++) {
		currBlock = Array(Math.round(lens[i]*ppnGos[i])).fill(true).concat(
			Array(Math.round(lens[i]*(1 - ppnGos[i]))).fill(false));
		allBlocks = allBlocks.concat(sample(currBlock, currBlock.length));
	}
	return allBlocks;
}

function sample(urInArray, nSamples) {
	// If nSamples > 1, return array, else return single element
	var inArray = urInArray.slice(0); // Don't alter original array
	var outArray = [], i, idx;
	for(i = 0; i < nSamples; i++) {
		idx = Math.floor(Math.random()*inArray.length);
		outArray.push(inArray.splice(idx, 1)[0]);
	}
	if(nSamples > 1) {
		return outArray;
	} else {
		return outArray[0];
	}
}