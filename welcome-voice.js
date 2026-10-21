(() => {
  const audio = document.getElementById("welcomeAudio");
  const mascot = document.getElementById("mascot");
  if (!audio || !mascot) return;

  let hasPlayed = false;
  let playbackPending = false;

  function getGreetingAudio() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "media/welcome-morning.wav";
    if (hour >= 12 && hour < 17) return "media/welcome-afternoon.wav";
    return "media/welcome-evening.wav";
  }

  function playWelcome() {
    if (hasPlayed || playbackPending) return;
    playbackPending = true;
    if (!audio.src) audio.src = getGreetingAudio();

    const playback = audio.play();
    if (playback && typeof playback.then === "function") {
      playback.then(markAsPlayed).catch(() => {
        playbackPending = false;
      });
    }
  }

  function onFirstInteraction() {
    playWelcome();
  }

  function markAsPlayed() {
    hasPlayed = true;
    playbackPending = false;
    window.removeEventListener("pointerdown", onFirstInteraction);
    window.removeEventListener("keydown", onFirstInteraction);
  }

  audio.addEventListener("play", () => {
    markAsPlayed();
    mascot.classList.add("is-speaking");
  });
  audio.addEventListener("pause", () => mascot.classList.remove("is-speaking"));
  audio.addEventListener("ended", () => mascot.classList.remove("is-speaking"));
  audio.addEventListener("error", () => mascot.classList.remove("is-speaking"));

  window.addEventListener("pointerdown", onFirstInteraction);
  window.addEventListener("keydown", onFirstInteraction);

  window.addEventListener("load", () => {
    playWelcome();
  }, { once: true });
})();
