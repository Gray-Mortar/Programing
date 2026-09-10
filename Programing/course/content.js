(function () {
  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
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

  function renderTopics(topics) {
    const wrapper = createElement("div", "knowledge-topics");
    topics.forEach(function (topic) {
      const item = createElement("section", "knowledge-topic");
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

  function renderCard(section) {
    const card = document.createElement("article");
    card.className = "course-card";
    card.id = section.id;

    const number = createElement("span", "course-number", section.number);
    const title = createElement("h2", "", section.title);
    const summary = createElement("p", "", section.summary);
    card.appendChild(number);
    card.appendChild(title);
    card.appendChild(summary);

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
      card.appendChild(renderTopics(section.topics));
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

  function renderCourse() {
    const sections = window.ML_COURSE_SECTIONS || [];
    const content = document.getElementById("course-content");
    const sidebar = document.getElementById("course-sidebar");
    if (!sections.length || !content) {
      return;
    }
    if (sidebar) {
      renderSidebar(sections, sidebar);
    }
    content.innerHTML = "";
    sections.forEach(function (section) {
      content.appendChild(renderCard(section));
    });
  }

  document.addEventListener("DOMContentLoaded", renderCourse);
})();
