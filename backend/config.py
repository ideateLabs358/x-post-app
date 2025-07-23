import os
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

    # X (Twitter) API
    X_API_KEY: str = os.getenv("X_API_KEY")
    X_API_KEY_SECRET: str = os.getenv("X_API_KEY_SECRET")
    X_ACCESS_TOKEN: str = os.getenv("X_ACCESS_TOKEN")
    X_ACCESS_TOKEN_SECRET: str = os.getenv("X_ACCESS_TOKEN_SECRET")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET")

# 設定のインスタンスを作成して、他のファイルから使えるようにする
settings = Settings()
