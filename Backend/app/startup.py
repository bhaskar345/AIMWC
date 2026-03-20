import os
import gdown

Model_Download_Link = "https://drive.google.com/drive/folders/1Cq6_ClVG1xBriuZbCVHmFfcgvFDNv5kp"
DOWNLOAD_DIR = "model"


def download_models_if_needed():
    if os.path.exists(DOWNLOAD_DIR) and os.listdir(DOWNLOAD_DIR):
        print("Model already exist. Skipping download.")
        return

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    try:
        print("Downloading model...")
        
        gdown.download_folder(
            Model_Download_Link,
            output=DOWNLOAD_DIR,
            quiet=False,
            use_cookies=False
        )

    except Exception as e:
        print(f"Download failed: {e}")