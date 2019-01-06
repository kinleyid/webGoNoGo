
var filename = 'defaultFilename'

var preFixationMs = 1000;
var fixationMs = 1000;
var postFixationMs = 0;
var allowResponsesMs = 2500; // How long should participants be allowed to respond?

var masterBlockwiseLengths = [20, 20, 20];
var masterBlockwisePpnGos = [0.8, 0.2, 0.5];
var masterIsGo = generateStimuli(masterBlockwiseLengths, masterBlockwisePpnGos)

var gamify = false;
if (gamify) {
	var maxPoints = 50, pointLoss = -maxPoints, currPoints;
	var pointsBarTimeIncr = 1000/60; // Roughly screen rate
	var addPointsTimeIncr = 1000/60; // Roughly screen rate
	var postFeedbackMs = 500;
    var pointsBarHolder = document.getElementById("pointsBarHolder");
    var pointsBar = document.getElementById("pointsBar");
    var pointsBarStopId;
    var score = 0;
    scoreArea.style.display = 'block';
} else {
    scoreArea.style.display = 'none';
}

var isPractice = true;
if (isPractice) {
	var practiceBlockwiseLengths = [20];
	var practiceBlockwisePpnGos = [0.8];
	var practiceIsGo = generateStimuli(practiceBlockwiseLengths, practiceBlockwisePpnGos)
}

var timeoutID, trialIdx, wasResponse = false, presentationTime = 0, responseTime = 0;

var ALL = document.getElementsByTagName("html")[0];
var dialogArea = document.getElementById("dialogArea");
var textArea = document.getElementById("textArea");

window.addEventListener("click", respondToInput);
window.onkeydown = respondToInput;
allowResponses = false;

outputText = 'Trial,IsGo,PresentationTime,ResponseTime\n';

function start() {
	if (isPractice) {
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
			if (postFixationMs > 0) {
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
	if (isGo[trialIdx]) {
		textArea.textContent = "M";
	} else {
		textArea.textContent = "W";
	}
	allowResponses = true;
	timeoutID = setTimeout(endTrial, allowResponsesMs);
	if (gamify) {
		currPoints = maxPoints;
		pointsBarStopId = setTimeout(function() {
			pointsBar.style.display = 'block';
			showPointsBar();
		}, pointsBarTimeIncr);
	}
	presentationTime = performance.now();
}

function showPointsBar() {
    if (currPoints >= 0) {
        pointsBar.style.backgroundColor = "rgb(" + 255*(maxPoints-currPoints)/maxPoints + "," + 255*currPoints/maxPoints + ",0)";
        pointsBar.style.height = currPoints/maxPoints*pointsBarHolder.clientHeight + 'px';
        pointsBar.style.top = (1 - currPoints/maxPoints)*pointsBarHolder.clientHeight + 'px';
        currPoints--;
        pointsBarStopId = setTimeout(showPointsBar,pointsBarTimeIncr);
    }
}

function respondToInput(event) {
	responseTime = performance.now();
	if (allowResponses && event.code == 'Space') {
		clearTimeout(timeoutID);
		endTrial();
	}
}

function endTrial() {
	allowResponses = false;
	textArea.textContent = ''
	outputText +=
		(isPractice? 0: trialIdx + 1) + ',' +
		isGo[trialIdx] + ',' +
		presentationTime + ',' +
		responseTime + '\n';
	
	if (gamify) {
        pointsBar.style.display = 'none';
        clearTimeout(pointsBarStopId);
		if (!isGo[trialIdx]) {
			currPoints = pointLoss;
		}
		addPoints(nextTrial);
    } else {
		nextTrial();
	}
}

function addPoints(nextFunction) {
    if (currPoints != 0) {
		incr = Math.sign(currPoints);
		if (incr < 0) {
			scoreArea.style.color = 'red';
		} else {
			scoreArea.style.color = 'green';
		}
        currPoints -= incr;
		score += incr;
		score = Math.max(0, score); // Don't allow negative scores
        scoreArea.textContent = "Score: " + score;
        setTimeout(
            function() {
                addPoints(nextFunction)
            },
            addPointsTimeIncr
        );
    } else {
        setTimeout(function() {
			scoreArea.style.color = 'black';
			nextFunction();
		}, postFeedbackMs);
    }
}

function nextTrial() {
	trialIdx++;
	if (trialIdx == isGo.length) {
		if (isPractice) {
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
        } else if (xhttp.status == 500) {
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
	for (i = 0; i < lens.length; i++) {
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
	for (i = 0; i < nSamples; i++) {
		idx = Math.floor(Math.random()*inArray.length);
		outArray.push(inArray.splice(idx, 1)[0]);
	}
	if (nSamples > 1) {
		return outArray;
	} else {
		return outArray[0];
	}
}