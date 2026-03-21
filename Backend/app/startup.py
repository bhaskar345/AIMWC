import os
import gdown
import shutil

VERSION_FILE = "version.txt"
MODEL_DIR = "model"
VERSION_TRACK = os.path.join(MODEL_DIR, ".version")

def ensure_model():
    print("Checking model...")

    if not os.path.exists(VERSION_FILE):
        print("❌ version.txt not found")
        return

    version = None
    current_version = None
    folder_id = None

    with open(VERSION_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("version="):
                version = line.split("=")[1]
            elif line.startswith("folder_id="):
                folder_id = line.split("=")[1]

    if not version or not folder_id:
        print("Invalid version.txt")
        return

    if os.path.exists(VERSION_TRACK):
        with open(VERSION_TRACK, "r") as f:
            current_version = f.read().strip()

        if current_version == version:
            print(f"Model already up-to-date (v{version})")
            return

    print(f"Updating model to version {version}...")

    if os.path.exists(MODEL_DIR):
        shutil.rmtree(MODEL_DIR)

    os.makedirs(MODEL_DIR, exist_ok=True)

    gdown.download_folder(
        id=folder_id,
        output=MODEL_DIR,
        quiet=False,
        use_cookies=False
    )

    with open(VERSION_TRACK, "r") as f:
        current_version = f.read().strip()

    lines = []
    found = False

    with open(VERSION_FILE, "r") as f:
        for line in f:
            if line.strip().startswith("version="):
                lines.append(f"version={current_version}\n")
                found = True
            else:
                lines.append(line)

    if not found:
        lines.insert(0, f"version={current_version}\n")

    with open(VERSION_FILE, "w") as f:
        f.writelines(lines)

    print("Model ready.")