const { trainingAnimals, challengeAnimal } = window.DecisionTreeBirdsData;

const featureInfo = {
  flies: { name: "能否飞行", question: "这种动物会飞吗？", yes: "会飞", no: "不会飞" },
  feathers: { name: "是否有羽毛", question: "这种动物有羽毛吗？", yes: "有羽毛", no: "没有羽毛" },
  laysEggs: { name: "是否产卵", question: "这种动物会产卵吗？", yes: "会产卵", no: "不产卵" },
  wings: { name: "是否有翅膀", question: "这种动物有翅膀吗？", yes: "有翅膀", no: "没有翅膀" },
};

const $ = (selector) => document.querySelector(selector);
const elements = {
  tray: $("#animal-tray"), count: $("#sample-count"), hint: $("#selection-hint"),
  featureList: $("#feature-list"), question: $("#current-question-text"),
  yesHeading: $("#yes-heading"), noHeading: $("#no-heading"), yesZone: $("#yes-dropzone"), noZone: $("#no-dropzone"),
  yesCount: $("#yes-count"), noCount: $("#no-count"), start: $("#start-filter"), reset: $("#reset-experiment"), quickAnalysis: $("#quick-analysis"),
  robot: $("#lab-robot"), robotFrame: $("#lab-robot-frame"), message: $("#robot-message"), manualError: $("#manual-error"), skip: $("#skip-animation"),
  tree: $("#tree-canvas"), challenge: $("#challenge-sample"), challengeDescription: $("#challenge-description"), challengeComparison: $("#challenge-comparison"),
  progressValue: $(".hero-progress strong"), progressBar: $(".progress-track i"),
  filterView: $("#filter-view"), analysisView: $("#analysis-view"), analysisTree: $("#analysis-tree"),
  analysisRobot: $("#analysis-robot"), analysisCard: $("#analysis-card"), analysisTag: $("#analysis-tag"),
  analysisTitle: $("#analysis-title"), analysisCopy: $("#analysis-copy"), analysisVisual: $("#analysis-visual"),
  analysisStepLabel: $("#analysis-step-label"), analysisBack: $("#analysis-back"), analysisNext: $("#analysis-next"),
  analysisChallenge: $("#analysis-challenge"), returnFilter: $("#return-filter"), analysisReturnButton: $("#analysis-return-button"),
};

const selectedAnimals = new Set();
const retiredCards = document.createElement("div");
retiredCards.hidden = true;
document.body.append(retiredCards);
let featureOrder = [];
let selectedFeature = "flies";
let activeLevel = 0;
let currentCandidates = [];
let history = [];
let latestSplit = null;
let started = false;
let awaitingNext = false;
let running = false;
let skipRequested = false;
let runToken = 0;
let draggedFeature = null;
let analysisStep = 0;
const carryCardX = [79, 80, 80, 80, 82, 81];

Array.from({ length: 6 }, (_, i) => [`assets/robot-frames/walk-${i}.png`, `assets/robot-frames/carry-${i}.png`]).flat().forEach((src) => { const image = new Image(); image.src = src; });

function setProgress(level) {
  const value = Math.max(1, Math.min(4, level));
  elements.progressValue.textContent = `${value} / 4`;
  elements.progressBar.style.width = `${value * 25}%`;
}

function orderEditable() { return !running && (!started || history.length === 4); }

function refreshOrder() {
  const options = [...elements.featureList.querySelectorAll(".feature-option")];
  const previousOrder = featureOrder.join("|");
  featureOrder = options.map((option) => option.dataset.feature);
  selectedFeature = featureOrder[activeLevel] || featureOrder[0];
  options.forEach((option, index) => {
    option.querySelector("em").textContent = index + 1;
    option.classList.toggle("is-selected", index === activeLevel);
    option.disabled = !orderEditable();
    option.draggable = orderEditable();
    option.setAttribute("aria-label", `第 ${index + 1} 层：${featureInfo[option.dataset.feature].name}，可拖动排序`);
  });
  updateFeatureDisplay();
  renderTree();
  if (history.length === 4 && previousOrder && previousOrder !== featureOrder.join("|")) recalculateForCurrentOrder();
}

function updateFeatureDisplay() {
  const info = featureInfo[selectedFeature];
  if (!info) return;
  elements.question.textContent = `第 ${activeLevel + 1} 层：${info.question}`;
  elements.yesHeading.textContent = info.yes;
  elements.noHeading.textContent = info.no;
}

function renderTree() {
  elements.tree.innerHTML = `<div class="tree-level-list">${featureOrder.map((feature, index) => {
    const split = history[index];
    const state = split ? "is-complete" : index === activeLevel ? "is-current" : "is-pending";
    const incoming = split ? split.animals.length : index === activeLevel && currentCandidates.length ? currentCandidates.length : "—";
    const yes = split ? split.yes.length : "—";
    const no = split ? split.no.length : "—";
    const names = split?.no.map((animal) => animal.name).join("、") || "等待筛选";
    return `<section class="tree-level ${state}"><div class="tree-level-node"><small>第 ${index + 1} 层 · ${incoming} 只进入</small><strong>${featureInfo[feature].name}</strong></div><div class="tree-level-branches"><span class="tree-continue">是 · ${yes} 只继续</span><span class="tree-exit" title="${names}">否 · ${no} 只退出</span></div></section>`;
  }).join("")}</div>`;
}

