import os
import re
import traceback
import json
import google.generativeai as genai
from typing import List
from datetime import datetime, timezone
from contextlib import asynccontextmanager

# ステップ1：最初に、設定に必要なライブラリだけをインポート
from fastapi import FastAPI, Depends, HTTPException, Response, status, File, UploadFile
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
import cloudinary

# ステップ2：設定完了後に、私たちの作った部品をインポートする
import database, models, schemas, crud, x_client, utils

# --- スケジューラーの定義 ---
scheduler = BackgroundScheduler(timezone="UTC")

def post_scheduled_tweets():
    """予約時間になった投稿をチェックして投稿する関数"""
    db = database.SessionLocal()
    # print(f"[{datetime.now()}] Checking for scheduled posts...")
    
    posts_to_send = db.query(models.Post).filter(
        models.Post.status == "scheduled",
        models.Post.scheduled_at <= datetime.now(timezone.utc)
    ).all()

    if not posts_to_send:
        db.close()
        return

    for post in posts_to_send:
        print(f"Posting tweet for post ID: {post.id}")
        try:
            posted_tweet_data = x_client.post_tweet(text=post.content, image_url=post.image_url)
            tweet_id = posted_tweet_data.get('id')
            crud.update_post_status(db, post_id=post.id, status="posted", tweet_id=tweet_id)
            print(f"Successfully posted post ID: {post.id}")
        except Exception as e:
            print(f"Failed to post post ID: {post.id}. Error: {e}")
            crud.update_post_status(db, post_id=post.id, status="failed")
    
    db.close()

# --- アプリケーションのライフサイクル管理（起動・終了処理） ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- アプリケーション起動時の処理 ---
    print("--- Application starting up... ---")
    
    # 1. .envファイルを読み込む
    load_dotenv()
    print(".env file loaded.")
    
    # 2. Geminiの設定
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    print("Gemini configured.")
    
    # 3. Cloudinaryの設定
    cloudinary.config( 
      cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
      api_key = os.getenv("CLOUDINARY_API_KEY"), 
      api_secret = os.getenv("CLOUDINARY_API_SECRET"),
      secure = True
    )
    print("Cloudinary configured.")

    # 4. データベーステーブルの作成
    models.Base.metadata.create_all(bind=database.engine)
    print("Database tables checked/created.")

    # 5. スケジューラーのジョブを追加して開始
    scheduler.add_job(post_scheduled_tweets, 'interval', minutes=1)
    scheduler.start()
    print("Scheduler has been started.")
    
    print("--- Application startup complete. ---")
    yield
    
    # --- アプリケーション終了時の処理 ---
    print("--- Application shutting down... ---")
    scheduler.shutdown()
    print("Scheduler has been shut down.")

# --- FastAPIアプリのインスタンス化 ---
app = FastAPI(lifespan=lifespan)

