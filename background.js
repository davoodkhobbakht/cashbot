chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "PREDICT_CRASH") {
      const hasOffscreen = await chrome.offscreen.hasDocument();
      if (!hasOffscreen) {
        await chrome.offscreen.createDocument({
          url: "offscreen.html",
          reasons: ["DOM_SCRAPING"],
          justification: "TensorFlow prediction"
        });
      }
  
      chrome.runtime.sendMessage({ type: "RUN_PREDICTION", payload: message.payload });
    }
  });