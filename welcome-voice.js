(() => {
  const button = document.getElementById("welcomeVoiceButton");
  if (!button) return;

  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    button.disabled = true;
    button.textContent = "Voice greeting is not supported by this browser";
    return;
  }

  const greeting =
    "Welcome to Siddharth Adhikary's page. Please take a look around and explore my DevOps projects.";
  const feminineVoiceNames =
    /female|woman|samantha|sara|zira|aria|jenny|ava|allison|karen|moira|tessa|victoria|heera|neerja|priya/i;

  function getPreferredVoice() {
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang));
    return (
      englishVoices.find((voice) => feminineVoiceNames.test(voice.name) && /en[-_]IN/i.test(voice.lang)) ||
      englishVoices.find((voice) => feminineVoiceNames.test(voice.name)) ||
      englishVoices.find((voice) => /en[-_]IN/i.test(voice.lang)) ||
      englishVoices[0] ||
      null
    );
  }

  function speakWelcome() {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(greeting);
    const voice = getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-IN";
    }
    utterance.pitch = 1.12;
    utterance.rate = 0.95;
    utterance.onstart = () => {
      button.disabled = true;
      button.setAttribute("aria-label", "Welcome is being spoken");
    };
    utterance.onend = () => {
      button.disabled = false;
      button.setAttribute("aria-label", "Play the spoken welcome");
    };
    utterance.onerror = () => {
      button.disabled = false;
      button.setAttribute("aria-label", "Play the spoken welcome");
    };

    window.speechSynthesis.speak(utterance);
  }

  button.addEventListener("click", speakWelcome);

  window.addEventListener("load", () => {
    window.setTimeout(() => {
      if (!window.speechSynthesis.speaking) speakWelcome();
    }, 500);
  }, { once: true });
})();
