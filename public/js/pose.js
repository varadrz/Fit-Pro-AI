const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-cam');
const fdDisplay = document.getElementById('feedback-display');
const repDisplay = document.getElementById('rep-count');

let activeCam = null;
let exMode = 'squat';
let reps = 0, stage = 'up';
let lastSpoken = 0;
let touchState = [];

window.setExercise = function(mode) {
    exMode = mode;
    reps = 0; stage = 'up'; touchState = [];
    repDisplay.innerText = "0";
    fdDisplay.innerText = "Ready";
    document.querySelectorAll('.exercise-btn').forEach(b => {
        b.classList.toggle('btn-primary', b.dataset.exercise === mode);
        b.classList.toggle('btn-outline', b.dataset.exercise !== mode);
    });
};

function calculateAngle(a, b, c) {
    const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let ang = Math.abs(r * 180 / Math.PI);
    return ang > 180 ? 360 - ang : ang;
}
function dist(a,b) { return Math.hypot(a.x-b.x, a.y-b.y); }
function speak(t) {
    if(Date.now() - lastSpoken < 2500) return;
    lastSpoken = Date.now();
    speechSynthesis.speak(new SpeechSynthesisUtterance(t));
}

function processPose(results) {
    if(!results.poseLandmarks) return;
    ctx.clearRect(0,0, canvas.width, canvas.height);
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#22c55e', lineWidth: 2});
    drawLandmarks(ctx, results.poseLandmarks, {color: '#facc15', lineWidth: 1, radius: 3});
    
    const lm = results.poseLandmarks;
    if(exMode === 'squat' && lm[24] && lm[26] && lm[28] && lm[12]) {
        const kAngle = calculateAngle(lm[24], lm[26], lm[28]);
        const bAngle = calculateAngle(lm[12], lm[24], lm[26]);
        
        if (bAngle < 140) { fdDisplay.innerText = "Keep back straight!"; speak("Straighten your back"); }
        else {
            if(kAngle > 160) stage = 'up';
            if(kAngle < 100 && stage === 'up') {
                stage = 'down'; reps++; repDisplay.innerText = reps;
                fdDisplay.innerText = "Good rep!"; speak("Good");
            }
        }
    } else if (exMode === 'rotating_toe_touch' && lm[15] && lm[16] && lm[27] && lm[28]) {
        // 15: lh, 16: rh, 27: la, 28: ra
        const dR = dist(lm[16], lm[27]);
        const dL = dist(lm[15], lm[28]);
        
        if(dR < 0.15 && !touchState.includes('R')) { touchState.push('R'); speak("Right OK"); fdDisplay.innerText="Right"; }
        if(dL < 0.15 && !touchState.includes('L')) { touchState.push('L'); speak("Left OK"); fdDisplay.innerText="Left"; }
        
        if(touchState.length === 2) {
            reps++; repDisplay.innerText = reps; touchState = [];
            speak("Rep complete"); fdDisplay.innerText="Rep complete";
        }
    }
}

const pose = new Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
pose.setOptions({ modelComplexity: 1, smoothLandmarks: true });
pose.onResults(processPose);

startBtn.onclick = () => {
    activeCam = new Camera(video, { onFrame: async ()=> await pose.send({image:video}), width: 640, height: 480 });
    activeCam.start(); startBtn.style.display='none';
};
window.stopCamera = () => { if(activeCam){ activeCam.stop(); activeCam=null; startBtn.style.display='block'; } };