function recalculateForCurrentOrder() {
  let candidates = trainingAnimals.filter((animal) => selectedAnimals.has(animal.id));
  history = featureOrder.map((feature) => {
    const split = buildSplit(candidates, feature);
    candidates = split.yes;
    return split;
  });
  activeLevel = 3;
  selectedFeature = featureOrder[3];
  latestSplit = history[3];
  currentCandidates = latestSplit.animals.slice();
  awaitingNext = false;
  resetZone(elements.yesZone); resetZone(elements.noZone);
  elements.yesCount.textContent = "0"; elements.noCount.textContent = "0";
  const finalIds = new Set(currentCandidates.map((animal) => animal.id));
  document.querySelectorAll(".animal-card").forEach((card) => {
    card.classList.remove("is-sorted", "is-transporting", "is-returning", "is-dragging");
    card.removeAttribute("style");
    if (!finalIds.has(card.dataset.animalId)) retiredCards.append(card);
  });
  latestSplit.yes.forEach((animal) => addToBranch(animal, true));
  latestSplit.no.forEach((animal) => addToBranch(animal, false));
  elements.start.disabled = false;
  elements.start.textContent = "查看更新后的结果分析";
  elements.message.textContent = "筛选顺序已改变，四层结果与下方分析已同步更新。";
  updateFeatureDisplay(); renderTree(); updateSummary(); renderAnalysisTree(); renderAnalysisStep();
  if ($(".challenge-result")) testChallenge();
}

function updateSummary() {
  if (started) {
    elements.count.textContent = `第 ${activeLevel + 1} 层 · 待筛选 ${currentCandidates.length} 只`;
    elements.hint.textContent = currentCandidates.length ? `本层候选：${currentCandidates.map((a) => a.name).join("、")}` : "本层没有剩余候选动物。";
  } else {
    elements.count.textContent = `起始样本 ${selectedAnimals.size} / ${trainingAnimals.length}`;
    elements.hint.textContent = "点击卡片可调整起始样本；拖动上方问题卡可改变四层顺序。";
  }
}

function createCard(animal) {
  const card = document.createElement("button");
  card.className = "animal-card";
  card.type = "button";
  card.dataset.animalId = animal.id;
  card.draggable = true;
  card.innerHTML = `<span class="animal-card-check" aria-hidden="true">✓</span><img src="${animal.image}" alt="" /><strong>${animal.name}</strong>`;
  card.addEventListener("click", () => {
    if (running || started) return;
    if (selectedAnimals.has(animal.id)) selectedAnimals.delete(animal.id); else selectedAnimals.add(animal.id);
    card.classList.toggle("is-selected", selectedAnimals.has(animal.id));
    card.setAttribute("aria-pressed", String(selectedAnimals.has(animal.id)));
    updateSummary();
  });
  card.addEventListener("dragstart", (event) => {
    if (!started) beginExperiment();
    if (running || awaitingNext || card.parentElement !== elements.tray || !currentCandidates.includes(animal)) { event.preventDefault(); return; }
    card.classList.add("is-dragging");
    event.dataTransfer.setData("text/plain", animal.id);
  });
  card.addEventListener("dragend", () => card.classList.remove("is-dragging"));
  return card;
}

function resetZone(zone) { zone.innerHTML = "<span>拖放到这里</span>"; }

function resetAll() {
  runToken += 1;
  running = false; started = false; awaitingNext = false; skipRequested = false;
  activeLevel = 0; currentCandidates = []; history = []; latestSplit = null; analysisStep = 0;
  elements.filterView.hidden = false; elements.analysisView.hidden = true; elements.analysisChallenge.hidden = true;
  document.querySelectorAll(".animal-card").forEach((card) => {
    card.className = "animal-card is-selected";
    card.removeAttribute("style"); card.disabled = false; card.draggable = true;
    card.setAttribute("aria-pressed", "true"); elements.tray.append(card);
  });
  selectedAnimals.clear(); trainingAnimals.forEach((animal) => selectedAnimals.add(animal.id));
  resetZone(elements.yesZone); resetZone(elements.noZone); elements.yesCount.textContent = "0"; elements.noCount.textContent = "0";
  elements.start.disabled = false; elements.start.textContent = "请 Iris 开始第 1 层筛选";
  elements.skip.hidden = true; elements.skip.disabled = false; elements.manualError.hidden = true;
  elements.robot.className = "lab-robot"; elements.robot.removeAttribute("style"); elements.robotFrame.src = "assets/robot-frames/walk-0.png";
  elements.message.classList.remove("is-complete"); elements.message.textContent = "我是 Iris，将按你排列的顺序逐层筛选。";
  elements.challenge.disabled = true; elements.challenge.className = "locked-sample";
  elements.challenge.innerHTML = "<span>?</span><strong>神秘动物</strong><small>完成学习后解锁</small>";
  elements.challenge.setAttribute("aria-expanded", "false");
  elements.challenge.setAttribute("aria-label", "神秘挑战样本尚未解锁");
  elements.challengeDescription.textContent = "完成指标学习后，神秘动物才会出现。";
  elements.challengeComparison.hidden = true; elements.challengeComparison.innerHTML = "";
  $(".challenge-result")?.remove(); setProgress(1); refreshOrder(); updateSummary();
}

