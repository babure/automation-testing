let shouldTrack = false; // Initialize a variable to track whether we should record events

const getXPath = (element) => {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  } else if (element === document.body) {
    return "/html/body";
  }

  let ix = 0;
  const siblings = element.parentNode.childNodes;
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return `${getXPath(
        element.parentNode
      )}/${element.tagName.toLowerCase()}[${ix + 1}]`;
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
};

const getCssSelector = (element) => {
  if (!(element instanceof Element)) return;
  const id = element.id ? `#${element.id}` : "";
  const classes = element.className
    ? `.${Array.from(element.classList).join(".")}`
    : "";
  const tagName = element.tagName.toLowerCase();
  const parent = element.parentElement;

  let selector = tagName + classes + id;

  if (parent) {
    const parentSelector = getCssSelector(parent);
    selector = `${parentSelector} > ${selector}`;
  }

  return selector;
};

// Function to get details of an element
const getElementDetails = (element) => {
  const xpath = getXPath(element);
  const cssSelector = getCssSelector(element);

  return {
    xpath: xpath,
    text: element.innerText || element.value || element.tagName,
    type: element.tagName.toLowerCase(),
    id: element.id || "N/A",
    classes: element.className || "N/A",
    name: element.name || "N/A",
    value: element.value || "N/A",
    disabled: element.disabled ? "Yes" : "No",
    visible: !!(
      element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length
    )
      ? "Yes"
      : "No",
    cssSelector: cssSelector,
  };
};
let recordedInteractions = [];

const recordInteraction = (eventType, element) => {
  const elementDetails = getElementDetails(element);
  const currentUrl = window.location.href;
  recordedInteractions.push({
    eventType,
    elementDetails,
    timestamp: Date.now(),
    url: currentUrl,
  });
  chrome.storage.local.set({ recordedInteractions });
};

// Function to handle element interactions
const handleElementInteraction = (event) => {
  if (!shouldTrack) return; // Only proceed if tracking is enabled

  const element = event.target;

  if (element instanceof Element) {
    const elementDetails = getElementDetails(element);
    recordInteraction(event.type, element);

    if (element.tagName.toLowerCase() === "input") {
      // For input elements, update existing value
      chrome.storage.local.get("trackedElements", (result) => {
        const trackedElements = result.trackedElements || [];
        const existingEntryIndex = trackedElements.findIndex(
          (trackedElement) => trackedElement.xpath === elementDetails.xpath
        );

        if (existingEntryIndex !== -1) {
          // Update the value of the existing entry
          trackedElements[existingEntryIndex].value = element.value;
        } else {
          // Add a new entry if it doesn't exist
          trackedElements.push(elementDetails);
        }

        chrome.storage.local.set({ trackedElements }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error saving tracked elements:",
              chrome.runtime.lastError
            );
          } else {
            chrome.runtime.sendMessage({
              type: "elementDetails",
              data: trackedElements[
                existingEntryIndex !== -1
                  ? existingEntryIndex
                  : trackedElements.length - 1
              ],
            });
          }
        });
      });
    } else {
      // For button clicks (and other elements), always add a new record
      chrome.storage.local.get("trackedElements", (result) => {
        const trackedElements = result.trackedElements || [];
        console.log(trackedElements);

        // Always push a new entry for button clicks and other non-input elements
        trackedElements.push(elementDetails);

        chrome.storage.local.set({ trackedElements }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error saving tracked elements:",
              chrome.runtime.lastError
            );
          } else {
            chrome.runtime.sendMessage({
              type: "elementDetails",
              data: elementDetails,
            });
          }
        });
      });
    }
  }
};

const clearRecordedInteractions = () => {
  recordedInteractions = [];
  chrome.storage.local.set({ recordedInteractions });
};

// Find clickable elements
const findClickableElements = () => {
  const elements = document.querySelectorAll(
    `a, button, input[type='submit'], input[type='button'], input, form, [onclick],
   .cursor-pointer, [role='button'], [role='link'], [data-link], [data-nav],
   div[tabindex='0'], span[tabindex='0'], .router-link, [data-route],[data-action='navigate'], [data-clickable='true'], [ng-click]`
  );

  const currentUrl = window.location.href;

  const clickableElements = {
    pageLink: currentUrl,
    harvestedData: [],
  };

  elements.forEach((element) => {
    const elementData = getElementDetails(element);
    clickableElements.harvestedData.push(elementData);
  });

  chrome.storage.local.remove("clickableElements", () => {
    chrome.storage.local.set({ clickableElements }, () => {
      chrome.runtime.sendMessage({ type: "dataUpdated" });
    });
  });
};

const initDOMObserver = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "childList" ||
        mutation.type === "attributes" ||
        mutation.type === "subtree"
      ) {
        findClickableElements();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

const hookIntoNavigationEvents = () => {
  window.addEventListener("popstate", findClickableElements);

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    findClickableElements();
  };
};

// Initialize observers and collectors
window.addEventListener("load", () => {
  findClickableElements();
  initDOMObserver();
  hookIntoNavigationEvents();

  document.addEventListener("click", handleElementInteraction);
  document.addEventListener("input", handleElementInteraction);
});

let previouslyHighlightedElement = null;

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "toggleTracking") {
    shouldTrack = request.shouldTrack;
    if (!shouldTrack) {
      clearRecordedInteractions();
    }
    console.log("Tracking enabled:", shouldTrack);
  } else if (request.xpath) {
    const element = document.evaluate(
      request.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    if (element) {
      if (previouslyHighlightedElement) {
        previouslyHighlightedElement.classList.remove("highlight");
      }

      element.classList.add("highlight");
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      previouslyHighlightedElement = element;

      setTimeout(() => {
        previouslyHighlightedElement.classList.remove("highlight");
      }, 5000);
    } else {
      console.error(`Element not found for XPath: ${request.xpath}`);
    }
  }
});
