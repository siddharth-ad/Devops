// Play character sounds on phone-sized touch devices only.
(function () {
  const buddies = document.querySelector(".github-buddies");
  const phoneTouch = window.matchMedia("(pointer: coarse) and (max-width: 600px)");
  if (!buddies || !phoneTouch.matches) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    console.warn("Character sounds are unavailable because Web Audio is not supported.");
    return;
  }

  let audioContext;

  function playTone(frequency, endFrequency, startTime, duration, type, volume) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  function playCharacterSound(character) {
    try {
      if (!audioContext) audioContext = new AudioContextClass();
      audioContext.resume().then(() => {
        const now = audioContext.currentTime;
        if (character === "duck") {
          playTone(520, 185, now, 0.24, "sawtooth", 0.045);
          playTone(310, 145, now + 0.19, 0.22, "triangle", 0.035);
        } else {
          playTone(620, 430, now, 0.2, "triangle", 0.035);
          playTone(820, 360, now + 0.16, 0.32, "triangle", 0.03);
        }
      }).catch((error) => {
        console.error("Could not play the character sound:", error);
      });
    } catch (error) {
      console.error("Could not initialize character sounds:", error);
    }
  }

  buddies.addEventListener("click", (event) => {
    if (!phoneTouch.matches || !(event.target instanceof Element)) return;
    const buddy = event.target.closest(".buddy.duck, .buddy.cat");
    if (!buddy || !buddies.contains(buddy)) return;

    playCharacterSound(buddy.classList.contains("duck") ? "duck" : "cat");
    buddy.classList.remove("pop");
    void buddy.offsetWidth;
    buddy.classList.add("pop");
    window.setTimeout(() => buddy.classList.remove("pop"), 500);
  });
})();
