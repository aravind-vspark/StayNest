"""Resize the existing StayNest brand asset into native packaging slots."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(root / "web/icon-512.png").convert("RGB")
source.resize((1024, 1024), Image.Resampling.LANCZOS).save(root / "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")
for density, size in [("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)]:
    folder = root / f"android/app/src/main/res/mipmap-{density}"
    for name in ("ic_launcher.png", "ic_launcher_round.png"):
        source.resize((size, size), Image.Resampling.LANCZOS).save(folder / name)
    foreground = Image.new("RGB", (size * 2, size * 2), "#164f42")
    icon = source.resize((size, size), Image.Resampling.LANCZOS)
    foreground.paste(icon, (size // 2, size // 2))
    foreground.save(folder / "ic_launcher_foreground.png")
for folder in (root / "android/app/src/main/res").glob("drawable*"):
    for path in folder.glob("splash.png"):
        with Image.open(path) as existing:
            width, height = existing.size
        image = Image.new("RGB", (width, height), "#f8f9f5")
        size = min(width, height) // 4
        image.paste(source.resize((size, size), Image.Resampling.LANCZOS), ((width-size)//2, (height-size)//2))
        image.save(path)
for path in (root / "ios/App/App/Assets.xcassets/Splash.imageset").glob("*.png"):
    image = Image.new("RGB", (2732, 2732), "#f8f9f5")
    image.paste(source.resize((512, 512)), (1110, 1110))
    image.save(path)
print("Native launcher and splash assets generated from the existing StayNest icon.")
