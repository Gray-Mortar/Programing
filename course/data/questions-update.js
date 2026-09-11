(function () {
  const bank = window.ML_QUESTIONS;
  if (!bank) return;

  bank.fill = [
    {
      type: "填空题",
      title: "监督学习使用带 ____ 的样本，学习从输入特征到输出结果的映射。",
      options: [],
      answer: "标签",
      acceptedAnswers: ["标签", "标注", "label"],
      explanation:
        "监督学习依靠带标签的样本学习输入与输出之间的关系。没有标签时，通常需要转向无监督学习。",
      category: "机器学习全景与基本概念",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "预测连续数值的任务称为 ____，预测离散类别的任务称为分类。",
      options: [],
      answer: "回归",
      acceptedAnswers: ["回归", "regression"],
      explanation:
        "回归输出连续值，例如价格或温度；分类输出离散类别，例如垃圾邮件与正常邮件。",
      category: "机器学习全景与基本概念",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "强化学习通过与环境交互，根据 ____ 调整策略。",
      options: [],
      answer: "奖励",
      acceptedAnswers: ["奖励", "奖励信号", "reward"],
      explanation:
        "智能体根据环境返回的奖励信号判断动作的好坏，并逐渐学习能获得长期回报的策略。",
      category: "机器学习全景与基本概念",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "学习任务的三要素是假设空间、损失函数和 ____。",
      options: [],
      answer: "优化算法",
      acceptedAnswers: ["优化算法", "优化器", "optimizer"],
      explanation:
        "假设空间决定模型能表达什么，损失函数衡量错误，优化算法负责寻找使损失更低的参数。",
      category: "机器学习全景与基本概念",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "标准化会把特征转换为均值 0、标准差 ____ 的分布。",
      options: [],
      answer: "1",
      acceptedAnswers: ["1", "一"],
      explanation:
        "标准化通过减去均值再除以标准差，使不同量纲的特征处于相近尺度。",
      category: "数学与统计基础",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "梯度表示损失函数增长最 ____ 的方向，因此梯度下降会沿反方向更新参数。",
      options: [],
      answer: "快",
      acceptedAnswers: ["快", "最快"],
      explanation:
        "梯度指向函数在当前点增长最快的方向，参数更新时取其反方向即可降低损失。",
      category: "数学与统计基础",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "协方差为正，通常表示两个变量总体呈 ____ 变化趋势。",
      options: [],
      answer: "同向",
      acceptedAnswers: ["同向", "正相关", "相同方向"],
      explanation:
        "正协方差说明一个变量增大时，另一个变量总体上也倾向于增大，但数值大小会受到量纲影响。",
      category: "数学与统计基础",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "线上输入数据的分布逐渐偏离训练数据，这种现象称为数据 ____。",
      options: [],
      answer: "漂移",
      acceptedAnswers: ["漂移", "偏移", "drift"],
      explanation:
        "数据漂移会让模型面对与训练阶段不同的数据分布，因此需要持续监控并适时重训。",
      category: "数据理解与特征工程",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "标准化参数只能在训练集上拟合，再用于验证集和测试集，否则会造成数据 ____。",
      options: [],
      answer: "泄露",
      acceptedAnswers: ["泄露", "泄漏", "leakage"],
      explanation:
        "如果先用全量数据计算均值或方差，验证集和测试集的信息就会提前进入训练流程。",
      category: "数据理解与特征工程",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "对高基数类别特征直接使用独热编码，容易造成特征维度 ____。",
      options: [],
      answer: "爆炸",
      acceptedAnswers: ["爆炸", "膨胀", "快速增长"],
      explanation:
        "类别取值很多时，独热编码会生成大量稀疏维度，可以改用目标编码或嵌入等方法。",
      category: "数据理解与特征工程",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "线性回归通过最小化预测值与真实值之间的 ____ 来求解参数。",
      options: [],
      answer: "残差平方和",
      acceptedAnswers: ["残差平方和", "平方误差和", "sse"],
      explanation:
        "最小二乘法最小化所有样本残差的平方和，使预测直线尽量接近训练数据。",
      category: "监督学习——回归",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "在线性回归中加入权重平方和惩罚的方法称为 ____。",
      options: [],
      answer: "岭回归",
      acceptedAnswers: ["岭回归", "ridge", "l2正则化"],
      explanation:
        "岭回归使用 L2 正则化限制权重规模，有助于缓解共线性和过拟合。",
      category: "监督学习——回归",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "误差方差随特征取值变化的现象称为 ____。",
      options: [],
      answer: "异方差",
      acceptedAnswers: ["异方差", "heteroscedasticity"],
      explanation:
        "异方差意味着不同样本的误差波动并不相同，可能影响普通最小二乘估计的统计推断。",
      category: "监督学习——回归",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "在所有预测为正的样本中，真正为正的比例称为 ____。",
      options: [],
      answer: "精确率",
      acceptedAnswers: ["精确率", "查准率", "precision"],
      explanation:
        "精确率关注“预测为正的结果有多可靠”，适合误报代价较高的任务。",
      category: "监督学习——分类",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "在所有真正为正的样本中，被模型成功找出的比例称为 ____。",
      options: [],
      answer: "召回率",
      acceptedAnswers: ["召回率", "查全率", "recall"],
      explanation:
        "召回率关注“真正为正的样本有没有被漏掉”，适合漏报代价较高的任务。",
      category: "监督学习——分类",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "当正类样本很少时，____ 曲线通常比 ROC 曲线更能反映正类识别效果。",
      options: [],
      answer: "PR",
      acceptedAnswers: ["pr", "pr曲线", "precisionrecall"],
      explanation:
        "PR 曲线直接关注精确率与召回率，在类别极不平衡时通常比 ROC 更敏感。",
      category: "监督学习——分类",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "K-Means 会用每个簇内样本的 ____ 作为新的簇中心。",
      options: [],
      answer: "均值",
      acceptedAnswers: ["均值", "平均值", "质心"],
      explanation:
        "K-Means 在更新阶段计算每个簇中全部样本的均值，并将其作为下一轮的簇中心。",
      category: "无监督学习与降维",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "PCA 会寻找数据方差最 ____ 的正交方向作为主成分。",
      options: [],
      answer: "大",
      acceptedAnswers: ["大", "最大"],
      explanation:
        "方差越大，数据在该方向上的变化信息越多，因此 PCA 优先保留前几个主成分。",
      category: "无监督学习与降维",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "t-SNE 和 UMAP 常将高维数据降到 ____ 维，用于观察局部结构。",
      options: [],
      answer: "2",
      acceptedAnswers: ["2", "二", "两"],
      explanation:
        "二维投影方便绘制散点图，但降维后的距离不总是能直接解释为原始空间距离。",
      category: "无监督学习与降维",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "Bagging 通过对训练数据有放回抽样训练多个基学习器，主要降低 ____。",
      options: [],
      answer: "方差",
      acceptedAnswers: ["方差", "variance"],
      explanation:
        "多个差异较大的模型进行平均或投票，可以减少单个模型对训练噪声的敏感性。",
      category: "集成学习",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "Boosting 会逐步修正前一轮模型的错误，因此主要降低 ____。",
      options: [],
      answer: "偏差",
      acceptedAnswers: ["偏差", "bias"],
      explanation:
        "Boosting 通过串行训练不断关注难分类样本，使整体模型逐渐拟合更复杂的模式。",
      category: "集成学习",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "随机森林在 Bagging 的基础上，还引入了特征的 ____ 选择。",
      options: [],
      answer: "随机",
      acceptedAnswers: ["随机", "随机子集"],
      explanation:
        "每次分裂只考虑一部分随机特征，可以降低基决策树之间的相关性，让集成更稳健。",
      category: "集成学习",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "CNN 通过局部感受野和 ____ 大幅减少需要学习的参数。",
      options: [],
      answer: "权重共享",
      acceptedAnswers: ["权重共享", "参数共享", "weightsharing"],
      explanation:
        "同一个卷积核在整张图像上重复使用，使模型能够利用局部模式和平移特征。",
      category: "深度学习基础",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "RNN 通过 ____ 在不同序列位置之间传递信息。",
      options: [],
      answer: "隐藏状态",
      acceptedAnswers: ["隐藏状态", "隐状态", "hiddenstate"],
      explanation:
        "隐藏状态保存前序位置的信息，使模型能够处理文本、语音和时间序列等顺序数据。",
      category: "深度学习基础",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "Transformer 的核心机制是 ____，它能让每个位置聚合其他位置的信息。",
      options: [],
      answer: "自注意力",
      acceptedAnswers: ["自注意力", "selfattention", "注意力机制"],
      explanation:
        "自注意力根据当前位置与其他位置的相关程度分配权重，从而建立长距离依赖。",
      category: "深度学习基础",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "训练集用于拟合参数，验证集主要用于选择 ____。",
      options: [],
      answer: "超参数",
      acceptedAnswers: ["超参数", "hyperparameter"],
      explanation:
        "学习率、树的深度、正则化强度等超参数通常通过验证集比较和选择。",
      category: "模型评估与验证",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "如果反复依据测试集调整方案，测试集就会退化成 ____。",
      options: [],
      answer: "验证集",
      acceptedAnswers: ["验证集", "validationset"],
      explanation:
        "测试集用于最后一次评估；多次依据它调参会让报告结果过于乐观。",
      category: "模型评估与验证",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "把数据轮流划分为多折，并重复训练和验证的方法称为 ____。",
      options: [],
      answer: "交叉验证",
      acceptedAnswers: ["交叉验证", "crossvalidation", "k折交叉验证"],
      explanation:
        "交叉验证能更充分地利用有限数据，并观察模型性能在不同划分上的稳定性。",
      category: "模型评估与验证",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "验证损失连续多轮不再下降时提前结束训练，称为 ____。",
      options: [],
      answer: "早停",
      acceptedAnswers: ["早停", "earlystopping"],
      explanation:
        "早停通过监控验证集性能，在模型开始过拟合前停止训练。",
      category: "优化、调参与正则化",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "训练时按概率随机丢弃部分神经元的方法称为 ____。",
      options: [],
      answer: "Dropout",
      acceptedAnswers: ["dropout", "随机失活"],
      explanation:
        "Dropout 降低神经元之间对固定组合的依赖，通常可以减少过拟合。",
      category: "优化、调参与正则化",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "L1 正则化倾向于产生 ____ 的参数解。",
      options: [],
      answer: "稀疏",
      acceptedAnswers: ["稀疏", "sparse"],
      explanation:
        "L1 正则化会把部分权重压到 0，因此常被用于特征选择。",
      category: "优化、调参与正则化",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "离线训练与在线推理使用不同特征逻辑，会造成训练-推理 ____。",
      options: [],
      answer: "偏差",
      acceptedAnswers: ["偏差", "偏斜", "skew"],
      explanation:
        "训练与推理特征不一致会让线上表现偏离离线评估，是工程中常见的事故来源。",
      category: "机器学习工程化",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "新模型逐步放量并持续监控，出现异常就回滚，这种方式称为 ____。",
      options: [],
      answer: "灰度发布",
      acceptedAnswers: ["灰度发布", "金丝雀发布", "canaryrelease"],
      explanation:
        "灰度发布会先让少量真实流量使用新模型，再根据指标逐步扩大范围。",
      category: "机器学习工程化",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "集中记录模型版本、指标和审批状态的系统称为模型 ____。",
      options: [],
      answer: "注册表",
      acceptedAnswers: ["注册表", "registry", "模型注册表"],
      explanation:
        "模型注册表帮助团队追踪模型来源、评估证据和上线状态，提升复现能力。",
      category: "机器学习工程化",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "监控线上输入分布是否偏离训练数据，属于 ____ 漂移监控。",
      options: [],
      answer: "数据",
      acceptedAnswers: ["数据", "datadrift"],
      explanation:
        "数据漂移不一定会立刻体现为性能下降，因此需要在模型效果恶化前主动发现。",
      category: "机器学习工程化",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "SHAP 和 LIME 常用于解释 ____ 个预测的决策依据。",
      options: [],
      answer: "单",
      acceptedAnswers: ["单", "一", "单个"],
      explanation:
        "局部解释方法帮助理解某一具体样本为什么得到当前预测，但不能直接证明因果关系。",
      category: "可解释性、公平性与安全",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "PDP 和 ALE 用于观察模型在 ____ 层面的平均行为。",
      options: [],
      answer: "整体",
      acceptedAnswers: ["整体", "全局", "global"],
      explanation:
        "全局解释关注模型整体如何响应某个特征，而局部解释更关注单个样本。",
      category: "可解释性、公平性与安全",
      difficulty: "进阶",
    },
    {
      type: "填空题",
      title: "解释方法展示的是模型学到的相关性，不能直接证明 ____。",
      options: [],
      answer: "因果",
      acceptedAnswers: ["因果", "因果关系", "causality"],
      explanation:
        "模型解释说明模型内部如何使用特征，不等同于现实中存在因果效应。",
      category: "可解释性、公平性与安全",
      difficulty: "实践",
    },
    {
      type: "填空题",
      title: "在尝试复杂模型前，应先建立一个可解释的 ____。",
      options: [],
      answer: "基线模型",
      acceptedAnswers: ["基线模型", "baseline", "基线"],
      explanation:
        "基线模型能帮助判断新增复杂度是否真的带来稳定收益，并作为后续比较标准。",
      category: "学习路径与常见误区",
      difficulty: "基础",
    },
    {
      type: "填空题",
      title: "在最终部署前，用独立数据评估模型泛化表现的过程称为模型 ____。",
      options: [],
      answer: "验证",
      acceptedAnswers: ["验证", "评估", "validation"],
      explanation:
        "模型验证强调使用未参与训练的数据，避免把记忆训练集误认为真正泛化。",
      category: "学习路径与常见误区",
      difficulty: "实践",
    },
  ];

  bank.matching = [
    {
      type: "配对题",
      title: "把左侧的学习方式拖到右侧对应的任务特征上。",
      options: [],
      pairs: [
        {
          id: "supervised",
          label: "监督学习",
          visual: "target",
          description: "使用带标签的样本，学习输入到输出的映射。",
        },
        {
          id: "unsupervised",
          label: "无监督学习",
          visual: "cluster",
          description: "没有标签，寻找数据内部的结构、簇或低维表示。",
        },
        {
          id: "reinforcement",
          label: "强化学习",
          visual: "loop",
          description: "智能体与环境交互，根据奖励信号调整长期策略。",
        },
        {
          id: "semi-supervised",
          label: "半监督学习",
          visual: "split",
          description: "同时利用少量有标签样本和大量无标签样本。",
        },
      ],
      answer:
        "监督学习→带标签样本；无监督学习→发现数据结构；强化学习→奖励与策略；半监督学习→少量标签加大量无标签数据",
      explanation:
        "四种学习方式的核心区别在于是否有标签、是否与环境交互，以及训练信号来自哪里。",
      category: "机器学习全景与基本概念",
      difficulty: "基础",
    },
    {
      type: "配对题",
      title: "把统计概念拖到它描述的数学含义上。",
      options: [],
      pairs: [
        {
          id: "mean",
          label: "期望",
          visual: "center",
          description: "描述随机变量取值的中心位置。",
        },
        {
          id: "variance",
          label: "方差",
          visual: "spread",
          description: "描述取值相对均值的离散程度。",
        },
        {
          id: "covariance",
          label: "协方差",
          visual: "link",
          description: "描述两个变量共同变化的方向和线性关系。",
        },
        {
          id: "gradient",
          label: "梯度",
          visual: "arrow",
          description: "描述函数在当前点增长最快的方向。",
        },
      ],
      answer:
        "期望→中心位置；方差→离散程度；协方差→共同变化方向；梯度→增长最快方向",
      explanation:
        "这些统计量分别描述中心、波动、变量关系和优化方向，是理解损失与模型更新的基础。",
      category: "数学与统计基础",
      difficulty: "基础",
    },
    {
      type: "配对题",
      title: "把数据处理动作拖到它要解决的问题上。",
      options: [],
      pairs: [
        {
          id: "missing",
          label: "缺失值填补",
          visual: "patch",
          description: "处理某些字段没有记录或记录不完整的问题。",
        },
        {
          id: "outlier",
          label: "异常值处理",
          visual: "outlier",
          description: "识别明显偏离整体分布、可能影响训练的数据点。",
        },
        {
          id: "deduplicate",
          label: "去重",
          visual: "stack",
          description: "移除重复样本，避免某些模式被重复放大。",
        },
        {
          id: "drift",
          label: "数据漂移监控",
          visual: "wave",
          description: "发现线上输入分布逐渐偏离训练数据的问题。",
        },
      ],
      answer:
        "缺失值填补→记录不完整；异常值处理→偏离整体分布；去重→重复样本；数据漂移监控→线上分布改变",
      explanation:
        "数据质量、重复样本和分布变化会从不同层面影响训练结果和线上效果。",
      category: "数据理解与特征工程",
      difficulty: "基础",
    },
    {
      type: "配对题",
      title: "把回归损失或指标拖到它最适合的场景上。",
      options: [],
      pairs: [
        {
          id: "mse",
          label: "MSE",
          visual: "square",
          description: "强烈惩罚大误差，适合大误差代价较高的任务。",
        },
        {
          id: "mae",
          label: "MAE",
          visual: "line",
          description: "对异常值相对稳健，测量绝对误差的平均水平。",
        },
        {
          id: "rmse",
          label: "RMSE",
          visual: "ruler",
          description: "与目标变量量纲一致，同时保留对大误差的惩罚。",
        },
        {
          id: "quantile",
          label: "分位数损失",
          visual: "gauge",
          description: "关注指定分位数，适合风险不对称的预测任务。",
        },
      ],
      answer:
        "MSE→强惩罚大误差；MAE→稳健；RMSE→量纲一致；分位数损失→关注分位数",
      explanation:
        "不同损失函数对大误差、异常值和风险分位的关注程度不同，应按业务代价选择。",
      category: "监督学习——回归",
      difficulty: "进阶",
    },
    {
      type: "配对题",
      title: "把分类指标拖到它真正衡量的内容上。",
      options: [],
      pairs: [
        {
          id: "precision",
          label: "精确率",
          visual: "target",
          description: "预测为正的样本中，真正为正的比例。",
        },
        {
          id: "recall",
          label: "召回率",
          visual: "search",
          description: "真正为正的样本中，被成功找到的比例。",
        },
        {
          id: "f1",
          label: "F1",
          visual: "balance",
          description: "精确率和召回率的调和平均。",
        },
        {
          id: "auc",
          label: "ROC-AUC",
          visual: "curve",
          description: "衡量模型把正样本排在负样本之前的整体排序能力。",
        },
      ],
      answer:
        "精确率→预测为正的可靠性；召回率→找出正类的覆盖程度；F1→精确率与召回率平衡；ROC-AUC→整体排序能力",
      explanation:
        "选择分类指标时要先明确更怕误报还是更怕漏报，不能只看单一准确率。",
      category: "监督学习——分类",
      difficulty: "基础",
    },
    {
      type: "配对题",
      title: "把无监督算法拖到它擅长解决的问题上。",
      options: [],
      pairs: [
        {
          id: "kmeans",
          label: "K-Means",
          visual: "centroid",
          description: "把样本划分到 K 个簇，并迭代更新簇中心。",
        },
        {
          id: "pca",
          label: "PCA",
          visual: "axis",
          description: "寻找方差最大的正交方向，得到线性低维表示。",
        },
        {
          id: "dbscan",
          label: "DBSCAN",
          visual: "density",
          description: "根据密度连接簇，并把低密度区域识别为噪声。",
        },
        {
          id: "tsne",
          label: "t-SNE",
          visual: "cloud",
          description: "保留局部邻域结构，常用于高维数据二维可视化。",
        },
      ],
      answer:
        "K-Means→簇中心；PCA→最大方差正交方向；DBSCAN→密度与噪声；t-SNE→局部结构可视化",
      explanation:
        "聚类和降维目标不同，算法对簇形状、线性和距离尺度也有不同假设。",
      category: "无监督学习与降维",
      difficulty: "进阶",
    },
    {
      type: "配对题",
      title: "把集成方法拖到它主要的组合方式上。",
      options: [],
      pairs: [
        {
          id: "bagging",
          label: "Bagging",
          visual: "bootstrap",
          description: "对训练数据有放回抽样，并行训练并平均多个模型。",
        },
        {
          id: "boosting",
          label: "Boosting",
          visual: "stairs",
          description: "串行训练模型，让后一个模型重点修正前面的错误。",
        },
        {
          id: "stacking",
          label: "Stacking",
          visual: "layers",
          description: "用元模型学习如何组合多个基模型的预测。",
        },
        {
          id: "random-forest",
          label: "随机森林",
          visual: "forest",
          description: "在 Bagging 基础上加入随机特征选择，集成多棵决策树。",
        },
      ],
      answer:
        "Bagging→抽样并行平均；Boosting→串行修正错误；Stacking→元模型组合；随机森林→决策树加随机特征",
      explanation:
        "集成方法通过组合多个模型降低方差、偏差或两者，但训练方式和基模型相关性不同。",
      category: "集成学习",
      difficulty: "进阶",
    },
    {
      type: "配对题",
      title: "把网络结构或训练方法拖到它的主要作用上。",
      options: [],
      pairs: [
        {
          id: "cnn",
          label: "CNN",
          visual: "grid",
          description: "利用局部连接和权重共享处理网格型数据。",
        },
        {
          id: "rnn",
          label: "RNN",
          visual: "sequence",
          description: "利用隐藏状态在序列位置之间传递信息。",
        },
        {
          id: "transformer",
          label: "Transformer",
          visual: "attention",
          description: "通过自注意力聚合序列中任意位置的信息。",
        },
        {
          id: "dropout",
          label: "Dropout",
          visual: "mask",
          description: "训练时随机失活部分神经元，降低过拟合风险。",
        },
      ],
      answer:
        "CNN→局部连接和权重共享；RNN→序列隐藏状态；Transformer→自注意力；Dropout→随机失活",
      explanation:
        "网络结构决定信息如何流动，Dropout 则是常见的正则化手段。",
      category: "深度学习基础",
      difficulty: "进阶",
    },
    {
      type: "配对题",
      title: "把数据划分拖到它在模型开发中的主要用途上。",
      options: [],
      pairs: [
        {
          id: "train",
          label: "训练集",
          visual: "converge",
          description: "用于拟合模型参数。",
        },
        {
          id: "validation",
          label: "验证集",
          visual: "compare",
          description: "用于选择超参数和比较候选方案。",
        },
        {
          id: "test",
          label: "测试集",
          visual: "lock",
          description: "只在方案定型后进行最终评估，近似模拟未来数据。",
        },
        {
          id: "cross-validation",
          label: "交叉验证",
          visual: "cycle",
          description: "轮流使用不同折作为验证集，评估结果更稳定。",
        },
      ],
      answer:
        "训练集→拟合参数；验证集→选择方案；测试集→最终评估；交叉验证→多折轮换评估",
      explanation:
        "数据划分的核心目的是避免信息泄露，并让模型评估尽量接近真实泛化表现。",
      category: "模型评估与验证",
      difficulty: "基础",
    },
    {
      type: "配对题",
      title: "把优化或正则化方法拖到它的主要效果上。",
      options: [],
      pairs: [
        {
          id: "l1",
          label: "L1 正则化",
          visual: "diamond",
          description: "容易把部分权重压到 0，产生稀疏解。",
        },
        {
          id: "l2",
          label: "L2 正则化",
          visual: "circle",
          description: "限制权重整体规模，缓解共线性和过拟合。",
        },
        {
          id: "early-stop",
          label: "早停",
          visual: "stop",
          description: "验证性能不再改善时提前结束训练。",
        },
        {
          id: "learning-rate",
          label: "学习率",
          visual: "slope",
          description: "控制每次参数更新的步长。",
        },
      ],
      answer:
        "L1→稀疏解；L2→限制权重规模；早停→防止继续过拟合；学习率→控制更新步长",
      explanation:
        "优化方法影响参数如何更新，正则化方法影响参数被允许长成什么样。",
      category: "优化、调参与正则化",
      difficulty: "进阶",
    },
    {
      type: "配对题",
      title: "把工程实践拖到它解决的问题上。",
      options: [],
      pairs: [
        {
          id: "feature-store",
          label: "特征存储",
          visual: "database",
          description: "统一离线训练和在线推理的特征定义与获取方式。",
        },
        {
          id: "registry",
          label: "模型注册表",
          visual: "archive",
          description: "记录模型版本、指标、数据版本和审批状态。",
        },
        {
          id: "shadow",
          label: "影子模式",
          visual: "ghost",
          description: "新模型接收真实请求，但预测结果不影响业务决策。",
        },
        {
          id: "canary",
          label: "灰度发布",
          visual: "steps",
          description: "先向少量真实流量发布，再逐步扩大范围。",
        },
      ],
      answer:
        "特征存储→统一特征逻辑；模型注册表→跟踪版本与证据；影子模式→旁路验证；灰度发布→逐步放量",
      explanation:
        "工程实践关注模型从训练到上线的可复现、可观测和可回滚。",
      category: "机器学习工程化",
      difficulty: "实践",
    },
    {
      type: "配对题",
      title: "把解释或安全概念拖到它的侧重点上。",
      options: [],
      pairs: [
        {
          id: "global",
          label: "全局解释",
          visual: "globe",
          description: "观察模型整体如何响应某个特征。",
        },
        {
          id: "local",
          label: "局部解释",
          visual: "pin",
          description: "解释某一个具体样本为什么得到当前预测。",
        },
        {
          id: "fairness",
          label: "公平性评估",
          visual: "balance",
          description: "比较模型在不同群体上的错误率或预测比例。",
        },
        {
          id: "security",
          label: "模型安全",
          visual: "shield",
          description: "关注投毒、对抗样本、隐私泄露等风险。",
        },
      ],
      answer:
        "全局解释→模型整体行为；局部解释→单个预测；公平性评估→群体差异；模型安全→攻击与隐私风险",
      explanation:
        "解释性、公平性和安全性从不同角度检查模型是否可信，但不能互相替代。",
      category: "可解释性、公平性与安全",
      difficulty: "进阶",
    },
    {
      type: "配对题",
      title: "把学习流程拖到它在项目中的先后作用上。",
      options: [],
      pairs: [
        {
          id: "concept",
          label: "理解问题",
          visual: "compass",
          description: "明确任务目标、预测对象、评价指标和使用场景。",
        },
        {
          id: "data",
          label: "理解数据",
          visual: "search",
          description: "检查数据来源、质量、分布和潜在泄露。",
        },
        {
          id: "baseline",
          label: "建立基线",
          visual: "flag",
          description: "先用简单模型形成可靠、可解释的对比标准。",
        },
        {
          id: "iteration",
          label: "迭代优化",
          visual: "cycle",
          description: "根据误差分析逐步尝试特征、模型和参数改进。",
        },
      ],
      answer:
        "理解问题→明确目标；理解数据→检查质量与分布；建立基线→形成对比标准；迭代优化→基于误差持续改进",
      explanation:
        "有效的机器学习流程先建立问题和数据基线，再用误差分析指导复杂度增加。",
      category: "学习路径与常见误区",
      difficulty: "基础",
    },
  ];
})();
