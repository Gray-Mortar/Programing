# Iris 公共组件

`iris-peek.js` 提供扒在面板上沿的 Iris 组件。默认图片会相对于组件脚本自动加载，因此调用页面位于任何目录层级都不需要重新填写图片路径。

```html
<script src="../../components/iris-peek.js"></script>

<article class="panel-with-iris">
  <iris-peek label="点我继续" accessible-label="点击 Iris 进入下一步"></iris-peek>
  <!-- 面板内容 -->
</article>
```

承载组件的面板需要建立定位上下文，并为 Iris 留出上方空间：

```css
.panel-with-iris {
  position: relative;
  margin-top: 123px;
}
```

可以通过以下 CSS 变量调整位置和大小：

- `--iris-left`：距离面板左侧的位置，默认 `28px`
- `--iris-width`：组件宽度，默认 `260px`
- `--iris-height`：组件高度，默认 `123px`
- `--iris-z-index`：组件层级，默认 `5`
- `--iris-edge-overlap`：下沿模式的贴边补偿，默认 `0px`
- `--iris-right`：页眉模式下距离页眉右侧的位置，默认 `18px`
- `--iris-header-bottom`：页眉模式下与页眉底边的贴合补偿，默认 `-7px`

需要让 Iris 从面板下沿向下探出时，可以使用上下镜像的无按钮模式：

```html
<article class="panel-with-bottom-iris">
  <iris-peek placement="bottom" passive animated active></iris-peek>
  <!-- 面板内容 -->
</article>
```

- `placement="bottom"`：将 Iris 上下镜像并连接到面板下沿
- `passive`：纯展示模式，不创建按钮语义、不接收鼠标或键盘操作
- `animated`：启用半闭眼、闭眼和睁眼差分动画
- `active`：控制 Iris 探出；移除该属性时会缩回

交互模式点击后会派发可冒泡的 `iris-activate` 自定义事件。

## 页眉挂角模式

页眉挂角 Iris 继续使用同一组件。标准页面先加载统一页眉样式，再把组件放在 `.site-header` 内：

```html
<link rel="stylesheet" href="../components/site-header.css" />

<header class="site-header">
  <div class="container header-inner"><!-- 页眉内容 --></div>
  <iris-peek placement="header" passive animated active></iris-peek>
</header>

<script src="../components/iris-peek.js"></script>
```

引用路径需要根据页面目录层级调整。`placement="header"` 会把 Iris 上下翻转，让双手扣住页眉下沿、头和身体倒挂在页眉下方；统一尺寸与响应式位置由 `site-header.css` 管理。鼠标在页眉附近移动时，Iris 会轻微摆动并靠近指针，移出页眉后自动回正；点击 Iris 会平滑向下浏览一小段。组件采用绝对定位，不参与页眉排版，因此显示或隐藏不会推动 Logo、导航或账号按钮。

页面已有功能型 Iris 时，不添加页眉组件；采用统一模板的首页也可以保留组件并添加 `hidden`。普通课程、列表和功能页面直接显示。首页自我介绍区、课程中心卡片探头、做题反馈页和决策树实验都属于页面内已有主要 Iris 的情况。

## 首页自由挂靠模式

`placement="hero"` 用于把 Iris 放在首页介绍卡片内部。页面可以通过 `--iris-shift-x`、`--iris-shift-y` 和 `--iris-tilt` 三个变量提供轻微的鼠标反馈，而不需要复制组件或修改图片资源。

需要让 Iris 从探头姿态起身时，为组件添加 `rise`；再添加或移除 `standing` 来播放正向或反向过渡：

```html
<iris-peek placement="hero" passive animated active rise standing></iris-peek>
```

`--iris-rise-height` 控制起身舞台高度，`--iris-standing-width` 控制全身 Iris 的宽度，`--iris-standing-bottom` 可以微调脚底位置。`standing-pose="standing"` 使用自然站姿，`standing-pose="wave"` 使用挥手姿态。页眉倒挂模式不会响应 `rise`，避免站立素材破坏页眉挂角布局。

## 全身 Iris 组件

全身挥手形态与探头起身动画相互独立。需要在其他页面单独展示全身 Iris 时，加载 `iris-fullbody.js`：

```html
<iris-fullbody pose="wave" passive></iris-fullbody>
<script src="../components/iris-fullbody.js"></script>
```

默认 `pose="wave"` 使用挥手素材，`pose="standing"` 使用双臂自然下垂的站立素材。通过 `--iris-fullbody-width` 调整组件宽度；移除 `passive` 后，点击会派发 `iris-fullbody-activate` 事件。
