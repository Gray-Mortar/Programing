(function () {
    const key = "ml_knn_records";
    const classes = ["Setosa", "Versicolor", "Virginica"];

    function storageGet() {
        try {
            return JSON.parse(localStorage.getItem(key) || "[]");
        } catch (error) {
            return [];
        }
    }

    function findRecord() {
        const params = new URLSearchParams(window.location.search);
        const time = params.get("time");
        if (!time) return null;
        return storageGet().find(function (record) {
            return record.time === time;
        }) || null;
    }

    function formatTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function formatNumber(value) {
        return Number(value).toFixed(2);
    }

    function renderVotes(record) {
        const votes = record.votes || {};
        classes.forEach(function (label) {
            const count = votes[label] || 0;
            const bar = document.getElementById("record-vote-bar-" + label);
            const countNode = document.getElementById("record-vote-count-" + label);
            if (bar) bar.style.width = record.k ? (count / record.k * 100) + "%" : "0%";
            if (countNode) countNode.textContent = String(count);
        });
    }

    function renderNeighbors(record) {
        const body = document.getElementById("record-neighbor-body");
        if (!body) return;
        const neighbors = record.neighbors || [];
        if (!neighbors.length) {
            body.innerHTML = '<tr><td colspan="7">这次记录没有保存邻居明细。</td></tr>';
            return;
        }
        body.innerHTML = neighbors.map(function (neighbor, index) {
            const features = neighbor.features || [];
            return [
                '<tr>',
                '<td>' + (index + 1) + '</td>',
                '<td>' + neighbor.label + '</td>',
                '<td>' + formatNumber(neighbor.distance) + '</td>',
                '<td>' + formatNumber(features[0]) + '</td>',
                '<td>' + formatNumber(features[1]) + '</td>',
                '<td>' + formatNumber(features[2]) + '</td>',
                '<td>' + formatNumber(features[3]) + '</td>',
                '</tr>'
            ].join("");
        }).join("");
    }

    function render(record) {
        const empty = document.getElementById("record-empty");
        const content = document.getElementById("record-content");
        if (!record) {
            empty.hidden = false;
            content.hidden = true;
            return;
        }

        empty.hidden = true;
        content.hidden = false;
        document.getElementById("record-title").textContent = "预测为 " + record.predicted;
        document.getElementById("record-summary").textContent = "保存时间 " + formatTime(record.time) + "，使用 K=" + record.k + " 的最近邻投票。";
        document.getElementById("record-predicted").textContent = record.predicted || "-";
        document.getElementById("record-confidence").textContent = record.confidence !== undefined ? record.confidence + "%" : "-";
        document.getElementById("record-k").textContent = record.k || "-";
        document.getElementById("record-time").textContent = formatTime(record.time);
        document.getElementById("record-features").textContent = "特征向量：[" + (record.features || []).join(", ") + "]";
        renderVotes(record);
        renderNeighbors(record);
    }

    document.addEventListener("DOMContentLoaded", function () {
        render(findRecord());
    });
})();