function addToBranch(animal, answer) {
  const zone = answer ? elements.yesZone : elements.noZone;
  zone.querySelector(":scope > span")?.remove();
  const card = $(`.animal-card[data-animal-id="${animal.id}"]`);
  card.classList.remove("is-transporting"); card.classList.add("is-sorted"); card.removeAttribute("style");
  card.disabled = true; card.draggable = false; card.title = `${animal.name} · ${animal.isBird ? "鸟类" : "非鸟类"}`; zone.append(card);
  elements.yesCount.textContent = elements.yesZone.querySelectorAll(".animal-card").length;
  elements.noCount.textContent = elements.noZone.querySelectorAll(".animal-card").length;
}

function setRobotFrame(type, frame) { elements.robotFrame.src = `assets/robot-frames/${type}-${frame}.png`; }
function restoreRobotHome() {
  elements.robot.className = "lab-robot";
  elements.robot.removeAttribute("style");
  setRobotFrame("walk", 0);
}
function hand(frame, rect) { return { x: carryCardX[frame] / 175 * rect.width, y: 202 / 350 * rect.height, width: 72 / 175 * rect.width, height: 46 / 350 * rect.height }; }

function moveRobot({ from, to, type, duration, token, onMove }) {
  return new Promise((resolve) => {
    if (skipRequested || token !== runToken) return resolve(false);
    const start = performance.now(); const actual = matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : duration;
    elements.robot.classList.toggle("is-mirrored", to.x < from.x);
    function tick(now) {
      if (skipRequested || token !== runToken) return resolve(false);
      const p = Math.min(1, (now - start) / actual); const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const x = from.x + (to.x - from.x) * e; const y = from.y + (to.y - from.y) * e; const frame = Math.floor((now - start) / 100) % 6;
      elements.robot.style.transform = `translate3d(${x}px,${y}px,0)`; setRobotFrame(type, frame); onMove?.(x, y, frame);
      if (p < 1) requestAnimationFrame(tick); else resolve(true);
    }
    requestAnimationFrame(tick);
  });
}

function cardToHand(card, source, pickup, robotRect, token) {
  return new Promise((resolve) => {
    const anchor = hand(0, robotRect); const target = { x: pickup.x + anchor.x, y: pickup.y + anchor.y, width: anchor.width, height: anchor.height };
    const start = performance.now(); const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 60 : 180;
    card.classList.add("is-transporting"); Object.assign(card.style, { left: `${source.left}px`, top: `${source.top}px`, width: `${source.width}px`, height: `${source.height}px` });
    function tick(now) {
      if (skipRequested || token !== runToken) return resolve(false);
      const p = Math.min(1, (now - start) / duration); const e = 1 - Math.pow(1 - p, 3);
      card.style.left = `${source.left + (target.x - source.left) * e}px`; card.style.top = `${source.top + (target.y - source.top) * e}px`;
      card.style.width = `${source.width + (target.width - source.width) * e}px`; card.style.height = `${source.height + (target.height - source.height) * e}px`;
      if (p < 1) requestAnimationFrame(tick); else resolve(true);
    }
    requestAnimationFrame(tick);
  });
}

async function transport(animal, index, total, token) {
  const answer = Boolean(animal[selectedFeature]); const card = $(`.animal-card[data-animal-id="${animal.id}"]`); const zone = answer ? elements.yesZone : elements.noZone;
  const source = card.getBoundingClientRect(); const robotRect = elements.robot.getBoundingClientRect(); const zoneRect = zone.getBoundingClientRect(); const anchor = hand(0, robotRect);
  const home = { x: robotRect.left, y: robotRect.top };
  const pickup = { x: Math.max(6, source.left - anchor.x), y: Math.max(76, Math.min(innerHeight - robotRect.height - 8, source.top - anchor.y)) };
  const drop = { x: zoneRect.left + Math.max(8, (zoneRect.width - anchor.width) / 2) - anchor.x, y: Math.max(76, zoneRect.top + 58 - anchor.y) };
  elements.robot.classList.add("is-active"); elements.robot.style.transform = `translate3d(${home.x}px,${home.y}px,0)`;
  elements.message.textContent = `第 ${index + 1}/${total} 张：我去拿${animal.name}`;
  if (!await moveRobot({ from: home, to: pickup, type: "walk", duration: 430, token })) return false;
  if (!await cardToHand(card, source, pickup, robotRect, token)) return false;
  elements.message.textContent = `把${animal.name}送往“${answer ? featureInfo[selectedFeature].yes : featureInfo[selectedFeature].no}”`;
  if (!await moveRobot({ from: pickup, to: drop, type: "carry", duration: 650, token, onMove: (x, y, frame) => { const a = hand(frame, robotRect); Object.assign(card.style, { left: `${x + a.x}px`, top: `${y + a.y}px`, width: `${a.width}px`, height: `${a.height}px` }); } })) return false;
  addToBranch(animal, answer);
  const done = await moveRobot({ from: drop, to: home, type: "walk", duration: 430, token });
  if (done) restoreRobotHome();
  return done;
}

