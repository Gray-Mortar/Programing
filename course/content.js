(function () {
  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (typeof text === "string") {
      element.textContent = text;
    }
    return element;
  }

  function getSections() {
    return window.ML_COURSE_SECTIONS || [];
  }

  function getChapterHref(section) {
    return "chapter-" + section.number + ".html";
  }

  function renderList(items) {
    const ul = document.createElement("ul");
    ul.className = "course-list";
    items.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    return ul;
  }

  function renderTable(block) {
    const wrapper = document.createElement("div");
    wrapper.className = "course-table-wrap";
    const table = document.createElement("table");
    table.className = "course-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    block.headers.forEach(function (header) {
      const th = document.createElement("th");
      th.textContent = header;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    block.rows.forEach(function (row) {
      const tr = document.createElement("tr");
      row.forEach(function (cell) {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
  }

  function renderTopics(topics, sectionId) {
    const wrapper = createElement("div", "knowledge-topics");
    topics.forEach(function (topic) {
      const item = createElement("section", "knowledge-topic");
      item.id = sectionId + "-topic-" + topic.number;
      const heading = createElement("div", "knowledge-topic-heading");
      heading.appendChild(
        createElement("span", "knowledge-topic-number", String(topic.number)),
      );
      heading.appendChild(createElement("h3", "", topic.title));
      item.appendChild(heading);
      item.appendChild(createElement("p", "knowledge-topic-text", topic.text));
      if (topic.formula) {
        item.appendChild(createElement("p", "topic-formula", topic.formula));
      }
      if (topic.note) {
        item.appendChild(createElement("p", "topic-note", topic.note));
      }
      wrapper.appendChild(item);
    });
    return wrapper;
  }

  function renderCard(section, options) {
    const settings = options || {};
    const card = document.createElement("article");
    card.className = "course-card";
    card.id = section.id;

    if (!settings.hideHeader) {
      card.appendChild(createElement("span", "course-number", section.number));
      card.appendChild(createElement("h2", "", section.title));
      card.appendChild(createElement("p", "", section.summary));
    }

    (section.blocks || []).forEach(function (block) {
      if (block.type === "list") {
        card.appendChild(renderList(block.items));
      } else if (block.type === "table") {
        card.appendChild(renderTable(block));
      } else {
        card.appendChild(createElement("p", "", block.text));
      }
    });

    if (section.topics && section.topics.length) {
      card.appendChild(renderTopics(section.topics, section.id));
    }

    return card;
  }

  function renderSidebar(sections, sidebar) {
    sidebar.innerHTML = "";
    sections.forEach(function (section) {
      const link = document.createElement("a");
      link.href = "#" + section.id;
      link.textContent = section.title;
      sidebar.appendChild(link);
    });
  }

  function renderChapterList(sections, target) {
    target.innerHTML = "";
    sections.forEach(function (section) {
      const card = createElement("article", "course-link-card chapter-list-card");
      card.appendChild(createElement("span", "course-number", section.number));
      card.appendChild(createElement("h2", "", section.title));
      card.appendChild(createElement("p", "", section.summary));

      const meta = createElement("div", "chapter-list-meta");
      meta.appendChild(createElement("span", "", section.topics.length + " 个知识点"));
      meta.appendChild(createElement("span", "", "第 " + section.number + " 章"));
      card.appendChild(meta);

      const link = createElement("a", "", "进入本章 →");
      link.href = getChapterHref(section);
      card.appendChild(link);
      target.appendChild(card);
    });
  }

  function renderChapterView(sections, view) {
    const requestedId = document.body.getAttribute("data-chapter-id");
    const chapterIndex = sections.findIndex(function (section) {
      return section.id === requestedId;
    });

    view.innerHTML = "";
    if (chapterIndex < 0) {
      view.appendChild(
        createElement("p", "course-placeholder", "没有找到对应的基础章节。"),
      );
      return;
    }

    const section = sections[chapterIndex];
    document.title = section.number + " " + section.title + " - ML Learn";
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        "content",
        section.title + "：机器学习基础知识第 " + section.number + " 章。",
      );
    }

    const breadcrumbCurrent = document.getElementById("chapter-breadcrumb-current");
    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = "第 " + section.number + " 章";
    }

    const hero = createElement("section", "courses-hero chapter-hero");
    const copy = createElement("div", "chapter-hero-copy");
    copy.appendChild(createElement("p", "eyebrow", "第 " + section.number + " 章"));
    copy.appendChild(createElement("h1", "", section.title));
    copy.appendChild(createElement("p", "", section.summary));

    const actions = createElement("div", "chapter-hero-actions");
    const treeLink = createElement("a", "button button-secondary", "在知识树中查看");
    treeLink.href = "tree.html";
    const indexLink = createElement("a", "text-link", "返回基础知识 →");
    indexLink.href = "index.html";
    actions.appendChild(treeLink);
    actions.appendChild(indexLink);
    copy.appendChild(actions);
    hero.appendChild(copy);

    const progress = createElement("div", "courses-progress");
    progress.appendChild(createElement("span", "", "本章知识点"));
    progress.appendChild(
      createElement("strong", "", section.topics.length + " 个"),
    );
    progress.appendChild(createElement("span", "", "独立章节页面"));
    hero.appendChild(progress);
    view.appendChild(hero);

    const heading = createElement("div", "chapter-detail-heading");
    heading.appendChild(createElement("h2", "", "知识点详解"));
    heading.appendChild(
      createElement("span", "", "共 " + section.topics.length + " 个知识点"),
    );
    view.appendChild(heading);

    const card = renderCard(section, { hideHeader: true });
    card.classList.add("chapter-detail-card");
    view.appendChild(card);

    const pagination = createElement("nav", "chapter-pagination");
    pagination.setAttribute("aria-label", "相邻章节");

    const previous = sections[chapterIndex - 1];
    const next = sections[chapterIndex + 1];
    if (previous) {
      const previousLink = createElement(
        "a",
        "pagination-link pagination-previous",
        "← " + previous.number + " " + previous.title,
      );
      previousLink.href = getChapterHref(previous);
      pagination.appendChild(previousLink);
    }
    if (next) {
      const nextLink = createElement(
        "a",
        "pagination-link pagination-next",
        next.number + " " + next.title + " →",
      );
      nextLink.href = getChapterHref(next);
      pagination.appendChild(nextLink);
    }
    if (pagination.children.length) {
      view.appendChild(pagination);
    }

    if (window.location.hash) {
      window.requestAnimationFrame(function () {
        const target = document.querySelector(window.location.hash);
        if (target) {
          target.scrollIntoView({ block: "start" });
        }
      });
    }
  }

  function renderAllSections(sections, content, sidebar) {
    if (sidebar) {
      renderSidebar(sections, sidebar);
    }
    content.innerHTML = "";
    sections.forEach(function (section) {
      content.appendChild(renderCard(section));
    });
  }

  function updateSummaryCount(sections) {
    const summary = document.getElementById("course-summary-count");
    if (!summary) {
      return;
    }
    const topicCount = sections.reduce(function (total, section) {
      return total + section.topics.length;
    }, 0);
    summary.textContent = sections.length + " 章 / " + topicCount + " 点";
  }

  function boot() {
    const sections = getSections();
    if (!sections.length) {
      return;
    }

    updateSummaryCount(sections);

    const chapterList = document.getElementById("chapter-list");
    if (chapterList) {
      renderChapterList(sections, chapterList);
    }

    const chapterView = document.getElementById("chapter-view");
    if (chapterView) {
      renderChapterView(sections, chapterView);
    }

    const content = document.getElementById("course-content");
    if (content) {
      renderAllSections(
        sections,
        content,
        document.getElementById("course-sidebar"),
      );
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();