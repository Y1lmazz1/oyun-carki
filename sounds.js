
const spinSound = new Audio('sounds/spin.mp3');
const winSound = new Audio('sounds/win.mp3');


spinSound.loop = true;


function startSpinAudio() {
    spinSound.currentTime = 0;
    spinSound.play().catch(error => console.log("Ses oynatılamadı (Etkileşim gerekiyor):", error));
}


function stopSpinAudio() {
    spinSound.pause();
    spinSound.currentTime = 0;
    winSound.play().catch(error => console.log("Win sesi hatası:", error));
}