# --- CORSミドルウェアの設定 ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- データベースセッション ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- APIエンドポイント ---
# -- Project Endpoints --
@app.post("/projects/", response_model=schemas.Project)
def create_project_api(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    print(f"--- プロジェクト作成処理開始: URL = {project.url} ---")
    scraped_text = utils.scrape_text_from_url(project.url)
    summary = ""
    if scraped_text:
        print("--- テキストの抽出に成功！AIによる要約を開始します。 ---")
        try:
            summarization_prompt = f"""以下のウェブサイトから抽出したテキストを分析し、このプロジェクトの核心的な価値、特徴、ターゲット顧客について、簡潔に要約してください。\n\n---テキスト---\n{scraped_text[:4000]}"""
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(summarization_prompt)
            summary = response.text
            print("--- AIによる要約が完了しました。 ---")
        except Exception as e:
            print(f"!!!!!! AIによる要約中にエラーが発生: {e} !!!!!!")
            summary = f"AIによる要約に失敗しました: {e}"
    else:
        print("--- テキストの抽出に失敗、または内容が短すぎました。要約はスキップします。 ---")

    print("--- データベースにプロジェクトを保存します... ---")
    new_project = crud.create_project(db=db, project=project, research_summary=summary)
    print(f"--- プロジェクト保存完了: ID = {new_project.id} ---")
    return new_project

@app.get("/projects/", response_model=List[schemas.Project])
def read_projects_api(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_projects(db, skip=skip, limit=limit)

@app.get("/projects/{project_id}", response_model=schemas.Project)
def read_project_api(project_id: int, db: Session = Depends(get_db)):
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.put("/projects/{project_id}", response_model=schemas.Project)
def update_project_api(project_id: int, project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    updated_project = crud.update_project(db, project_id=project_id, project=project)
    if updated_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project

@app.put("/projects/{project_id}/summary", response_model=schemas.Project)
def update_project_summary_api(project_id: int, summary_data: schemas.ProjectSummaryUpdate, db: Session = Depends(get_db)):
    updated_project = crud.update_project_summary(db, project_id=project_id, summary=summary_data.research_summary)
    if updated_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project

@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_api(project_id: int, db: Session = Depends(get_db)):
    result = crud.delete_project(db, project_id=project_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# -- Post Endpoints --
@app.post("/projects/{project_id}/generate-posts", response_model=List[schemas.Post])
def generate_posts_api(project_id: int, request_body: schemas.GeneratePostsRequest, db: Session = Depends(get_db)):
    try:
        project = crud.get_project(db, project_id=project_id)
        if not project: raise HTTPException(status_code=404, detail="Project not found")
        
        prompt_template_setting = crud.get_setting(db, key="default_post_prompt")
        if not prompt_template_setting or not prompt_template_setting.value: raise HTTPException(status_code=500, detail="Default prompt template not found in settings")
        
        prompt_template = prompt_template_setting.value

        character_prompt_part = ""
        if request_body.character_id:
            character = crud.get_character(db, character_id=request_body.character_id)
            if character:
                character_prompt_part = f"""
# 投稿者キャラクター情報
あなたは以下の設定を持つ、非常に魅力的な人物です。このキャラクターに完全になりきって、コンテンツを作成してください。
- 肩書: {character.title}
- 専門分野: {character.expertise}
- 背景: {character.background}
- 価値観: {character.values_beliefs}
- 目標: {character.goal}
- 口調: {character.base_tone}で、以下の特徴を持つ: {character.style_features}
- 口癖: {character.catchphrases}
- 読者に与えたい印象: {character.impression}
"""
        
        target_persona_prompt_part = ""
        if request_body.target_persona_id:
            target_persona = crud.get_target_persona(db, persona_id=request_body.target_persona_id)
            if target_persona:
                target_persona_prompt_part = f"""
# ターゲット読者情報
以下のペルソナを持つ読者に、最も響くようにコンテンツを作成してください。
- ペルソナ: {target_persona.name}
- 抱えている課題: {target_persona.challenges}
- 達成したいこと: {target_persona.goals}
- 知識レベル: {target_persona.knowledge_level}
- 心を動かすキーワード: {target_persona.keywords}
- 行動の決め手: {target_persona.decision_triggers}
"""

        prompt = prompt_template.replace("{{language}}", request_body.language or "日本語")
        prompt = prompt.replace("{{character_section}}", character_prompt_part)
        prompt = prompt.replace("{{target_persona_section}}", target_persona_prompt_part)
        prompt = prompt.replace("{{project_name}}", project.name)
        prompt = prompt.replace("{{project_url}}", project.url)
        prompt = prompt.replace("{{research_summary}}", project.research_summary or "調査結果なし")
        prompt = prompt.replace("{{hashtags}}", project.hashtags or "")
        
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        ai_text = response.text
        
        crud.update_project_ai_response(db, project_id=project_id, ai_response=ai_text)
        
        post_blocks = ai_text.split('---')
        newly_created_posts = []
        for block in post_blocks:
            content = block.strip()
            if content:
                post_schema = schemas.PostCreate(content=content)
                new_post = crud.create_project_post(db=db, post=post_schema, project_id=project_id)
                newly_created_posts.append(new_post)
        
        return newly_created_posts
        
    except Exception as e:
        print(f"!!!!!! 例外が発生しました !!!!!!\nエラーのタイプ: {type(e)}\nエラーの詳細: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AIの生成または保存に失敗しました: {str(e)}")

@app.post("/projects/{project_id}/generate-note-article", response_model=dict)
def generate_note_article_api(project_id: int, request_body: schemas.GeneratePostsRequest, db: Session = Depends(get_db)):
    try:
        project = crud.get_project(db, project_id=project_id)
        if not project: raise HTTPException(status_code=404, detail="Project not found")
        
        prompt_template_setting = crud.get_setting(db, key="default_note_prompt")
        if not prompt_template_setting or not prompt_template_setting.value: raise HTTPException(status_code=500, detail="Default note prompt template not found in settings")
        
        prompt_template = prompt_template_setting.value

        character_prompt_part = ""
        if request_body.character_id:
            character = crud.get_character(db, character_id=request_body.character_id)
            if character:
                character_prompt_part = f"""
# 投稿者キャラクター情報
あなたは以下の設定を持つ、非常に魅力的な人物です。このキャラクターに完全になりきって、記事を作成してください。
- 肩書: {character.title}
- 専門分野: {character.expertise}
- 背景: {character.background}
- 価値観: {character.values_beliefs}
- 目標: {character.goal}
- 口調: {character.base_tone}で、以下の特徴を持つ: {character.style_features}
- 口癖: {character.catchphrases}
- 読者に与えたい印象: {character.impression}
"""
        
        target_persona_prompt_part = ""
        if request_body.target_persona_id:
            target_persona = crud.get_target_persona(db, persona_id=request_body.target_persona_id)
            if target_persona:
                target_persona_prompt_part = f"""
# ターゲット読者情報
以下のペルソナを持つ読者に、最も響くようにコンテンツを作成してください。
- ペルソナ: {target_persona.name}
- 抱えている課題: {target_persona.challenges}
- 達成したいこと: {target_persona.goals}
- 知識レベル: {target_persona.knowledge_level}
- 心を動かすキーワード: {target_persona.keywords}
- 行動の決め手: {target_persona.decision_triggers}
"""

        prompt = prompt_template.replace("{{language}}", request_body.language or "日本語")
        prompt = prompt.replace("{{character_section}}", character_prompt_part)
        prompt = prompt.replace("{{target_persona_section}}", target_persona_prompt_part)
        prompt = prompt.replace("{{project_name}}", project.name)
        prompt = prompt.replace("{{project_url}}", project.url)
        prompt = prompt.replace("{{research_summary}}", project.research_summary or "調査結果なし")

        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        
        crud.update_project_ai_response(db, project_id=project_id, ai_response=response.text)
        
        return {"article_text": response.text}
        
    except Exception as e:
        print(f"!!!!!! 例外が発生しました !!!!!!\nエラーのタイプ: {type(e)}\nエラーの詳細: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"note記事のAI生成に失敗しました: {str(e)}")

@app.post("/posts/{post_id}/upload-image", response_model=schemas.Post)
async def upload_post_image_api(post_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    try:
        image_bytes = await file.read()
        image_url = utils.upload_image_bytes_to_cloudinary(image_bytes)
        if not image_url:
            raise HTTPException(status_code=500, detail="Image upload to Cloudinary failed.")
        updated_post = crud.update_post_image_url(db, post_id=post_id, image_url=image_url)
        return updated_post
    except Exception as e:
        print(f"!!!!!! Image Upload Failed !!!!!!\nError: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@app.post("/posts/{post_id}/generate-media-prompts", response_model=dict)
def generate_media_prompts_api(post_id: int, db: Session = Depends(get_db)):
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post: raise HTTPException(status_code=404, detail="Post not found")
    prompt = f"""
あなたは、最先端の画像生成AI「Midjourney」と動画生成AIを使いこなす、プロのクリエイターです。
以下のSNS投稿のテキストに最も合う、魅力的でクリエイティブな「画像生成プロンプト」と「動画生成プロンプト」を、それぞれ1つずつ提案してください。
# SNS投稿テキスト:
{db_post.content}
# 指示:
- 画像生成プロンプトは、Midjourneyで高品質な結果が出るように、英語で、具体的なスタイル（例: photorealistic, cinematic, 4K）、構図、ライティングなどを指定してください。特に、SNS投稿テキストの「文字そのもの」を、グラフィカルで美しいデザイン要素として画像に組み込むような、独創的なアイデアを重視してください。
- 動画生成プロンプトは、短い動画（5〜10秒）を想定し、シーンの移り変わりや、テキストの表示アニメーションなどを簡潔に記述してください。
- 出力は、必ず以下のJSON形式に厳密に従ってください。
# 出力形式 (JSON)
{{
  "image_prompt": "(ここにMidjourney用の英語プロンプト)",
  "video_prompt": "(ここに動画生成用の日本語プロンプト)"
}}
"""
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        json_response_text = re.search(r'\{.*\}', response.text, re.DOTALL).group(0)
        prompts_data = json.loads(json_response_text)
        return prompts_data
    except Exception as e:
        raise HTTPException(status_code=500, detail="AIによるメディアプロンプトの生成に失敗しました。")

@app.put("/posts/{post_id}", response_model=schemas.Post)
def update_post_api(post_id: int, post: schemas.PostCreate, db: Session = Depends(get_db)):
    updated_post = crud.update_post(db, post_id=post_id, content=post.content)
    if updated_post is None: raise HTTPException(status_code=404, detail="Post not found")
    return updated_post

@app.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post_api(post_id: int, db: Session = Depends(get_db)):
    result = crud.delete_post(db, post_id=post_id)
    if result is None: raise HTTPException(status_code=404, detail="Post not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.post("/posts/{post_id}/schedule", response_model=schemas.Post)
def schedule_post_api(post_id: int, schedule: schemas.PostSchedule, db: Session = Depends(get_db)):
    if schedule.scheduled_at.tzinfo is None: schedule.scheduled_at = schedule.scheduled_at.replace(tzinfo=timezone.utc)
    if schedule.scheduled_at < datetime.now(timezone.utc): raise HTTPException(status_code=400, detail="Scheduled time must be in the future.")
    scheduled_post = crud.schedule_post(db, post_id=post_id, scheduled_at=schedule.scheduled_at)
    if scheduled_post is None: raise HTTPException(status_code=404, detail="Post not found")
    return scheduled_post

@app.post("/posts/{post_id}/post-now", status_code=200)
def post_now_api(post_id: int, db: Session = Depends(get_db)):
    db_post = crud.get_post(db, post_id=post_id)
    if db_post is None: raise HTTPException(status_code=404, detail="Post not found")
    try:
        posted_tweet_data = x_client.post_tweet(text=db_post.content, image_url=db_post.image_url)
        tweet_id = posted_tweet_data.get('id')
        crud.update_post_status(db, post_id=post_id, status="posted", tweet_id=tweet_id)
        return {"message": "Tweet posted successfully!", "tweet_id": tweet_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post to X: {str(e)}")

@app.post("/posts/{post_id}/update-metrics", response_model=schemas.Post)
def update_metrics_api(post_id: int, db: Session = Depends(get_db)):
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post or not db_post.tweet_id: raise HTTPException(status_code=404, detail="Posted tweet with tweet_id not found")
    try:
        metrics = x_client.get_tweet_metrics(db_post.tweet_id)
        updated_post = crud.update_post_metrics(db, post_id=post_id, metrics=metrics)
        return updated_post
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update metrics: {str(e)}")

# -- Character Endpoints --
@app.post("/characters/", response_model=schemas.Character)
def create_character_api(character: schemas.CharacterCreate, db: Session = Depends(get_db)):
    return crud.create_character(db=db, character=character)

@app.post("/characters/generate-details", response_model=schemas.CharacterBase)
def generate_character_details_api(request: schemas.GenerateCharacterRequest):
    prompt = f"""
以下のキーワードを基に、魅力的で一貫性のあるSNS投稿用のキャラクターペルソナを詳細に設定してください。
出力は、必ず以下のJSON形式に厳密に従ってください。
# キーワード: {request.seed_text}
# 出力形式 (JSON): {{"name": "（キャラクター名）","title": "（役割/肩書）","expertise": "（専門分野・テーマ）","background": "（ペルソナの経歴や物語）","values_beliefs": "（価値観・信念）","goal": "（発信活動の目標）","base_tone": "（口調の基本：丁寧語、常体など）","style_features": "（文体の特徴）","catchphrases": "（口癖・決め台詞）","favorite_emojis": "（よく使う絵文字）","impression": "（読者に与えたい印象）"}}
"""
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        json_response_text = re.search(r'\{.*\}', response.text, re.DOTALL).group(0)
        character_data = json.loads(json_response_text)
        return schemas.CharacterBase(**character_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail="AIによるキャラクター生成に失敗しました。")

@app.get("/characters/", response_model=List[schemas.Character])
def read_characters_api(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_characters(db, skip=skip, limit=limit)

@app.get("/characters/{character_id}", response_model=schemas.Character)
def read_character_api(character_id: int, db: Session = Depends(get_db)):
    db_character = crud.get_character(db, character_id=character_id)
    if db_character is None: raise HTTPException(status_code=404, detail="Character not found")
    return db_character

@app.put("/characters/{character_id}", response_model=schemas.Character)
def update_character_api(character_id: int, character: schemas.CharacterCreate, db: Session = Depends(get_db)):
    updated_character = crud.update_character(db, character_id=character_id, character=character)
    if updated_character is None: raise HTTPException(status_code=404, detail="Character not found")
    return updated_character

@app.delete("/characters/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_character_api(character_id: int, db: Session = Depends(get_db)):
    result = crud.delete_character(db, character_id=character_id)
    if result is None: raise HTTPException(status_code=404, detail="Character not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# -- Setting Endpoints --
@app.get("/settings/", response_model=List[schemas.Setting])
def read_settings_api(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_all_settings(db, skip=skip, limit=limit)

@app.get("/settings/{key}", response_model=schemas.Setting)
def read_setting_api(key: str, db: Session = Depends(get_db)):
    db_setting = crud.get_setting(db, key=key)
    if db_setting is None: raise HTTPException(status_code=404, detail="Setting not found")
    return db_setting

@app.put("/settings/{key}", response_model=schemas.Setting)
def update_setting_api(key: str, setting: schemas.SettingUpdate, db: Session = Depends(get_db)):
    updated_setting = crud.update_setting(db, key=key, setting=setting)
    if updated_setting is None: raise HTTPException(status_code=404, detail="Setting not found")
    return updated_setting
    
# -- TargetPersona Endpoints --
@app.post("/target-personas/", response_model=schemas.TargetPersona)
def create_target_persona_api(persona: schemas.TargetPersonaCreate, db: Session = Depends(get_db)):
    return crud.create_target_persona(db=db, persona=persona)

@app.post("/target-personas/generate-details", response_model=schemas.TargetPersonaBase)
def generate_target_persona_details_api(request: schemas.GenerateTargetPersonaRequest):
    prompt = f"""
以下のキーワードを基に、SNSで情報発信する際の、具体的なターゲットペルソナを詳細に設定してください。
出力は、必ず以下のJSON形式に厳密に従ってください。
# キーワード
{request.seed_text}
# 出力形式 (JSON)
{{
  "name": "（ペルソナを一言で表す名前）",
  "challenges": "（このペルソナが抱えている課題や悩み）",
  "goals": "（このペルソナが達成したいこと）",
  "knowledge_level": "（トピックに関する知識レベル：初心者、中級者、専門家など）",
  "info_sources": "（普段、情報を得ているメディア：X, YouTube, 専門ブログなど）",
  "keywords": "（このペルソナの関心を引くキーワード）",
  "decision_triggers": "（最終的に行動を起こす決め手）"
}}
"""
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        json_response_text = re.search(r'\{.*\}', response.text, re.DOTALL).group(0)
        persona_data = json.loads(json_response_text)
        return schemas.TargetPersonaBase(**persona_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail="AIによるターゲットペルソナ生成に失敗しました。")

@app.get("/target-personas/", response_model=List[schemas.TargetPersona])
def read_target_personas_api(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_target_personas(db, skip=skip, limit=limit)

@app.get("/target-personas/{persona_id}", response_model=schemas.TargetPersona)
def read_target_persona_api(persona_id: int, db: Session = Depends(get_db)):
    db_persona = crud.get_target_persona(db, persona_id=persona_id)
    if db_persona is None:
        raise HTTPException(status_code=404, detail="Target Persona not found")
    return db_persona

@app.put("/target-personas/{persona_id}", response_model=schemas.TargetPersona)
def update_target_persona_api(persona_id: int, persona: schemas.TargetPersonaCreate, db: Session = Depends(get_db)):
    updated_persona = crud.update_target_persona(db, persona_id=persona_id, persona=persona)
    if updated_persona is None:
        raise HTTPException(status_code=404, detail="Target Persona not found")
    return updated_persona

@app.delete("/target-personas/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_target_persona_api(persona_id: int, db: Session = Depends(get_db)):
    result = crud.delete_target_persona(db, persona_id=persona_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Target Persona not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
    
# --- Root Endpoint ---
@app.get("/")
def read_root():
    return {"Hello": "World", "Database": "Connected!"}