function counts(group) { const birds = group.filter((a) => a.isBird).length; return { birds, nonBirds: group.length - birds, total: group.length }; }
function impurity(group, metric) {
  if (!group.length) return 0; const { birds, nonBirds, total } = counts(group); const ps = [birds / total, nonBirds / total].filter(Boolean);
  return metric === "entropy" ? -ps.reduce((sum, p) => sum + p * Math.log2(p), 0) : 1 - ps.reduce((sum, p) => sum + p * p, 0);
}
function buildSplit(animals, feature = selectedFeature) {
  const yes = animals.filter((a) => Boolean(a[feature])); const no = animals.filter((a) => !a[feature]);
  return { feature, animals, yes, no };
}
function describe(group) { const c = counts(group); return `${c.birds} 只鸟类，${c.nonBirds} 只非鸟类`; }

function completeLevel() {
  restoreRobotHome();
  latestSplit = buildSplit(currentCandidates); history[activeLevel] = latestSplit; awaitingNext = true; running = false; skipRequested = false;
  elements.start.disabled = false; elements.start.textContent = activeLevel < 3 ? `保留“是”分支，进入第 ${activeLevel + 2} 层` : "进入结果分析"; elements.skip.hidden = true;
  elements.message.classList.add("is-complete"); elements.message.textContent = `第 ${activeLevel + 1} 层完成：“是”分支的 ${latestSplit.yes.length} 只将继续。`;
  refreshOrder();
}

function prepareNext() {
  if (!awaitingNext) return;
  if (activeLevel === 3) { awaitingNext = false; enterAnalysis(); return; }
  elements.noZone.querySelectorAll(".animal-card").forEach((card) => retiredCards.append(card));
  elements.yesZone.querySelectorAll(".animal-card").forEach((card) => { card.classList.remove("is-sorted"); card.disabled = false; card.draggable = true; elements.tray.append(card); });
  currentCandidates = latestSplit.yes.slice(); activeLevel += 1; selectedFeature = featureOrder[activeLevel]; latestSplit = null; awaitingNext = false;
  resetZone(elements.yesZone); resetZone(elements.noZone); elements.yesCount.textContent = "0"; elements.noCount.textContent = "0";
  elements.start.textContent = `请 Iris 开始第 ${activeLevel + 1} 层筛选`; elements.message.classList.remove("is-complete"); elements.message.textContent = `已保留上一层“是”分支，现在进入第 ${activeLevel + 1} 层。`;
  setProgress(activeLevel + 1); refreshOrder(); updateSummary();
}

function splitScore(split, metric) {
  if (!split.animals.length) return { parent: 0, weighted: 0, improvement: 0 };
  const parent = impurity(split.animals, metric);
  const weighted = (split.yes.length * impurity(split.yes, metric) + split.no.length * impurity(split.no, metric)) / split.animals.length;
  return { parent, weighted, improvement: parent - weighted };
}

function exampleGroup() {
  const groups = history.flatMap((split) => [split.yes, split.no, split.animals]);
  return groups.find((group) => { const c = counts(group); return c.birds > 0 && c.nonBirds > 0; }) || history[0].animals;
}

function renderAnalysisTree() {
  elements.analysisTree.innerHTML = history.map((split, index) => `<article class="compact-node${index === 0 ? " is-active" : ""}">
    <em>${index + 1}</em><div><small>${split.animals.length} 只进入</small><strong>${featureInfo[split.feature].name}</strong></div>
    <span><b>${split.yes.length}</b> ${index === 3 ? "保留" : "继续"}</span><i>${split.no.length} 退出</i>
  </article>`).join("");
}

function giniFormula(group) {
  if (!group.length) return "空分支，Gini = 0";
  const c = counts(group);
  return `1 − (${c.birds}/${c.total})² − (${c.nonBirds}/${c.total})² = ${impurity(group, "gini").toFixed(3)}`;
}

