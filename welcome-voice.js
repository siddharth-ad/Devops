(() => {
  const audio = document.getElementById("welcomeAudio");
  const mascot = document.getElementById("mascot");
  if (!audio || !mascot) return;

  let hasPlayed = false;

  function getGreetingAudio() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "media/welcome-morning.wav";
    if (hour >= 12 && hour < 17) return "media/welcome-afternoon.wav";
    return "media/welcome-evening.wav";
  }

  function playWelcome() {
    if (hasPlayed) return;
    hasPlayed = true;
    audio.src = getGreetingAudio();
    const playback = audio.play();
    if (playback && typeof playback.catch === "function") playback.catch(() => {
      hasPlayed = false;
    });
  }

  function onFirstInteraction() {
    playWelcome();
    if (hasPlayed) {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    }
  }

  audio.addEventListener("play", () => mascot.classList.add("is-speaking"));
  audio.addEventListener("pause", () => mascot.classList.remove("is-speaking"));
  audio.addEventListener("ended", () => mascot.classList.remove("is-speaking"));
  audio.addEventListener("error", () => mascot.classList.remove("is-speaking"));

  window.addEventListener("load", () => {
    playWelcome();
    if (!hasPlayed) {
      window.addEventListener("pointerdown", onFirstInteraction);
      window.addEventListener("keydown", onFirstInteraction);
    }
  }, { once: true });
})();
