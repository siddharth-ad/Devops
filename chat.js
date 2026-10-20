 <!-- ================= CHAT ASSISTANT ================= -->
  <button class="bot-launcher" id="botLauncher" type="button"
          aria-label="Open chat assistant" aria-expanded="false" aria-controls="botWindow">
    &#128172;
  </button>

  <section class="bot-window" id="botWindow" role="dialog" aria-label="Chat assistant" hidden>
    <header class="bot-header">
      <div>
        <strong>DevOps Assistant</strong>
        <span class="bot-sub"><i class="bot-dot"></i> Online</span>
      </div>
      <button class="bot-close" id="botClose" type="button" aria-label="Close chat">&#10005;</button>
    </header>

    <div class="bot-messages" id="botMessages" aria-live="polite"></div>
    <div class="bot-chips" id="botChips"></div>

    <form class="bot-form" id="botForm" autocomplete="off">
      <input id="botInput" type="text" placeholder="Ask about tools, projects..." aria-label="Type your question" maxlength="200">
      <button type="submit" aria-label="Send">&#10148;</button>
    </form>
  </section>