function analysisSteps() {
  const group = exampleGroup();
  const c = counts(group);
  const birdP = c.birds / c.total;
  const nonBirdP = c.nonBirds / c.total;
  const gini = impurity(group, "gini");
  const entropy = impurity(group, "entropy");
  const entropyTerms = [[c.birds, birdP], [c.nonBirds, nonBirdP]].filter(([amount]) => amount > 0).map(([, p]) => `−${p.toFixed(2)} log₂${p.toFixed(2)}`).join(" ");
  const first = history[0];
  const last = history[3];
  const levelCards = history.map((split, index) => {
    const score = splitScore(split, "gini");
    const yesGini = impurity(split.yes, "gini");
    const noGini = impurity(split.no, "gini");
    return `<article class="gini-level-card"><header><em>${index + 1}</em><div><small>${split.animals.length} 只进入</small><strong>${featureInfo[split.feature].name}</strong></div><b>加权 ${score.weighted.toFixed(3)}</b></header><p>输入：${giniFormula(split.animals)}</p><p>是分支 ${split.yes.length} 只，Gini = ${yesGini.toFixed(3)}；否分支 ${split.no.length} 只，Gini = ${noGini.toFixed(3)}</p><code>${split.animals.length ? `${split.yes.length}/${split.animals.length} × ${yesGini.toFixed(3)} + ${split.no.length}/${split.animals.length} × ${noGini.toFixed(3)} = ${score.weighted.toFixed(3)}` : "没有样本进入本层"}</code></article>`;
  }).join("");
  return [
    { tag: "先检验，再学公式", title: "训练数据里其实已经藏着一个反例", copy: "鸵鸟是鸟类，却不会飞。如果决策树把“会飞”当成必须满足的条件，鸵鸟就会被提前排除。接着再点击神秘动物，看看新样本是否会遇到同样的问题。", visual: `<div class="concept-chip">鸵鸟：不会飞的鸟类</div><div class="concept-chip">神秘动物：新的检验样本</div>`, action: "我已经检验，继续思考" },
    { tag: "两个反例带来的问题", title: "鸵鸟和企鹅为什么都被这条规则排除？", copy: "鸵鸟来自原始训练数据，企鹅是后来加入的新样本；它们都不会飞，但都属于鸟类。这说明“会飞”不是判断鸟类的必要条件。", visual: `<div class="mini-bars"><div class="mini-bar"><span>第 1 层“是”分支</span><i style="--fill:${counts(first.yes).birds / Math.max(1, first.yes.length) * 100}%"></i><b>${describe(first.yes)}</b></div><div class="mini-bar"><span>第 4 层“是”分支</span><i style="--fill:${counts(last.yes).birds / Math.max(1, last.yes.length) * 100}%"></i><b>${describe(last.yes)}</b></div></div>`, action: "怎样比较混杂程度？" },
    { tag: "先理解树是怎样设置的", title: "当前实验是在手动模拟建树", copy: "你决定问题顺序，也规定只有“是”分支继续向下。这些都是建树设置。鸵鸟被排除说明：凭直觉写死顺序和方向，可能把规则设置错。", visual: `<div class="setting-grid"><div><b>预测目标</b><span>要判断是否为鸟类</span></div><div><b>候选特征</b><span>飞行、产卵、翅膀、羽毛</span></div><div><b>分支方向</b><span>哪个答案继续向下</span></div><div><b>停止条件</b><span>深度、样本数或已经足够纯</span></div></div>`, action: "真正训练会怎么做？" },
    { tag: "从手动规则到模型训练", title: "训练不是记住固定顺序，而是在每个节点比较候选问题", copy: "真正的算法会使用训练数据尝试不同划分，选择让子节点更纯的问题，再对仍然混杂的分支重复这一过程。树过深时还要停止或剪枝。", visual: `<div class="training-flow"><span>① 尝试候选问题</span><i>→</i><span>② 比较划分效果</span><i>→</i><span>③ 选择当前最佳节点</span><i>→</i><span>④ 递归或停止</span></div><p class="training-note"><b>鸵鸟</b>帮助模型在训练阶段发现规则漏洞；<b>企鹅</b>不参与训练，用来检查模型面对新样本是否仍然正确。</p>`, action: "用什么比较划分效果？" },
    { tag: "先定义目标", title: "能不能用一个数表示“混得有多杂”？", copy: "如果分支里全是同一类，这个数应该最小；鸟类和非鸟类越接近各占一半，这个数应该越大。", visual: `<div class="concept-chip">纯净 → 数值小</div><div class="concept-chip">混杂 → 数值大</div>`, action: "用刚才的数据试算" },
    { tag: "先看例子", title: `计算一个包含 ${c.total} 只动物的分支`, copy: `这里有 ${c.birds} 只鸟类、${c.nonBirds} 只非鸟类。各类比例分别是 ${birdP.toFixed(2)} 和 ${nonBirdP.toFixed(2)}，平方后相加表示抽到同类的可能性。`, visual: `<div class="formula-preview">1 − (${c.birds}/${c.total})² − (${c.nonBirds}/${c.total})² = ${gini.toFixed(3)}</div>`, action: "理解这个数字" },
    { tag: "例子之后再看概念", title: "基尼系数衡量随机错分的可能性", copy: `刚才得到 ${gini.toFixed(3)}。二分类时，全部同类为 0，最混杂的各占一半为 0.5。建树时比较加权后的子节点基尼，越小通常越好。`, visual: `<div class="formula-preview">Gini(D) = 1 − Σ pᵢ²<br><small>pᵢ 是第 i 类样本在节点 D 中的比例；多分类时继续累加其他类别</small></div>`, action: "查看四层实际计算" },
    { tag: "当前排序的完整计算", title: "决策树每一层的基尼系数", copy: "每层先计算输入节点和两个分支，再按照分支样本数进行加权。调整上方排序后，下面四张计算卡会同步更新。", visual: `<div class="gini-level-list">${levelCards}</div>`, action: "再认识信息熵" },
    { tag: "仍然先看例子", title: "如果把类别看成一条消息，需要多少信息才能确定它？", copy: `同一个 ${c.total} 只动物的分支越混杂，猜测类别越困难，信息熵就越高；全部同类时不需要猜，熵为 0。`, visual: `<div class="formula-preview">${entropyTerms} = ${entropy.toFixed(3)}</div>`, action: "理解信息熵公式" },
    { tag: "例子之后再看公式", title: "信息熵衡量类别的不确定程度", copy: `Entropy 使用 log₂ 放大较小概率带来的信息量。二分类时范围通常为 0～1：全是同一类为 0，各占一半时达到 1。信息增益等于父节点熵减去子节点加权熵。`, visual: `<div class="formula-preview">Entropy(D) = −Σ pᵢ log₂pᵢ<br>Information Gain = Entropy(父节点) − Σ(|Dᵥ|/|D|)Entropy(Dᵥ)</div>`, action: "比较两种指标" },
    { tag: "如何选择", title: "基尼系数和信息熵通常会得到相近的树", copy: "基尼计算更简单，常用于 CART；信息熵解释为不确定性减少，常用于 ID3、C4.5。它们都只评价当前候选划分，不保证整棵树达到全局最优。", visual: `<div class="comparison-grid"><div><strong>基尼系数</strong><span>计算快、关注混杂程度</span></div><div><strong>信息熵</strong><span>信息论直观、对概率变化更敏感</span></div></div>`, action: "看看实际应用" },
    { tag: "不只可以识别动物", title: "决策树常用于哪些场景？", copy: "只要问题能够逐步拆成可判断的条件，决策树就能给出清晰的判断路径。", visual: `<div class="application-grid"><div><b>贷款风险</b><span>收入、负债率、还款记录 → 是否违约</span></div><div><b>医疗分诊</b><span>症状、体温、检查结果 → 风险等级</span></div><div><b>垃圾邮件</b><span>关键词、链接、发件人 → 是否垃圾邮件</span></div><div><b>客户流失</b><span>使用频率、投诉、续费记录 → 是否流失</span></div></div>`, action: "深入贷款风险例子" },
    { tag: "贷款风险预估", title: "一条审批路径是怎样形成的？", copy: "例如先问“是否有严重逾期”，再问“负债率是否过高”，最后结合收入稳定性。每个节点都可以解释拒绝或通过的原因，但训练数据中的历史偏差也可能被树学进去。", visual: `<div class="loan-path"><span>严重逾期？</span><i>否</i><span>负债率过高？</span><i>否</i><span>收入稳定？</span><b>低风险</b></div>`, action: "最后总结优缺点" },
    { tag: "使用前要知道", title: "决策树直观，但并不是没有代价", copy: "它适合教学和需要解释的任务；实际应用中常通过剪枝、限制深度，或使用随机森林和梯度提升树来降低单棵树的不稳定性。", visual: `<div class="pros-cons"><div><strong>优点</strong><span>路径容易解释</span><span>能表示非线性规则</span><span>数值和类别特征都可使用</span><span>通常不需要复杂的数据缩放</span></div><div><strong>局限</strong><span>容易过拟合</span><span>对少量数据变化敏感</span><span>逐层贪心不保证全局最优</span><span>复杂树仍可能难以理解</span></div></div>`, action: "完成结果分析" },
  ];
}

