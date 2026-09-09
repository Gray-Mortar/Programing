(function () {
    const featureIds = ["sepal-length", "sepal-width", "petal-length", "petal-width"];
    const classes = ["Setosa", "Versicolor", "Virginica"];
    const labelMap = {
        "Iris-setosa": "Setosa",
        "Iris-versicolor": "Versicolor",
        "Iris-virginica": "Virginica"
    };
    const colors = {
        Setosa: "#6d4bd1",
        Versicolor: "#2f9e73",
        Virginica: "#e27b36"
    };
    const key = "ml_knn_records";
    let lastResult = null;

    function samples() {
        return (window.IRIS_SAMPLES || []).map(function (sample, index) {
            return {
                features: sample.features.map(Number),
                label: labelMap[sample.label] || sample.label,
                index: index
            };
        });
    }

    function currentFeatures() {
        return featureIds.map(function (id) {
            return Number(document.getElementById(id).value);
        });
    }

    function currentK() {
        return Math.max(1, Math.min(15, Number(document.getElementById("knn-k").value) || 5));
    }

    function euclideanDistance(first, second) {
        return Math.sqrt(first.reduce(function (sum, value, index) {
            return sum + Math.pow(value - second[index], 2);
        }, 0));
    }

    function classify(features, k) {
        const scored = samples().map(function (sample) {
            return {
                label: sample.label,
                index: sample.index,
                features: sample.features,
                distance: euclideanDistance(features, sample.features)
            };
        }).sort(function (first, second) {
            return first.distance - second.distance || first.index - second.index;
        });

        const neighbors = scored.slice(0, k);
        const votes = classes.reduce(function (result, label) {
            result[label] = 0;
            return result;
        }, {});

        neighbors.forEach(function (neighbor) {
            votes[neighbor.label] = (votes[neighbor.label] || 0) + 1;
        });

        const ranking = classes.map(function (label) {
            return {
                label: label,
                count: votes[label],
                share: votes[label] / k
            };
        });

        const best = ranking.reduce(function (current, item) {
            return item.count > current.count ? item : current;
        }, ranking[0]);

        return {
            neighbors: neighbors,
            votes: votes,
            ranking: ranking,
            predicted: best.label,
            confidence: Math.round(best.count / k * 100)
        };
    }

    function updateOutputs(result, features, k) {
        document.getElementById("knn-result").textContent = result.predicted;
        document.getElementById("knn-confidence").textContent = result.confidence + "%";
        document.getElementById("knn-vector").innerHTML = "特征向量：[" + features.join(", ") + "]<br>K = " + k + "，" + result.neighbors.length + " 个最近邻居参与投票。";

        classes.forEach(function (label) {
            const count = result.votes[label] || 0;
            const bar = document.getElementById("vote-bar-" + label);
            const countNode = document.getElementById("vote-count-" + label);
            if (bar) bar.style.width = (count / k * 100) + "%";
            if (countNode) countNode.textContent = String(count);
        });
    }

    function scaleX(value) {
        const padding = 38;
        const width = 440 - padding - 14;
        return padding + value / 7.5 * width;
    }

    function scaleY(value) {
        const paddingTop = 18;
        const paddingBottom = 42;
        const height = 300 - paddingTop - paddingBottom;
        return paddingTop + (3 - value) / 3 * height;
    }

    function drawScatter(result, features) {
        const canvas = document.getElementById("knn-scatter");
        if (!canvas || !canvas.getContext) return;
        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#e7e2f2";
        ctx.lineWidth = 1;
        for (let x = 0; x <= 7; x += 1) {
            ctx.beginPath();
            ctx.moveTo(scaleX(x), scaleY(0));
            ctx.lineTo(scaleX(x), scaleY(3));
            ctx.stroke();
        }
        for (let y = 0; y <= 3; y += 1) {
            ctx.beginPath();
            ctx.moveTo(scaleX(0), scaleY(y));
            ctx.lineTo(scaleX(7), scaleY(y));
            ctx.stroke();
        }

        samples().forEach(function (sample) {
            ctx.beginPath();
            ctx.arc(scaleX(sample.features[2]), scaleY(sample.features[3]), 3.2, 0, Math.PI * 2);
            ctx.fillStyle = colors[sample.label] || "#888";
            ctx.globalAlpha = 0.55;
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        const userX = scaleX(features[2]);
        const userY = scaleY(features[3]);

        result.neighbors.forEach(function (neighbor) {
            const neighborX = scaleX(neighbor.features[2]);
            const neighborY = scaleY(neighbor.features[3]);
            ctx.beginPath();
            ctx.moveTo(userX, userY);
            ctx.lineTo(neighborX, neighborY);
            ctx.strokeStyle = colors[neighbor.label];
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(neighborX, neighborY, 7, 0, Math.PI * 2);
            ctx.strokeStyle = "#242033";
            ctx.lineWidth = 2;
            ctx.stroke();

            const labelX = (userX + neighborX) / 2;
            const labelY = (userY + neighborY) / 2;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(labelX - 15, labelY - 9, 30, 16);
            ctx.fillStyle = "#242033";
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.fillText(neighbor.distance.toFixed(2), labelX, labelY + 3);
        });

        function drawStar(x, y) {
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            for (let index = 0; index < 10; index += 1) {
                const radius = index % 2 === 0 ? 11 : 4.5;
                const angle = -Math.PI / 2 + index * Math.PI / 5;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                if (index === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = "#242033";
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
        drawStar(userX, userY);

        ctx.strokeStyle = "#242033";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#6d687b";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.fillText("花瓣长度", scaleX(3.5), 292);
        ctx.save();
        ctx.translate(16, scaleY(1.5));
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("花瓣宽度", 0, 0);
        ctx.restore();
    }

    function currentUser() {
        const auth = window.MLAuth;
        const user = auth && auth.getCurrentUser ? auth.getCurrentUser() : null;
        return user ? user.username : "guest";
    }

    function renderStatus(status) {
        const node = document.getElementById("knn-history-status");
        if (node) node.textContent = status;
    }

    function storageGet() {
        try {
            return JSON.parse(localStorage.getItem(key) || "[]");
        } catch (error) {
            return [];
        }
    }

    function storageSet(records) {
        localStorage.setItem(key, JSON.stringify(records));
    }

    function userRecords(records) {
        const username = currentUser();
        if (username === "guest") return records;
        return records.filter(function (record) {
            return record.username === username || record.username === "guest";
        });
    }

    function formatTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("zh-CN", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function historyItemMarkup(record) {
        const time = encodeURIComponent(record.time);
        const features = record.features ? record.features.join(", ") : "暂无";
        return [
            '<article class="knn-history-item">',
            '<div class="knn-history-main">',
            '<strong>' + record.predicted + '</strong>',
            '<span>K=' + record.k + ' · 置信度 ' + record.confidence + '%</span>',
            '<p>特征向量：[' + features + ']</p>',
            '</div>',
            '<div class="knn-history-meta">' + formatTime(record.time) + '</div>',
            '<div class="knn-history-actions">',
            '<a href="history.html?time=' + time + '">查看详情</a>',
            '</div>',
            '</article>'
        ].join("");
    }

    function renderHistory() {
        const node = document.getElementById("knn-record-list");
        if (!node) return;
        const records = userRecords(storageGet());
        if (!records.length) {
            node.innerHTML = '<p class="experiment-note">还没有保存过 KNN 实验记录。</p>';
            return;
        }
        node.innerHTML = records.slice().reverse().map(historyItemMarkup).join("");
    }

    function saveRecord() {
        if (!lastResult) return;
        const records = storageGet();
        records.push({
            time: new Date().toISOString(),
            username: currentUser(),
            features: lastResult.features,
            k: lastResult.k,
            predicted: lastResult.result.predicted,
            confidence: lastResult.result.confidence,
            votes: lastResult.result.votes,
            neighbors: lastResult.result.neighbors.map(function (neighbor) {
                return {
                    index: neighbor.index,
                    label: neighbor.label,
                    distance: Number(neighbor.distance.toFixed(4)),
                    features: neighbor.features
                };
            })
        });
        storageSet(records);
        renderStatus("已保存 " + records.length + " 条操作记录");
        renderHistory();
    }

    function run() {
        const features = currentFeatures();
        const k = currentK();
        const result = classify(features, k);
        lastResult = {
            features: features,
            k: k,
            result: result
        };
        updateOutputs(result, features, k);
        drawScatter(result, features);
    }

    function init() {
        if (!window.IRIS_SAMPLES || !window.IRIS_SAMPLES.length) {
            renderStatus("Iris 数据尚未加载");
            return;
        }

        featureIds.concat(["knn-k"]).forEach(function (id) {
            const input = document.getElementById(id);
            input.addEventListener("input", function () {
                const outputId = id === "knn-k" ? "k-value" : id + "-value";
                const output = document.getElementById(outputId);
                if (output) output.textContent = input.value;
                run();
            });
        });

        document.getElementById("save-knn-record").addEventListener("click", function () {
            saveRecord();
            const button = this;
            button.textContent = "已存档本次操作";
            window.setTimeout(function () {
                button.textContent = "存档本次操作";
            }, 1600);
        });

        run();
        renderHistory();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
