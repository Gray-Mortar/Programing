(function () {
  const milestones = [
    {
      id: "1950",
      year: "1950",
      title: "图灵测试",
      short: "AI 的哲学起点",
      summary:
        "1950 年，艾伦·图灵在《计算机器与智能》中提出“模仿游戏”，为机器能否思考提供了一个可操作的检验框架，也奠定了人工智能的哲学基础。",
      sections: [
        {
          title: "思想实验",
          body: "图灵避开“机器能否思考”的抽象争论，提出如果一台机器能在文本对话中让超过 30% 的评判者误认为它是人类，就可以认为它具备智能。这一标准把 AI 从哲学命题转向可验证的实验。",
        },
        {
          title: "深远影响",
          body: "图灵测试催生了早期自然语言处理探索，1966 年 MIT 的 ELIZA 用简单模式匹配模拟对话，却让许多用户产生情感共鸣。它的逆向应用还催生了 CAPTCHA 验证码，成为互联网区分人与机器的重要防线。",
        },
      ],
      chips: [
        {
          label: "提出者",
          text: "艾伦·图灵（Alan Turing）",
        },
        {
          label: "关键文献",
          text: "《Computing Machinery and Intelligence》",
        },
      ],
      note: "图灵测试超越技术范畴，成为认知科学、哲学与计算机科学交叉讨论的催化剂。",
    },
    {
      id: "1957",
      year: "1957",
      title: "感知机诞生",
      short: "神经网络的先河",
      summary:
        "弗兰克·罗森布拉特在康奈尔大学发明感知机，这是历史上第一个能够从数据中学习的神经网络模型，也标志着连接主义 AI 路线的正式开端。",
      sections: [
        {
          title: "从生物神经元到机器",
          body: "感知机模拟神经元的输入、权重、阈值和激活函数，实现对输入数据的模式识别与分类。罗森布拉特还构建了 Mark I 硬件感知机，成功演示机器区分左右方向的能力。",
        },
        {
          title: "第一次 AI 寒冬",
          body: "1969 年，明斯基与派珀特证明单层感知机无法解决 XOR 等非线性可分问题。受理论缺陷和硬件算力限制，神经网络研究进入长达十余年的低谷，但“通过数据自动调整权重”的核心思想被保留下来。",
        },
      ],
      chips: [
        {
          label: "开创者",
          text: "弗兰克·罗森布拉特（Frank Rosenblatt）",
        },
        {
          label: "历史意义",
          text: "连接主义 AI 的火种，现代神经网络的基石",
        },
      ],
      note: "感知机为后来多层网络研究埋下种子，虽经历了寒冬，却仍是深度学习的结构基础。",
    },
    {
      id: "1986",
      year: "1986",
      title: "反向传播算法",
      short: "深度学习的钥匙",
      summary:
        "辛顿、鲁梅尔哈特与威廉姆斯系统阐述反向传播算法，解决了多层神经网络中“误差如何逐层修正”的核心难题。",
      sections: [
        {
          title: "算法突破",
          body: "反向传播通过链式法则，将输出层误差反向传递至隐藏层，精确计算每个权重对总误差的贡献，并用梯度下降更新参数。这让包含多个隐藏层的“深层”网络训练成为可能。",
        },
        {
          title: "摆脱人工特征",
          body: "神经网络因此不再依赖人工设计特征，能够直接从海量数据中提取抽象、高阶的特征表示。它不仅是现代深度学习的基石算法，也为 2012 年的全面爆发埋下伏笔。",
        },
      ],
      chips: [
        {
          label: "代表人物",
          text: "Hinton、Rumelhart、Williams",
        },
        {
          label: "技术价值",
          text: "让多层神经网络训练成为现实",
        },
      ],
      note: "辛顿等人因此被誉为“深度学习之父”，为 AI 从寒冬走向复兴提供了最关键的一把钥匙。",
    },
    {
      id: "1997",
      year: "1997",
      title: "深蓝击败棋王",
      short: "AI 超越人类棋手",
      summary:
        "IBM 的“深蓝”以 3.5 比 2.5 击败国际象棋世界冠军卡斯帕罗夫，标志着人工智能首次在复杂智力博弈中战胜人类顶尖选手。",
      sections: [
        {
          title: "算力与搜索的胜利",
          body: "深蓝的“智能”建立在强大硬件与暴力搜索之上。它搭载专门设计的国际象棋芯片，每秒评估约 2 亿个棋局位置，并结合启发式评估函数与开局、残局数据库。",
        },
        {
          title: "窄域智能的局限",
          body: "深蓝在规则明确、状态空间可穷举的封闭系统中取胜，却并不具备理解力、常识推理或泛化能力。脱离国际象棋规则，它便毫无用处。",
        },
      ],
      chips: [
        {
          label: "比赛结果",
          text: "3.5 : 2.5 战胜卡斯帕罗夫",
        },
        {
          label: "技术路线",
          text: "专用芯片 + 暴力搜索 + 启发式评估",
        },
      ],
      note: "深蓝证明了机器可以通过算力和算法的组合超越人类的生理极限，也暴露了当时 AI 的局限。",
    },
    {
      id: "2012",
      year: "2012",
      title: "深度学习崛起",
      short: "AI 进入数据驱动时代",
      summary:
        "AlexNet 在 ImageNet 挑战赛中以 15.3% 的 Top-5 错误率夺冠，大幅领先第二名，宣告深度学习时代正式到来。",
      sections: [
        {
          title: "技术组合拳",
          body: "AlexNet 使用 8 层卷积神经网络，引入 ReLU 解决梯度消失、用 Dropout 防止过拟合，并通过 NVIDIA GPU 并行计算大幅缩短训练周期。",
        },
        {
          title: "范式转变",
          body: "AI 从依赖专家手工提取特征，转向“数据驱动自动学习”。同年 Google Brain 用 1.6 万个 CPU 核心，在无标签指导下通过观看 YouTube 视频识别出“猫”的特征，进一步验证了深度学习的普适性。",
        },
      ],
      chips: [
        {
          label: "关键模型",
          text: "AlexNet，8 层卷积神经网络",
        },
        {
          label: "后续影响",
          text: "引爆计算机视觉、语音识别和产业 AI 应用",
        },
      ],
      note: "这一胜利推动深度学习成为 AI 研究主流，并在随后十年影响自动驾驶、医疗影像等产业。",
    },
    {
      id: "2016",
      year: "2016",
      title: "AlphaGo 战胜人类",
      short: "AI 迈向复杂决策",
      summary:
        "DeepMind 的 AlphaGo 以 4 比 1 击败围棋世界冠军李世石。围棋状态空间约为 10 的 170 次方，传统暴力搜索完全失效。",
      sections: [
        {
          title: "深度强化学习",
          body: "AlphaGo 将深度神经网络与蒙特卡洛树搜索结合，用策略网络预测落子、价值网络评估胜率，并通过数百万局自我对弈超越人类数千年来积累的围棋定式。",
        },
        {
          title: "从感知走向决策",
          body: "AlphaGo 展现出某种程度的“创造力”与“直觉”，不再是规则的忠实执行者，而是能通过自我探索发现人类未曾察觉的规律。",
        },
      ],
      chips: [
        {
          label: "开发机构",
          text: "DeepMind",
        },
        {
          label: "比赛结果",
          text: "4:1 击败李世石",
        },
      ],
      note: "这一突破把 AI 的应用边界从感知识别扩展到复杂推理与决策，为自动驾驶、资源调度和金融交易奠定基础。",
    },
    {
      id: "2022",
      year: "2022",
      title: "大语言模型时代",
      short: "AI 进入通用化应用",
      summary:
        "2022 年 11 月 OpenAI 发布 ChatGPT，基于 GPT-3.5 并采用人类反馈强化学习，让 AI 从“专才”向“通才”迈出关键一步。",
      sections: [
        {
          title: "从对话到通用能力",
          body: "ChatGPT 不仅能流畅进行多轮自然语言对话，还能完成代码生成、创意写作和逻辑推理。RLHF 技术让模型输出与人类意图深度对齐。",
        },
        {
          title: "现象级扩散",
          body: "ChatGPT 成为史上用户增长最快的消费级应用，两个月内月活突破 1 亿，并引发全球科技巨头布局，开启“百模大战”。",
        },
      ],
      chips: [
        {
          label: "发布机构",
          text: "OpenAI",
        },
        {
          label: "关键创新",
          text: "LLM + RLHF + 通用对话能力",
        },
      ],
      note: "这一里程碑标志着 AI 正式进入通用化应用新阶段，生成式 AI 开始深刻改变内容创作、软件开发与客户服务。",
    },
    {
      id: "2023",
      year: "2023",
      title: "生成式 AI 爆发",
      short: "AI 进入全民创作时代",
      summary:
        "2023 年，以 GPT-4、Claude、Llama 为代表的大模型密集发布，生成式 AI 从技术演示迅速走向办公、创作、编程和日常生活。",
      sections: [
        {
          title: "从对话到多模态创作",
          body: "GPT-4 在复杂推理、长文本和图像理解上大幅提升，Midjourney 等工具让普通人也能生成高质量图像。AI 写作、代码补全、翻译和内容创作进入规模化落地。",
        },
        {
          title: "百模大战与开源浪潮",
          body: "国内外科技公司相继发布自研大模型，Meta 开源 Llama 系列，推动模型本地化部署与生态繁荣。围绕算力、数据与训练框架的竞争，让大模型成为新一代基础设施。",
        },
      ],
      chips: [
        {
          label: "标志事件",
          text: "GPT-4、Llama、Claude 等模型密集发布",
        },
        {
          label: "社会影响",
          text: "生成式 AI 进入办公、设计、教育与软件开发的日常场景",
        },
      ],
      note: "AI 第一次以“人人可用”的生成工具形态进入大众生活，也为后续智能体时代打下基础。",
    },
    {
      id: "2024",
      year: "2024",
      title: "AI 科学新时代",
      short: "从实验室走向诺奖殿堂",
      summary:
        "2024 年，诺贝尔物理学奖与化学奖分别授予神经网络基础研究和 AlphaFold 蛋白质结构预测研究者，AI for Science 成为公认的科学新范式。",
      sections: [
        {
          title: "诺奖级认可",
          body: "Hinton 与 Hopfield 因神经网络与统计物理的交叉贡献获诺贝尔物理学奖；Hassabis 与 Jumper 因 AlphaFold 获诺贝尔化学奖。这标志着 AI 从工程工具升格为基础科学的一部分。",
        },
        {
          title: "加速科学发现",
          body: "AlphaFold 已覆盖数亿个蛋白质结构，GNoME 预测出大量新晶体材料。AI 正在药物研发、材料设计、气候模拟和天文发现中缩短周期，成为科学家的“第二大脑”。",
        },
      ],
      chips: [
        {
          label: "诺贝尔奖",
          text: "物理学奖：神经网络；化学奖：AlphaFold",
        },
        {
          label: "应用方向",
          text: "蛋白质、材料、药物、气候与天文",
        },
      ],
      note: "AI 不再只是“预测工具”，而是能够提出假设、设计实验并发现规律的科研伙伴。",
    },
    {
      id: "2025",
      year: "2025",
      title: "Agent 与推理模型元年",
      short: "从回答问题到完成任务",
      summary:
        "2025 年，大模型从“会对话”向“会推理、会执行”演进。深度推理模型和 AI Agent 开始自主拆解任务、调用工具并完成多步操作。",
      sections: [
        {
          title: "推理能力跃升",
          body: "o3、o4-mini、GPT-5、DeepSeek-R1 等模型通过思维链、搜索与强化学习提升复杂数学、编程和科学推理能力。模型不再只依赖单次直觉回答，而是会“先思考再回答”。",
        },
        {
          title: "智能体与自主工作流",
          body: "编码智能体、计算机操作智能体、多智能体协作系统开始进入真实工作流，能够阅读代码、运行测试、操作软件和处理重复任务。AI 的角色从助手变成协作者与执行者。",
        },
      ],
      chips: [
        {
          label: "关键技术",
          text: "思维链、强化学习、工具调用、多智能体协作",
        },
        {
          label: "行业变化",
          text: "软件工程、客服、数据分析和研究岗位出现新的 AI 工作方式",
        },
      ],
      note: "智能体让 AI 的边界从“生成内容”扩展到“完成目标”，成为通用人工智能发展的重要一步。",
    },
    {
      id: "2026",
      year: "2026",
      title: "具身智能与可信 AI",
      short: "走向物理世界与负责任治理",
      summary:
        "2026 年，AI 加速进入物理世界：人形机器人在工厂、物流和家庭场景落地，同时全球监管与安全研究同步强化，让技术发展更强调可控与可信。",
      sections: [
        {
          title: "具身智能落地",
          body: "大模型赋予机器人更强的感知、规划与操作能力，Optimus、Walker S、G1 等人形机器人从实验室走向产线巡检、搬运和养老服务。具身智能开始把数字智能转化为物理行动。",
        },
        {
          title: "治理、安全与对齐",
          body: "欧盟《AI 法案》进入执行阶段，中国持续完善生成式 AI 监管，行业建立更严格的安全评测、幻觉检测与可解释性标准。AI 对齐、安全审计和模型责任机制成为产品开发的基本要求。",
        },
      ],
      chips: [
        {
          label: "代表方向",
          text: "人形机器人、世界模型、AI 安全与对齐",
        },
        {
          label: "长期命题",
          text: "在能力快速扩张的同时，确保 AI 公平、安全、可解释且对人类有益",
        },
      ],
      note: "下一个里程碑不仅取决于模型能力，更取决于人类如何让强大技术沿着安全、公平与可信的方向发展。",
    },
  ];

  const list = document.getElementById("milestone-list");
  const detail = document.getElementById("detail-panel");

  function detailMarkup(m) {
    return `
      <div class="detail-heading">
        <span class="detail-year">${m.year}</span>
        <div>
          <h2>${m.title}</h2>
          <p>${m.short}</p>
        </div>
      </div>
      <p class="detail-summary">${m.summary}</p>
      ${m.sections
        .map(
          (s) => `
        <div class="detail-section">
          <h3>${s.title}</h3>
          <p>${s.body}</p>
        </div>`
        )
        .join("")}
      <div class="detail-grid">
        ${m.chips
          .map(
            (c) => `
          <div class="detail-chip">
            <strong>${c.label}</strong>
            <p>${c.text}</p>
          </div>`
          )
          .join("")}
      </div>
      ${m.note ? `<div class="detail-note">${m.note}</div>` : ""}
    `;
  }

  function setActive(id) {
    document.querySelectorAll(".milestone-button").forEach((btn) => {
      const active = btn.dataset.year === id;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const selected = milestones.find((m) => m.id === id) || milestones[0];
    detail.innerHTML = detailMarkup(selected);
  }

  list.innerHTML = milestones
    .map(
      (m) => `
      <button class="milestone-button" type="button" data-year="${m.id}" aria-pressed="false">
        <span class="milestone-dot" aria-hidden="true">${m.year.slice(0, 4)}</span>
        <strong>${m.year}</strong>
        <span>${m.short}</span>
      </button>`
    )
    .join("");

  function scrollDetail(smooth) {
    const target = document.getElementById("detail-panel");
    const header = document.querySelector(".site-header");
    const headerHeight = header ? header.getBoundingClientRect().height : 72;
    const top = Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - headerHeight - 16,
    );
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  }

  list.addEventListener("click", (event) => {
    const btn = event.target.closest(".milestone-button");
    if (!btn) return;
    const id = btn.dataset.year;
    setActive(id);
    try {
      history.replaceState(null, "", `?year=${id}`);
    } catch (_) {
      // 本地文件打开时不强制改写地址栏。
    }
    scrollDetail(true);
  });

  const initial = new URLSearchParams(window.location.search).get("year");
  setActive(initial || milestones[0].id);
  if (initial) {
    requestAnimationFrame(function () {
      scrollDetail(false);
    });
  }
})();