function renderAnalysisStep() {
  const steps = analysisSteps();
  const item = steps[analysisStep];
  const progress = elements.analysisStepLabel.parentElement;
  const currentDots = progress.querySelectorAll(":scope > span");
  if (currentDots.length !== steps.length) {
    currentDots.forEach((dot) => dot.remove());
    progress.insertAdjacentHTML("afterbegin", steps.map(() => "<span></span>").join(""));
  }
  elements.analysisTag.textContent = item.tag;
  elements.analysisTitle.textContent = item.title;
  elements.analysisCopy.textContent = item.copy;
  elements.analysisVisual.innerHTML = item.visual;
  elements.analysisStepLabel.textContent = `思考 ${analysisStep + 1} / ${steps.length}`;
  progress.querySelectorAll(":scope > span").forEach((dot, index) => dot.classList.toggle("is-on", index <= analysisStep));
  elements.analysisBack.disabled = analysisStep === 0;
  elements.analysisNext.textContent = item.action;
  elements.analysisCard.classList.remove("is-changing"); void elements.analysisCard.offsetWidth; elements.analysisCard.classList.add("is-changing");
}

function enterAnalysis() {
  analysisStep = 0;
  elements.analysisView.hidden = false;
  elements.analysisChallenge.hidden = false;
  elements.analysisView.querySelector(".analysis-hero").after(elements.analysisChallenge);
  renderAnalysisTree();
  unlockChallenge();
  renderAnalysisStep();
  elements.analysisView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function quickEnterAnalysis() {
  runToken += 1;
  running = false; skipRequested = false; awaitingNext = false;
  elements.skip.hidden = true; elements.manualError.hidden = true;
  if (!started) beginExperiment();
  recalculateForCurrentOrder();
  elements.message.classList.add("is-complete");
  elements.message.textContent = "已跳过搬运动画，并按当前顺序完成四层筛选。";
  enterAnalysis();
}

function moveAnalysis(direction) {
  const steps = analysisSteps();
  const next = Math.max(0, Math.min(steps.length - 1, analysisStep + direction));
  if (next === analysisStep && direction > 0) {
    elements.analysisChallenge.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  analysisStep = next;
  renderAnalysisStep();
}

function unlockChallenge() {
  elements.challenge.disabled = false; elements.challenge.className = "locked-sample is-unlocked";
  elements.challenge.setAttribute("aria-expanded", "false");
  elements.challenge.innerHTML = `<img src="${challengeAnimal.image}" alt="" /><strong>${challengeAnimal.name}</strong><small>点击比较两棵树</small>`;
  elements.challengeDescription.textContent = "训练数据中的鸵鸟已经是“不会飞的鸟类”反例。现在神秘动物揭晓：企鹅，点击它检验这棵树能否推广到新样本。";
  elements.challengeComparison.hidden = true;
  elements.challengeComparison.innerHTML = "";
  elements.start.disabled = true; elements.start.textContent = "四层建树完成"; setProgress(4);
}

function testChallenge() {
  if (history.length < 4) return;
  const failed = featureOrder.findIndex((feature) => !challengeAnimal[feature]);
  const originalPath = featureOrder.slice(0, failed < 0 ? featureOrder.length : failed + 1).map((feature, index, path) => {
    const answer = Boolean(challengeAnimal[feature]);
    return `<div class="challenge-route-node"><small>第 ${index + 1} 层</small><strong>${featureInfo[feature].name}</strong><span class="route-answer ${answer ? "is-yes" : "is-no"}">${answer ? featureInfo[feature].yes : featureInfo[feature].no}</span></div>${index < path.length - 1 ? '<i class="route-arrow" aria-hidden="true">→</i>' : ""}`;
  }).join("");

  elements.challengeComparison.innerHTML = `
    <article class="challenge-tree is-wrong">
      <header><div><small>原来的四层树</small><h3>所有条件都必须回答“是”</h3></div><b>误判</b></header>
      <div class="penguin-route">
        <div class="route-animal"><img src="${challengeAnimal.image}" alt="企鹅" /><strong>企鹅</strong></div>
        <i class="route-arrow" aria-hidden="true">→</i>
        <div class="challenge-route-steps">${originalPath}<i class="route-arrow" aria-hidden="true">→</i><div class="challenge-route-result is-wrong"><strong>非鸟类</strong><span>错误：企鹅被提前排除</span></div></div>
      </div>
      <p>企鹅在第 ${failed + 1} 层“${featureInfo[featureOrder[failed]].name}”回答“否”，因此没有机会继续证明自己有羽毛。</p>
    </article>
    <article class="challenge-tree is-correct">
      <header><div><small>改进后的决策树</small><h3>先判断真正能区分类别的特征</h3></div><b>正确</b></header>
      <div class="penguin-route">
        <div class="route-animal"><img src="${challengeAnimal.image}" alt="企鹅" /><strong>企鹅</strong></div>
        <i class="route-arrow" aria-hidden="true">→</i>
        <div class="challenge-route-steps"><div class="challenge-route-node"><small>关键节点</small><strong>是否有羽毛</strong><span class="route-answer is-yes">有羽毛</span></div><i class="route-arrow" aria-hidden="true">→</i><div class="challenge-route-result is-correct"><strong>鸟类</strong><span>正确保留企鹅</span></div></div>
      </div>
      <p>“会飞”不是鸟类的必要条件；把“有羽毛”作为关键划分，企鹅和鸵鸟都不会再被误排。</p>
    </article>`;
  elements.challengeComparison.hidden = false;
  elements.challenge.setAttribute("aria-expanded", "true");
  elements.challenge.classList.add("is-success");
  elements.challenge.querySelector("small").textContent = "已展示，点击可重新播放";
  elements.challengeComparison.classList.remove("is-replaying");
  void elements.challengeComparison.offsetWidth;
  elements.challengeComparison.classList.add("is-replaying");
  elements.challengeComparison.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function beginExperiment() {
  if (started) return;
  if (!selectedAnimals.size) trainingAnimals.forEach((animal) => selectedAnimals.add(animal.id));
  started = true;
  currentCandidates = trainingAnimals.filter((animal) => selectedAnimals.has(animal.id));
  refreshOrder();
  updateSummary();
}

async function startFiltering() {
  if (running) return; if (awaitingNext) return prepareNext();
  if (history.length === 4 && !elements.analysisView.hidden) { elements.analysisView.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  beginExperiment();
  const remaining = currentCandidates.filter((a) => $(`.animal-card[data-animal-id="${a.id}"]`)?.parentElement === elements.tray);
  if (!remaining.length) return completeLevel();
  const token = ++runToken; running = true; skipRequested = false; elements.start.disabled = true; elements.start.textContent = `Iris 正在筛选第 ${activeLevel + 1} 层…`; elements.skip.hidden = false; elements.skip.disabled = false;
  let done = 0;
  for (let i = 0; i < remaining.length; i += 1) { if (!await transport(remaining[i], i, remaining.length, token)) break; done = i + 1; }
  if (token !== runToken) return;
  if (skipRequested) {
    remaining.slice(done).forEach((a) => addToBranch(a, Boolean(a[selectedFeature])));
    restoreRobotHome();
  }
  completeLevel();
}

function manualDrop(animalId, answer) {
  if (running || awaitingNext || !started) return;
  const animal = currentCandidates.find((a) => a.id === animalId); const card = $(`.animal-card[data-animal-id="${animalId}"]`);
  if (!animal || card.parentElement !== elements.tray) return;
  if (Boolean(animal[selectedFeature]) !== answer) {
    elements.manualError.hidden = false;
    dispatchEvent(new CustomEvent("manualClassificationError", { detail: { animalId, level: activeLevel + 1, feature: selectedFeature, chosenAnswer: answer } }));
    elements.message.textContent = "分类位置不正确，Iris 会把卡片送回正确分支。";
    const token = ++runToken; running = true; transport(animal, 0, 1, token).then(() => { running = false; elements.manualError.hidden = true; if (currentCandidates.every((a) => $(`.animal-card[data-animal-id="${a.id}"]`).parentElement !== elements.tray)) completeLevel(); });
  } else {
    addToBranch(animal, answer);
    if (currentCandidates.every((a) => $(`.animal-card[data-animal-id="${a.id}"]`).parentElement !== elements.tray)) completeLevel();
  }
}

[...elements.featureList.children].forEach((option) => {
  option.addEventListener("dragstart", (event) => { if (!orderEditable()) return event.preventDefault(); draggedFeature = option; option.classList.add("is-dragging-feature"); event.dataTransfer.setData("text/plain", option.dataset.feature); });
  option.addEventListener("dragend", () => { option.classList.remove("is-dragging-feature"); draggedFeature = null; refreshOrder(); });
  option.addEventListener("dragover", (event) => { if (!draggedFeature || draggedFeature === option || !orderEditable()) return; event.preventDefault(); const after = event.clientX > option.getBoundingClientRect().left + option.offsetWidth / 2; elements.featureList.insertBefore(draggedFeature, after ? option.nextElementSibling : option); });
  option.addEventListener("keydown", (event) => { if (!orderEditable() || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return; event.preventDefault(); const before = ["ArrowLeft", "ArrowUp"].includes(event.key); const sibling = before ? option.previousElementSibling : option.nextElementSibling; if (!sibling) return; elements.featureList.insertBefore(before ? option : sibling, before ? sibling : option); refreshOrder(); option.focus(); });
});

elements.start.addEventListener("click", startFiltering); elements.reset.addEventListener("click", resetAll); elements.quickAnalysis.addEventListener("click", quickEnterAnalysis);
elements.skip.addEventListener("click", () => { if (running) { skipRequested = true; elements.skip.disabled = true; elements.message.textContent = "正在快速完成本层剩余分类…"; } });
elements.challenge.addEventListener("click", testChallenge);
elements.analysisRobot.addEventListener("iris-activate", () => moveAnalysis(1));
elements.analysisNext.addEventListener("click", () => moveAnalysis(1));
elements.analysisBack.addEventListener("click", () => moveAnalysis(-1));
elements.returnFilter.addEventListener("click", (event) => {
  event.preventDefault(); elements.filterView.scrollIntoView({ behavior: "smooth", block: "start" });
});
elements.analysisReturnButton.addEventListener("click", () => elements.filterView.scrollIntoView({ behavior: "smooth", block: "start" }));
[elements.yesZone, elements.noZone].forEach((zone) => {
  zone.addEventListener("dragover", (event) => { if (running || awaitingNext || !started) return; event.preventDefault(); zone.classList.add("is-drag-over"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-drag-over"));
  zone.addEventListener("drop", (event) => { event.preventDefault(); zone.classList.remove("is-drag-over"); manualDrop(event.dataTransfer.getData("text/plain"), zone.dataset.answer === "true"); });
});

const fragment = document.createDocumentFragment(); trainingAnimals.forEach((animal) => fragment.append(createCard(animal))); elements.tray.append(fragment);
refreshOrder(); resetAll();
