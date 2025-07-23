import os
import tweepy
from dotenv import load_dotenv
import requests
import io

load_dotenv()

# --- 認証情報の準備 ---
# API v2用（ツイート投稿、情報取得など）
def get_x_client_v2():
    client = tweepy.Client(
        consumer_key=os.getenv("X_API_KEY"),
        consumer_secret=os.getenv("X_API_KEY_SECRET"),
        access_token=os.getenv("X_ACCESS_TOKEN"),
        access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET")
    )
    return client

# API v1.1用（メディアアップロード用）
def get_x_api_v1():
    auth = tweepy.OAuth1UserHandler(
        os.getenv("X_API_KEY"), os.getenv("X_API_KEY_SECRET"),
        os.getenv("X_ACCESS_TOKEN"), os.getenv("X_ACCESS_TOKEN_SECRET")
    )
    return tweepy.API(auth)

# --- 機能ごとの関数 ---

def post_tweet(text: str, image_url: str | None = None):
    """
    テキストと、任意で画像のURLを受け取り、ツイートを投稿する関数
    """
    client_v2 = get_x_client_v2()
    
    media_ids = []
    if image_url:
        print(f"Image URL found. Uploading to Twitter: {image_url}")
        api_v1 = get_x_api_v1()
        try:
            # 1. URLから画像データをダウンロード
            response = requests.get(image_url, stream=True)
            response.raise_for_status()
            
            # 2. Tweepyを使ってXにメディアをアップロード
            media = api_v1.media_upload(filename="image.jpg", file=io.BytesIO(response.content))
            media_ids.append(media.media_id)
            print(f"Image uploaded to Twitter. Media ID: {media.media_id}")
        except Exception as e:
            print(f"Error uploading image to Twitter: {e}")
            raise e # エラーを呼び出し元に伝える

    try:
        # 3. テキストとメディアID（あれば）を使ってツイートを投稿
        response = client_v2.create_tweet(text=text, media_ids=media_ids if media_ids else None)
        print("Tweet posted successfully to X.")
        return response.data
    except Exception as e:
        print(f"Error posting tweet to X: {e}")
        raise e

def get_tweet_metrics(tweet_id: str):
    client = get_x_client_v2()
    try:
        response = client.get_tweets(ids=[tweet_id], tweet_fields=["public_metrics", "non_public_metrics"])
        if response.data:
            metrics = {}
            if response.data[0].public_metrics:
                metrics.update(response.data[0].public_metrics)
            if response.data[0].non_public_metrics:
                metrics.update(response.data[0].non_public_metrics)
            return metrics
        return {}
    except Exception as e:
        print(f"Error getting metrics for tweet {tweet_id}: {e}")
        raise e