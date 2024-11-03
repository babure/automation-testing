chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Background Script

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "replayInteractions") {
    chrome.storage.local.get("recordedInteractions", (result) => {
      const interactions = result.recordedInteractions || [];
      console.log(JSON.stringify(interactions));
      const firstUrl =
        interactions.length > 0
          ? interactions[0].url
          : "https://www.saucedemo.com"; // Use a default URL

      // Create a new window instead of a new tab
      chrome.windows.create(
        {
          url: firstUrl,
          type: "popup", // You can use "normal" or "popup" based on your preference
          width: 800, // Set your desired width
          height: 600, // Set your desired height
        },
        (newWindow) => {
          const newTabId = newWindow.tabs[0].id; // Get the ID of the new tab in the window

          chrome.tabs.onUpdated.addListener(function onUpdated(
            tabId,
            changeInfo
          ) {
            if (tabId === newTabId && changeInfo.status === "complete") {
              chrome.tabs.onUpdated.removeListener(onUpdated); // Clean up the listener
              chrome.scripting.executeScript({
                target: { tabId: newTabId },
                function: replayScript,
                args: [interactions],
              });
            }
          });
        }
      );
    });
  }
});

const replayScript = (interactions) => {
  // Create an overlay message
  const createOverlayMessage = (message) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "10px";
    overlay.style.left = "50%";
    overlay.style.transform = "translateX(-50%)";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.color = "white";
    overlay.style.padding = "10px 20px";
    overlay.style.borderRadius = "5px";
    overlay.style.zIndex = "10000";
    overlay.textContent = message;
    document.body.appendChild(overlay);

    // Automatically remove the overlay after a certain period
    setTimeout(() => {
      overlay.remove();
    }, 3000); // Show the message for 3 seconds
  };

  createOverlayMessage("Playing recorded data from Hula...");

  const startTime = performance.now(); // Start timing the replay
  let previousTimestamp = interactions[0].timestamp; // Initialize the first timestamp

  const executeInteraction = (interaction) => {
    return new Promise((resolve) => {
      const { eventType, elementDetails } = interaction;

      const waitForElement = (xpath) => {
        return new Promise((resolve) => {
          const checkElement = setInterval(() => {
            const element = document.evaluate(
              xpath,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            ).singleNodeValue;
            if (element) {
              clearInterval(checkElement);
              resolve(element);
            }
          }, 100); // Check every 100ms
        });
      };

      waitForElement(elementDetails.xpath).then((element) => {
        switch (eventType) {
          case "click":
            element.click();
            resolve();
            break;
          case "input":
            element.value = elementDetails.value;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            resolve();
            break;
          case "scroll":
            window.scrollTo(
              0,
              element.getBoundingClientRect().top + window.scrollY
            );
            resolve();
            break;
          default:
            resolve(); // Resolve for unhandled events
        }
      });
    });
  };

  // Execute each interaction in sequence
  interactions
    .reduce((promiseChain, interaction) => {
      return promiseChain.then(() => {
        const currentTime = performance.now();
        const delay = interaction.timestamp - previousTimestamp; // Calculate delay based on timestamps
        previousTimestamp = interaction.timestamp; // Update timestamp

        return new Promise((resolve) => {
          setTimeout(
            () => {
              executeInteraction(interaction).then(resolve);
            },
            delay > 0 ? delay : 0
          ); // Ensure no negative delay
        });
      });
    }, Promise.resolve())
    .then(() => {
      // Once all interactions are completed, show a completion message
      createOverlayMessage("Replay completed!");
    });
};
