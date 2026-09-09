"""训练一个简单的 MNIST CNN，并导出为浏览器可用的 ONNX 模型。

这份脚本仅用于学习和复现，网页默认使用已经准备好的 MNIST-8 模型，
不需要执行本文件即可运行。
"""

from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms


class MnistCnn(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=5, padding=2),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 32, kernel_size=5, padding=2),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(32 * 7 * 7, 128),
            nn.ReLU(),
            nn.Linear(128, 10),
        )

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(inputs))


def evaluate(model: nn.Module, loader: DataLoader, device: torch.device) -> float:
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            predictions = model(images).argmax(dim=1)
            correct += (predictions == labels).sum().item()
            total += labels.size(0)
    return correct / total


def main() -> None:
    torch.manual_seed(42)
    output_dir = Path(__file__).resolve().parent / "output"
    output_dir.mkdir(exist_ok=True)

    transform = transforms.ToTensor()
    train_data = datasets.MNIST("data", train=True, download=True, transform=transform)
    test_data = datasets.MNIST("data", train=False, download=True, transform=transform)
    train_loader = DataLoader(train_data, batch_size=128, shuffle=True)
    test_loader = DataLoader(test_data, batch_size=256)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = MnistCnn().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_function = nn.CrossEntropyLoss()

    for epoch in range(1, 6):
        model.train()
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            loss = loss_function(model(images), labels)
            loss.backward()
            optimizer.step()
        accuracy = evaluate(model, test_loader, device)
        print(f"Epoch {epoch}: test accuracy = {accuracy:.2%}")

    model = model.cpu().eval()
    torch.save(model.state_dict(), output_dir / "mnist-cnn.pth")
    torch.onnx.export(
        model,
        torch.zeros(1, 1, 28, 28),
        output_dir / "mnist-cnn.onnx",
        input_names=["input"],
        output_names=["logits"],
        opset_version=12,
    )
    print(f"Model exported to {output_dir / 'mnist-cnn.onnx'}")


if __name__ == "__main__":
    main()
