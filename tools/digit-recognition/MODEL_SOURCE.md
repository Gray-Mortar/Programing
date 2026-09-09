# 模型来源

- 模型：MNIST-8
- 来源：ONNX Model Zoo（`onnx/models`）
- 原始路径：`validated/vision/classification/mnist/model/mnist-8.onnx`
- 许可证：MIT
- 输入：`float32`，形状 `[1, 1, 28, 28]`
- 图像：黑色背景、白色数字、像素范围 `0.0～1.0`
- 输出：形状 `[1, 10]` 的 softmax 前分数
- 官方说明：https://github.com/onnx/models/tree/main/validated/vision/classification/mnist

网页通过 ONNX Runtime Web 在浏览器本地运行该模型，不会上传用户笔迹。
