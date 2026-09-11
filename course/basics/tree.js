(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";


  var COLORS = [
    "#6d4bd1",
    "#2f6fbb",
    "#188b83",
    "#3b7d45",
    "#9b6a17",
    "#b6532d",
    "#b23a48",
    "#a23b89",
    "#7b51c6",
    "#246bb2",
    "#23786f",
    "#5a7f2a",
    "#ad5a25",
  ];

  var BRANCH_ENDPOINTS = [
    { x: 160, y: 650 },
    { x: 145, y: 520 },
    { x: 170, y: 390 },
    { x: 235, y: 270 },
    { x: 350, y: 175 },
    { x: 500, y: 110 },
    { x: 700, y: 80 },
    { x: 900, y: 110 },
    { x: 1050, y: 175 },
    { x: 1165, y: 270 },
    { x: 1230, y: 390 },
    { x: 1255, y: 520 },
    { x: 1240, y: 650 },
  ];
  var sections = window.ML_COURSE_SECTIONS || [];
  var treeSvg = document.getElementById("knowledge-tree");
  var treeCanvas = document.getElementById("knowledge-tree-canvas");
  var tooltip = document.getElementById("tree-tooltip");
  var tabs = document.getElementById("tree-chapter-tabs");
  var inspector = document.getElementById("knowledge-tree-inspector");

  if (!sections.length || !treeSvg || !treeCanvas || !tooltip || !tabs || !inspector) {
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = {
    activeSectionIndex: 0,
    activeTopicNumber: null,
  };
  var branches = [];

  var chapterNodeBySectionId = {};
  var topicNodesByNumber = {};
  var inspectorLinksByNumber = {};

  function createSvgElement(tag, attributes) {
    var element = document.createElementNS(SVG_NS, tag);
    Object.keys(attributes || {}).forEach(function (name) {
      element.setAttribute(name, attributes[name]);
    });
    return element;
  }

  function appendSvg(parent, tag, attributes, text) {
    var element = createSvgElement(tag, attributes || {});
    if (typeof text === "string") {
      element.textContent = text;
    }
    parent.appendChild(element);
    return element;
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (typeof text === "string") {
      element.textContent = text;
    }
    return element;
  }

  function getChapterPage(section) {
    return "chapter-" + section.number + ".html";
  }

  function getLabelLines(title) {
    var compact = title
      .replace(/——/g, "·")
      .replace(/\s+vs\s+/gi, "/")
      .replace(/（[^）]*）/g, "")
      .trim();
    var characters = Array.from(compact);

    if (characters.length <= 8) {
      return [compact];
    }

    var splitAt = Math.ceil(characters.length / 2);
    return [
      characters.slice(0, splitAt).join("").trim(),
      characters.slice(splitAt).join("").trim(),
    ];
  }

  function cubicPoint(start, controlA, controlB, end, t) {
    var oneMinusT = 1 - t;
    return {
      x:
        oneMinusT * oneMinusT * oneMinusT * start.x +
        3 * oneMinusT * oneMinusT * t * controlA.x +
        3 * oneMinusT * t * t * controlB.x +
        t * t * t * end.x,
      y:
        oneMinusT * oneMinusT * oneMinusT * start.y +
        3 * oneMinusT * oneMinusT * t * controlA.y +
        3 * oneMinusT * t * t * controlB.y +
        t * t * t * end.y,
    };
  }

  function cubicDerivative(start, controlA, controlB, end, t) {
    var oneMinusT = 1 - t;
    return {
      x:
        3 * oneMinusT * oneMinusT * (controlA.x - start.x) +
        6 * oneMinusT * t * (controlB.x - controlA.x) +
        3 * t * t * (end.x - controlB.x),
      y:
        3 * oneMinusT * oneMinusT * (controlA.y - start.y) +
        6 * oneMinusT * t * (controlB.y - controlA.y) +
        3 * t * t * (end.y - controlB.y),
    };
  }

  function getBranchLayout(section, index) {
    var progress = sections.length === 1 ? 0.5 : index / (sections.length - 1);
    var angle = ((190 + progress * 160) * Math.PI) / 180;
    var origin = {
      x: 700,
      y: 820 - progress * 300,
    };
    var end = {
      x: BRANCH_ENDPOINTS[index] ? BRANCH_ENDPOINTS[index].x : 700 + Math.cos(angle) * 520,
      y: BRANCH_ENDPOINTS[index] ? BRANCH_ENDPOINTS[index].y : 700 + Math.sin(angle) * 390,
    };
    var side = end.x < 699 ? -1 : end.x > 701 ? 1 : index % 2 === 0 ? -1 : 1;
    var controlA = {
      x: 700 + side * 105,
      y: origin.y - 72,
    };
    var controlB = {
      x: end.x - side * 125,
      y: end.y + 52,
    };

    return {
      section: section,
      index: index,
      color: COLORS[index % COLORS.length],
      origin: origin,
      controlA: controlA,
      controlB: controlB,
      end: end,
      side: side,
    };
  }

  function buildDefinitions() {
    var defs = appendSvg(treeSvg, "defs");

    var trunkGradient = appendSvg(defs, "linearGradient", {
      id: "trunkGradient",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
    });
    appendSvg(trunkGradient, "stop", { offset: "0%", "stop-color": "#4d3a62" });
    appendSvg(trunkGradient, "stop", { offset: "48%", "stop-color": "#76577e" });
    appendSvg(trunkGradient, "stop", { offset: "100%", "stop-color": "#4f3b65" });

    var nodeShadow = appendSvg(defs, "filter", {
      id: "nodeShadow",
      x: "-35%",
      y: "-35%",
      width: "170%",
      height: "170%",
    });
    appendSvg(nodeShadow, "feDropShadow", {
      dx: "0",
      dy: "4",
      stdDeviation: "4",
      "flood-color": "#38294f",
      "flood-opacity": "0.2",
    });

    var branchGlow = appendSvg(defs, "filter", {
      id: "branchGlow",
      x: "-30%",
      y: "-30%",
      width: "160%",
      height: "160%",
    });
    appendSvg(branchGlow, "feGaussianBlur", {
      stdDeviation: "3",
      result: "blur",
    });
    var branchMerge = appendSvg(branchGlow, "feMerge");
    appendSvg(branchMerge, "feMergeNode", { in: "blur" });
    appendSvg(branchMerge, "feMergeNode", { in: "SourceGraphic" });

    var nodeFocus = appendSvg(defs, "filter", {
      id: "nodeFocus",
      x: "-50%",
      y: "-50%",
      width: "200%",
      height: "200%",
    });
    appendSvg(nodeFocus, "feDropShadow", {
      dx: "0",
      dy: "3",
      stdDeviation: "5",
      "flood-color": "#34234f",
      "flood-opacity": "0.38",
    });
  }

  function buildCanopy() {
    var canopy = appendSvg(treeSvg, "g", { class: "tree-canopy" });
    [
      { cx: 700, cy: 300, rx: 390, ry: 225, rotate: -4 },
      { cx: 415, cy: 430, rx: 230, ry: 235, rotate: -18 },
      { cx: 985, cy: 430, rx: 230, ry: 235, rotate: 18 },
      { cx: 550, cy: 220, rx: 230, ry: 175, rotate: -10 },
      { cx: 850, cy: 220, rx: 230, ry: 175, rotate: 10 },
    ].forEach(function (cloud) {
      appendSvg(canopy, "ellipse", {
        class: "tree-canopy-cloud",
        cx: cloud.cx,
        cy: cloud.cy,
        rx: cloud.rx,
        ry: cloud.ry,
        transform: "rotate(" + cloud.rotate + " " + cloud.cx + " " + cloud.cy + ")",
      });
    });

    [
      [250, 430, -34],
      [330, 250, 24],
      [450, 140, -18],
      [590, 325, 28],
      [700, 110, -8],
      [820, 320, -26],
      [945, 145, 18],
      [1075, 255, -25],
      [1160, 440, 30],
      [380, 560, -28],
      [1020, 560, 25],
    ].forEach(function (leaf) {
      appendSvg(canopy, "ellipse", {
        class: "tree-canopy-leaf",
        cx: leaf[0],
        cy: leaf[1],
        rx: 24,
        ry: 11,
        transform: "rotate(" + leaf[2] + " " + leaf[0] + " " + leaf[1] + ")",
      });
    });
  }

  function buildTrunk() {
    appendSvg(treeSvg, "ellipse", {
      class: "tree-ground",
      cx: 700,
      cy: 845,
      rx: 255,
      ry: 30,
    });

    appendSvg(treeSvg, "path", {
      class: "tree-trunk-shadow",
      d: "M 686 835 C 692 724 697 648 702 510 L 752 510 C 756 649 761 729 770 843 C 744 858 711 858 686 835 Z",
    });

    [
      "M 700 836 C 680 855 633 875 588 887",
      "M 704 836 C 722 858 775 880 822 888",
      "M 698 842 C 683 865 659 886 631 897",
      "M 706 842 C 724 867 754 888 786 898",
    ].forEach(function (pathData) {
      appendSvg(treeSvg, "path", {
        class: "tree-root",
        d: pathData,
        "stroke-width": "5",
      });
    });

    appendSvg(treeSvg, "path", {
      class: "tree-trunk",
      d: "M 650 842 C 666 742 674 660 678 506 L 722 506 C 726 660 734 742 750 842 C 721 862 682 862 650 842 Z",
    });
  }

  function buildChapterNode(branch) {
    var group = createSvgElement("g", {
      class: "tree-node tree-chapter-node",
      id: "tree-" + branch.section.id,
      transform: "translate(" + branch.end.x + " " + branch.end.y + ")",
      tabindex: "0",
      role: "button",
      "aria-label": "第 " + branch.section.number + " 章，" + branch.section.title + "，" + branch.section.topics.length + " 个知识点",
      "data-section-id": branch.section.id,
    });
    group.style.setProperty("--chapter-color", branch.color);

    appendSvg(group, "rect", {
      class: "chapter-node-bg",
      x: "-71",
      y: "-31",
      width: "142",
      height: "62",
      rx: "15",
    });
    appendSvg(group, "circle", {
      class: "chapter-node-number-bg",
      cx: "-51",
      cy: "0",
      r: "14",
    });
    appendSvg(group, "text", {
      class: "chapter-node-number",
      x: "-51",
      y: "4",
      "text-anchor": "middle",
    }, branch.section.number);

    var lines = getLabelLines(branch.section.title);
    var title = appendSvg(group, "text", {
      class: "chapter-node-title",
      x: "-29",
      y: lines.length === 1 ? "5" : "-2",
      "text-anchor": "start",
    });
    lines.forEach(function (line, lineIndex) {
      appendSvg(title, "tspan", {
        x: "-29",
        dy: lineIndex === 0 ? "0" : "18",
      }, line);
    });

    function activate() {
      selectChapter(branch.index, null, false);
    }

    group.addEventListener("click", activate);
    group.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
    group.addEventListener("mouseenter", function () {
      showTooltip(group, "第 " + branch.section.number + " 章", branch.section.title);
    });
    group.addEventListener("mouseleave", hideTooltip);
    group.addEventListener("focus", function () {
      showTooltip(group, "第 " + branch.section.number + " 章", branch.section.title);
    });
    group.addEventListener("blur", hideTooltip);

    return group;
  }

  function buildTopicNode(branch, topic, topicIndex) {
    var topicCount = branch.section.topics.length;
    var start = topicCount === 1 ? 0.58 : 0.28;
    var end = topicCount === 1 ? 0.58 : 0.9;
    var t = topicCount === 1 ? start : start + ((end - start) * topicIndex) / (topicCount - 1);
    var branchPoint = cubicPoint(
      branch.origin,
      branch.controlA,
      branch.controlB,
      branch.end,
      t,
    );
    var derivative = cubicDerivative(
      branch.origin,
      branch.controlA,
      branch.controlB,
      branch.end,
      t,
    );
    var derivativeLength = Math.hypot(derivative.x, derivative.y) || 1;
    var normal = {
      x: -derivative.y / derivativeLength,
      y: derivative.x / derivativeLength,
    };
    var direction = topicIndex % 2 === 0 ? 1 : -1;
    var offset = 24 + (topicIndex % 3) * 2;
    var nodePoint = {
      x: branchPoint.x + normal.x * direction * offset,
      y: branchPoint.y + normal.y * direction * offset,
    };

    var group = createSvgElement("g", {
      class: "tree-node tree-topic-node",
      id: "tree-topic-" + topic.number,
      transform: "translate(" + nodePoint.x + " " + nodePoint.y + ")",
      tabindex: "0",
      role: "button",
      "aria-label": "第 " + topic.number + " 个知识点，" + topic.title,
      "data-section-id": branch.section.id,
      "data-topic-number": String(topic.number),
    });
    group.style.setProperty("--chapter-color", branch.color);

    appendSvg(group, "path", {
      class: "topic-node-stem",
      d:
        "M " + (branchPoint.x - nodePoint.x) + " " + (branchPoint.y - nodePoint.y) +
        " L 0 0",
    });
    appendSvg(group, "circle", {
      class: "topic-node-circle",
      cx: "0",
      cy: "0",
      r: "10.5",
    });
    appendSvg(group, "text", {
      class: "topic-node-number",
      x: "0",
      y: "3",
      "text-anchor": "middle",
    }, String(topic.number));

    function activate() {
      selectChapter(branch.index, topic.number, true);
    }

    group.addEventListener("click", activate);
    group.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
    group.addEventListener("mouseenter", function () {
      showTooltip(group, "知识点 " + String(topic.number).padStart(2, "0"), topic.title);
    });
    group.addEventListener("mouseleave", hideTooltip);
    group.addEventListener("focus", function () {
      showTooltip(group, "知识点 " + String(topic.number).padStart(2, "0"), topic.title);
    });
    group.addEventListener("blur", hideTooltip);

    topicNodesByNumber[topic.number] = group;
    return group;
  }

  function buildBranches() {
    var branchLayer = appendSvg(treeSvg, "g", { class: "tree-branches" });
    var topicLayer = appendSvg(treeSvg, "g", { class: "tree-topics" });
    var chapterLayer = appendSvg(treeSvg, "g", { class: "tree-chapters" });

    sections.forEach(function (section, index) {
      var branch = getBranchLayout(section, index);
      branch.id = section.id;
      branch.path = appendSvg(branchLayer, "path", {
        class: "tree-branch",
        id: "branch-" + section.id,
        d:
          "M " + branch.origin.x + " " + branch.origin.y +
          " C " + branch.controlA.x + " " + branch.controlA.y +
          " " + branch.controlB.x + " " + branch.controlB.y +
          " " + branch.end.x + " " + branch.end.y,
        "data-section-id": section.id,
      });
      branch.path.style.setProperty("--chapter-color", branch.color);

      if (!reduceMotion) {
        var pathLength = branch.path.getTotalLength();
        branch.path.style.strokeDasharray = pathLength;
        branch.path.style.strokeDashoffset = pathLength;
        branch.path.style.transition =
          "stroke-dashoffset 1.15s cubic-bezier(.2,.7,.2,1) " +
          (index * 0.045).toFixed(3) +
          "s, opacity .24s, stroke-width .24s, filter .24s";
      }

      branches.push(branch);


      section.topics.forEach(function (topic, topicIndex) {
        topicLayer.appendChild(buildTopicNode(branch, topic, topicIndex));
      });

      chapterNodeBySectionId[section.id] = buildChapterNode(branch);
      chapterLayer.appendChild(chapterNodeBySectionId[section.id]);
    });

    if (!reduceMotion) {
      requestAnimationFrame(function () {
        branches.forEach(function (branch) {
          branch.path.style.strokeDashoffset = "0";
        });
      });
    }
  }

  function renderTabs() {
    tabs.textContent = "";

    sections.forEach(function (section, index) {
      var button = createElement("button", "knowledge-tree-tab");
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.appendChild(createElement("span", "tab-number", section.number));
      button.appendChild(createElement("span", "tab-title", section.title));
      button.addEventListener("click", function () {
        selectChapter(index, null, false);
      });
      tabs.appendChild(button);
    });
  }

  function renderInspector() {
    var branch = branches[state.activeSectionIndex];
    var section = branch.section;
    inspector.textContent = "";
    inspectorLinksByNumber = {};
    inspector.style.setProperty("--active-color", branch.color);

    var summary = createElement("div", "tree-inspector-summary");
    var eyebrow = createElement("div", "tree-inspector-eyebrow");
    eyebrow.appendChild(createElement("span", "", "第 " + section.number + " 章"));
    eyebrow.appendChild(createElement("span", "", section.topics.length + " 个知识点"));
    summary.appendChild(eyebrow);
    summary.appendChild(createElement("h3", "", section.title));
    summary.appendChild(createElement("p", "", section.summary));

    var chapterLink = createElement("a", "button button-secondary", "阅读本章正文 →");
    chapterLink.href = getChapterPage(section);
    summary.appendChild(chapterLink);

    var grid = createElement("div", "tree-topic-grid");
    section.topics.forEach(function (topic) {
      var link = createElement("a", "tree-topic-link");
      link.href =
        getChapterPage(section) + "#" + section.id + "-topic-" + topic.number;
      link.setAttribute("data-topic-number", String(topic.number));
      link.style.setProperty("--active-color", branch.color);
      link.appendChild(createElement("span", "topic-number", String(topic.number)));
      link.appendChild(createElement("span", "topic-title", topic.title));
      link.appendChild(createElement("span", "topic-arrow", "→"));
      link.addEventListener("mouseenter", function () {
        previewTopic(topic.number);
      });
      link.addEventListener("mouseleave", applySelection);
      link.addEventListener("focus", function () {
        previewTopic(topic.number);
      });
      link.addEventListener("blur", applySelection);
      link.addEventListener("click", function () {
        state.activeTopicNumber = topic.number;
        applySelection();
      });
      inspectorLinksByNumber[topic.number] = link;
      grid.appendChild(link);
    });

    inspector.appendChild(summary);
    inspector.appendChild(grid);
  }

  function selectChapter(sectionIndex, topicNumber, moveToInspector) {
    if (sectionIndex < 0 || sectionIndex >= sections.length) {
      return;
    }

    state.activeSectionIndex = sectionIndex;
    state.activeTopicNumber = typeof topicNumber === "number" ? topicNumber : null;
    renderInspector();
    applySelection();

    if (moveToInspector && window.matchMedia("(max-width: 900px)").matches) {
      window.setTimeout(function () {
        inspector.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }, 40);
    }
  }

  function previewTopic(topicNumber) {
    Object.keys(topicNodesByNumber).forEach(function (number) {
      topicNodesByNumber[number].classList.toggle(
        "is-active",
        Number(number) === topicNumber,
      );
    });
  }

  function applySelection() {
    var activeSection = sections[state.activeSectionIndex];

    branches.forEach(function (branch) {
      var isActive = branch.index === state.activeSectionIndex;
      branch.path.classList.toggle("is-active", isActive);
      branch.path.classList.toggle("is-muted", !isActive);
      chapterNodeBySectionId[branch.id].classList.toggle("is-active", isActive);
      chapterNodeBySectionId[branch.id].classList.toggle("is-muted", !isActive);
    });

    Object.keys(topicNodesByNumber).forEach(function (number) {
      var node = topicNodesByNumber[number];
      var belongsToActiveSection = node.getAttribute("data-section-id") === activeSection.id;
      node.classList.toggle("is-muted", !belongsToActiveSection);
      node.classList.toggle(
        "is-active",
        belongsToActiveSection && Number(number) === state.activeTopicNumber,
      );
    });

    Object.keys(inspectorLinksByNumber).forEach(function (number) {
      inspectorLinksByNumber[number].classList.toggle(
        "is-active",
        Number(number) === state.activeTopicNumber,
      );
    });

    Array.prototype.forEach.call(tabs.querySelectorAll(".knowledge-tree-tab"), function (button, index) {
      button.setAttribute("aria-pressed", index === state.activeSectionIndex ? "true" : "false");
    });
  }

  function showTooltip(element, label, text) {
    tooltip.textContent = "";
    tooltip.appendChild(createElement("strong", "", label));
    tooltip.appendChild(createElement("span", "", text));
    tooltip.classList.add("is-visible");
    tooltip.setAttribute("aria-hidden", "false");

    var canvasRect = treeCanvas.getBoundingClientRect();
    var elementRect = element.getBoundingClientRect();
    var left = elementRect.left - canvasRect.left + elementRect.width / 2;
    var top = elementRect.top - canvasRect.top;
    left = Math.max(125, Math.min(treeCanvas.clientWidth - 125, left));
    top = Math.max(56, top);
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }

  function hideTooltip() {
    tooltip.classList.remove("is-visible");
    tooltip.setAttribute("aria-hidden", "true");
  }

  function updateCounts() {
    var topicCount = sections.reduce(function (total, section) {
      return total + section.topics.length;
    }, 0);
    var treeChapterCount = document.getElementById("tree-chapter-count");
    var treeTopicCount = document.getElementById("tree-topic-count");
    var summaryCount = document.getElementById("course-summary-count");

    if (treeChapterCount) {
      treeChapterCount.textContent = String(sections.length);
    }
    if (treeTopicCount) {
      treeTopicCount.textContent = String(topicCount);
    }
    if (summaryCount) {
      summaryCount.textContent = sections.length + " 章 / " + topicCount + " 点";
    }
  }

  buildDefinitions();
  buildCanopy();
  buildTrunk();
  buildBranches();
  renderTabs();
  updateCounts();
  selectChapter(0, null, false);
})();