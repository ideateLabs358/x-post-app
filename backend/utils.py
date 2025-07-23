import requests
from bs4 import BeautifulSoup
import cloudinary
import cloudinary.uploader
import traceback

# このファイルからは、osやdotenvの読み込み、config設定をすべて削除します
        
def scrape_text_from_url(url: str) -> str | None:
    """
    指定されたURLからプレーンテキストを抽出する関数
    """
    try:
        headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        response.encoding = response.apparent_encoding
        soup = BeautifulSoup(response.text, 'lxml')
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        if len(text) < 100:
            return None
        return text
    except requests.RequestException as e:
        print(f"Error fetching or reading URL {url}: {e}")
        return None

def upload_image_bytes_to_cloudinary(image_bytes: bytes) -> str | None:
    """
    画像データ（バイト）を受け取り、Cloudinaryにアップロードして、そのURLを返す関数
    """
    try:
        # この関数は、設定済みのCloudinaryライブラリを使ってアップロードするだけになります
        upload_result = cloudinary.uploader.upload(
            image_bytes,
            folder="x_post_app"
        )
        print("Image uploaded successfully to Cloudinary.")
        return upload_result.get('secure_url')
    except Exception as e:
        print(f"Error uploading image to Cloudinary: {e}")
        traceback.print_exc()
        return None
