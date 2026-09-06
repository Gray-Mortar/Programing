window.ML_QUESTIONS = {
    judge: [
        {
            type: "判断题",
            title: "机器学习可以根据数据中的规律完成预测或分类。",
            options: ["正确", "错误"],
            answer: "正确",
            explanation: "机器学习的主要目标就是从数据中学习规律，并应用到新的样本上。"
        },
        {
            type: "判断题",
            title: "训练集和测试集必须完全一样。",
            options: ["正确", "错误"],
            answer: "错误",
            explanation: "测试集应该与训练集分开，用来检查模型在新数据上的表现。"
        },
        {
            type: "判断题",
            title: "KNN 会根据最近的 K 个邻居的类别进行投票。",
            options: ["正确", "错误"],
            answer: "正确",
            explanation: "KNN 的核心思想就是通过邻居投票决定未知样本的类别。"
        }
    ],
    choice: [
        {
            type: "选择题",
            title: "下面哪一项最像分类任务？",
            options: ["预测明天房屋价格", "判断鸢尾花属于哪个品种", "统计全班平均身高"],
            answer: "判断鸢尾花属于哪个品种",
            explanation: "分类任务预测的是离散类别，像鸢尾花品种这样的输出。"
        },
        {
            type: "选择题",
            title: "在 KNN 中，K 值代表什么？",
            options: ["参与投票的邻居数量", "数据集中样本总数", "特征的维度"],
            answer: "参与投票的邻居数量",
            explanation: "K 表示选择距离未知样本最近的 K 个邻居参与投票。"
        },
        {
            type: "选择题",
            title: "下列哪一项属于无监督学习？",
            options: ["K-Means 聚类", "鸢尾花品种分类", "根据过去价格预测房价"],
            answer: "K-Means 聚类",
            explanation: "无监督学习通常在没有标签的数据中发现结构，聚类是常见代表。"
        }
    ],
    fill: [
        {
            type: "填空题",
            title: "KNN 中的 K 表示参与投票的 ______ 数量。",
            options: [],
            answer: "邻居",
            explanation: "KNN 会根据距离最近的 K 个邻居判断类别。"
        },
        {
            type: "填空题",
            title: "机器学习中，用于描述样本属性的数据被称为 ______。",
            options: [],
            answer: "特征",
            explanation: "特征是可以被模型用于学习的属性，例如花瓣长度。"
        }
    ]
};
