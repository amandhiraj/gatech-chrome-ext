document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error("No active tab found.");
        return;
      }
      const container = document.getElementById("plugin-container");
      if (!container) {
        console.error("Container element not found.");
        return;
      }
      const currentURL = (tabs[0].url || "").trim();
      // Only proceed if URL starts with http(s)
      if (!currentURL.startsWith("http")) {
        container.innerHTML =
          `<div class="card"><p>This extension works only on web pages.</p></div>`;
        return;
      }
      try {
        const urlObj = new URL(currentURL);
        // Check that we're on the correct domain and the path is in the format /courses/{courseId}/grades
        const valid =
          urlObj.hostname.toLowerCase() === "gatech.instructure.com" &&
          /^\/courses\/[^\/]+\/grades(\/|$)/i.test(urlObj.pathname);
        if (!valid) {
          container.innerHTML = `
            <div class="card">
              <h3>Invalid Page</h3>
              <p>You are not on a valid Grades page.</p>
              <button id="go-button" class="btn">Go to Canvas</button>
            </div>
          `;
          document.getElementById("go-button").addEventListener("click", () => {
            chrome.tabs.update({ url: "https://gatech.instructure.com/courses/" });
          });
        } else {
          container.innerHTML = `
            <div class="card">
              <h3>Grades Plugin Active</h3>
              <p>Grades plugin is active on this page!</p>
            </div>
          `;
          // Insert your normal plugin UI here if needed.
        }
      } catch (e) {
        console.error("Invalid URL:", e);
        container.innerHTML =
          `<div class="card"><p>Invalid URL detected.</p></div>`;
      }
    });
  });
  