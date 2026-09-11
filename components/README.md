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
