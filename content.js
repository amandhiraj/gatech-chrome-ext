(function () {
  window.addEventListener("load", () => {
    try {
      const groupWeights = parseGroupWeights();
      const assignmentData = parseAssignmentRows();
      const summary = computeSummary(assignmentData, groupWeights);
      insertRightSidebarSummary(summary);
      addGradeSummaryTab();
      updateDetailedBreakdown(summary);
    } catch (e) {
      console.error("Error computing grade summary:", e);
    }
  });

  function parseGroupWeights() {
    const weights = {};
    const container = document.getElementById("assignments-not-weighted");
    if (!container) return weights;
    const table = container.querySelector("table.summary");
    if (!table) return weights;
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
      const groupCell = row.querySelector("th[scope='row']");
      const weightCell = row.querySelector("td");
      if (!groupCell || !weightCell) return;
      const groupName = groupCell.textContent.trim();
      let weightText = weightCell.textContent.trim();
      if (weightText.endsWith("%")) weightText = weightText.slice(0, -1);
      const w = parseFloat(weightText);
      if (!isNaN(w)) weights[groupName] = w;
    });
    return weights;
  }

  function parseAssignmentRows() {
    const data = {};
    const rows = document.querySelectorAll("#grades_summary tr.student_assignment:not(.group_total)");
    rows.forEach(row => {
      const contextEl = row.querySelector("div.context");
      if (!contextEl) return;
      const groupName = contextEl.textContent.trim();
      let title = "";
      const link = row.querySelector("th.title a");
      if (link) {
        title = link.textContent.trim();
      } else {
        const titleCell = row.querySelector("th.title");
        if (titleCell) title = titleCell.textContent.trim();
      }
      let grade = null;
      const gradeSpan = row.querySelector("td.assignment_score .score_holder span.grade");
      if (gradeSpan) {
        const text = gradeSpan.textContent.trim();
        const earnedMatch = text.match(/(\d+(?:\.\d+)?)\s*$/);
        if (earnedMatch) {
          const earned = parseFloat(earnedMatch[1]);
          const possibleSpan = gradeSpan.nextElementSibling;
          if (possibleSpan) {
            let possibleText = possibleSpan.textContent.trim().replace("/", "").trim();
            const possibleMatch = possibleText.match(/(\d+(?:\.\d+)?)/);
            if (possibleMatch) {
              const possible = parseFloat(possibleMatch[1]);
              if (!isNaN(earned) && !isNaN(possible) && possible > 0) {
                grade = (earned / possible) * 100;
              }
            }
          }
        }
      }
      if (!data[groupName]) data[groupName] = { total: 0, graded: 0, items: [] };
      data[groupName].total++;
      if (grade !== null && !isNaN(grade)) {
        data[groupName].graded++;
        data[groupName].items.push({ title, grade });
      } else {
        data[groupName].items.push({ title, grade: null });
      }
    });
    return data;
  }

  function computeSummary(assignmentData, groupWeights) {
    const summary = { groups: [], totalEffectiveWeight: 0, totalContribution: 0, overall: null };
    for (const group in assignmentData) {
      const d = assignmentData[group];
      const w = groupWeights[group] || 0;
      const graded = d.items.filter(item => item.grade !== null);
      const fraction = d.total > 0 ? graded.length / d.total : 0;
      const effW = w * fraction;
      let groupAvg = 0;
      if (graded.length > 0) groupAvg = graded.reduce((acc, cur) => acc + cur.grade, 0) / graded.length;
      const contribution = groupAvg * effW;
      summary.groups.push({
        group,
        fullWeight: w,
        total: d.total,
        gradedCount: graded.length,
        fraction,
        groupAverage: groupAvg,
        effectiveWeight: effW,
        contribution,
        items: d.items
      });
      summary.totalEffectiveWeight += effW;
      summary.totalContribution += contribution;
    }
    summary.overall =
      summary.totalEffectiveWeight > 0
        ? summary.totalContribution / summary.totalEffectiveWeight
        : null;
    return summary;
  }

  function insertRightSidebarSummary(summary) {
    const container = document.createElement("div");
    container.id = "simple-grade-summary";
    container.style.border = "2px solid #888";
    container.style.padding = "10px";
    container.style.marginBottom = "10px";
    container.style.backgroundColor = "#fafafa";
    container.style.fontFamily = "sans-serif";
    container.style.maxWidth = "350px";
    container.style.boxSizing = "border-box";

    const heading = document.createElement("h2");
    heading.textContent = "Current Weighted Grade";
    heading.style.fontSize = "1rem";
    heading.style.marginBottom = "8px";
    container.appendChild(heading);

    const overallP = document.createElement("p");
    overallP.style.fontSize = "1.1rem";
    overallP.style.fontWeight = "bold";
    overallP.textContent = `Overall: ${
      summary.overall !== null ? summary.overall.toFixed(2) + "%" : "N/A"
    }`;
    container.appendChild(overallP);

    const detailBtn = document.createElement("button");
    detailBtn.textContent = "Show Detailed Breakdown";
    detailBtn.style.margin = "8px 0";
    detailBtn.style.padding = "6px 12px";
    detailBtn.style.fontSize = "0.9rem";
    detailBtn.style.cursor = "pointer";
    container.appendChild(detailBtn);

    detailBtn.addEventListener("click", () => {
      const anchor = document.querySelector('a[href="#grade-summary-tab"]');
      if (anchor) anchor.click();
    });

    const createdByRow = document.createElement("div");
    createdByRow.style.display = "flex";
    createdByRow.style.alignItems = "center";
    createdByRow.style.gap = "8px";
    createdByRow.style.marginTop = "8px";
    createdByRow.style.fontSize = "0.75rem";
    createdByRow.style.color = "rgba(0,0,0,0.5)";

    const createdByText = document.createElement("span");
    createdByText.textContent = "Created by: amandhiraj";
    createdByRow.appendChild(createdByText);

    const ghLink = document.createElement("a");
    ghLink.href = "https://github.com/amandhiraj/gatech-chrome-ext";
    ghLink.target = "_blank";
    ghLink.title = "GitHub Repository";
    ghLink.innerHTML = `
      <svg height="16" viewBox="0 0 16 16" width="16" aria-hidden="true"
           style="fill: rgba(0,0,0,0.6); vertical-align: middle;">
        <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 
        2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 
        1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 
        0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 
        0 0 .67-.21 2.2.82A7.62 7.62 0 0 1 8 4.84c.68.003 1.37.092 2.01.27 
        1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 
        3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
      </svg>`;
    createdByRow.appendChild(ghLink);

    container.appendChild(createdByRow);

    const sidebar = document.getElementById("student-grades-right-content");
    if (sidebar) {
      const existing = document.getElementById("simple-grade-summary");
      if (existing) existing.remove();
      sidebar.prepend(container);
    }
  }

  function buildDetailedBreakdownHTML(summary) {
    let html = `<style>
      #grade-summary-detailed {
        max-width: 100%;
        margin: 10px auto;
        padding: 10px;
        background: #fafafa;
        border: 2px solid #888;
        font-family: sans-serif;
        box-sizing: border-box;
      }
      @media (max-width: 600px) {
        #grade-summary-detailed {
          max-width: 100%;
          margin: 5px;
          padding: 8px;
        }
      }
      .group-block { margin-top:10px; }
      .group-block ul { margin:4px 0 0 15px; font-size:0.85rem; }
    </style>
    <div id="grade-summary-detailed">`;
    summary.groups.forEach(g => {
      html += `<div class="group-block">
        <strong>${g.group}</strong><br>
        Full Weight: ${g.fullWeight.toFixed(2)}%<br>
        Graded: ${g.gradedCount}/${g.total} (Fraction: ${g.fraction.toFixed(2)})<br>
        Group Average: ${g.groupAverage.toFixed(2)}%<br>
        Effective Weight: ${g.effectiveWeight.toFixed(2)}% | Contribution: ${g.contribution.toFixed(2)}
      </div>`;
      if (g.items && g.items.length > 0) {
        html += `<ul>`;
        g.items.forEach(item => {
          if (item.grade !== null) {
            html += `<li>${item.title}: ${item.grade.toFixed(2)}%</li>`;
          } else {
            html += `<li>${item.title}: Not graded</li>`;
          }
        });
        html += `</ul>`;
      }
    });
    html += `</div>`;
    return html;
  }

  function addGradeSummaryTab() {
    const navTabs = document.getElementById("navpills");
    if (!navTabs) return;
    const newTab = document.createElement("li");
    newTab.className = "ui-state-default ui-corner-top";
    newTab.setAttribute("role", "tab");
    newTab.innerHTML = `<a href="#grade-summary-tab" class="ui-tabs-anchor" role="presentation">📊 Grade Summary</a>`;
    navTabs.appendChild(newTab);

    const newPanel = document.createElement("div");
    newPanel.id = "grade-summary-tab";
    newPanel.className = "ui-tabs-panel ui-widget-content ui-corner-bottom";
    newPanel.style.display = "none";
    newPanel.innerHTML = buildDetailedBreakdownHTML({ groups: [] });
    const content = document.getElementById("content");
    if (content) content.appendChild(newPanel);

    newTab.addEventListener("click", e => {
      e.preventDefault();
      const tabs = navTabs.querySelectorAll("li");
      tabs.forEach(t => t.classList.remove("ui-tabs-active", "ui-state-active"));
      newTab.classList.add("ui-tabs-active", "ui-state-active");
      document.querySelectorAll(".ui-tabs-panel").forEach(panel => (panel.style.display = "none"));
      updateDetailedBreakdown();
      newPanel.style.display = "block";
    });

    const otherTabAnchors = navTabs.querySelectorAll("li a");
    otherTabAnchors.forEach(anchor => {
      if (anchor.getAttribute("href") !== "#grade-summary-tab") {
        anchor.addEventListener("click", () => {
          newTab.classList.remove("ui-tabs-active", "ui-state-active");
          const gradePanel = document.getElementById("grade-summary-tab");
          if (gradePanel) gradePanel.style.display = "none";
        });
      }
    });
  }

  function updateDetailedBreakdown(summaryObj) {
    let summary = summaryObj;
    if (!summary) {
      const groupWeights = parseGroupWeights();
      const assignmentData = parseAssignmentRows();
      summary = computeSummary(assignmentData, groupWeights);
    }
    const panel = document.getElementById("grade-summary-tab");
    if (panel) panel.innerHTML = buildDetailedBreakdownHTML(summary);
  }
})();
