(() => {
  const button = document.getElementById("welcomeVoiceButton");
  const label = document.getElementById("welcomeVoiceLabel");
  const audio = document.getElementById("welcomeAudio");
  if (!button || !label || !audio) return;

  function playWelcome() {
    audio.pause();
    audio.currentTime = 0;

    const playback = audio.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {
        label.textContent = "Tap to hear welcome";
      });
    }
  }

  button.addEventListener("click", playWelcome);
  audio.addEventListener("play", () => {
    label.textContent = "Playing welcome...";
    button.setAttribute("aria-label", "Welcome is playing");
  });
  audio.addEventListener("ended", () => {
    label.textContent = "Hear welcome again";
    button.setAttribute("aria-label", "Play the spoken welcome again");
  });
  audio.addEventListener("error", () => {
    label.textContent = "Tap to retry welcome";
    button.setAttribute("aria-label", "Retry the spoken welcome");
  });

  window.addEventListener("load", () => {
    window.setTimeout(playWelcome, 500);
  }, { once: true });
})();
