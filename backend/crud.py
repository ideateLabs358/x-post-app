from sqlalchemy.orm import Session
from datetime import datetime
import models
import schemas

# --- Project CRUD ---
def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).order_by(models.Project.id.desc()).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate, research_summary: str | None = None):
    db_project = models.Project(
        name=project.name, 
        url=project.url, 
        research_summary=research_summary,
        hashtags=project.hashtags
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: int, project: schemas.ProjectCreate):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        db_project.name = project.name
        db_project.url = project.url
        db_project.hashtags = project.hashtags
        db.commit()
        db.refresh(db_project)
    return db_project

def update_project_summary(db: Session, project_id: int, summary: str):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        db_project.research_summary = summary
        db.commit()
        db.refresh(db_project)
    return db_project

def update_project_ai_response(db: Session, project_id: int, ai_response: str):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        db_project.latest_ai_response = ai_response
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        # The relationship cascade will handle deleting associated posts and note_articles
        db.delete(db_project)
        db.commit()
        return {"ok": True}
    return None

# --- Post CRUD ---
def get_post(db: Session, post_id: int):
    return db.query(models.Post).filter(models.Post.id == post_id).first()

def create_project_post(db: Session, post: schemas.PostCreate, project_id: int):
    db_post = models.Post(**post.model_dump(), project_id=project_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def update_post(db: Session, post_id: int, content: str):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        db_post.content = content
        db.commit()
        db.refresh(db_post)
    return db_post

def update_post_status(db: Session, post_id: int, status: str, tweet_id: str | None = None):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        db_post.status = status
        if tweet_id:
            db_post.tweet_id = tweet_id
        db.commit()
        db.refresh(db_post)
    return db_post

def schedule_post(db: Session, post_id: int, scheduled_at: datetime):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        db_post.scheduled_at = scheduled_at
        db_post.status = "scheduled"
        db.commit()
        db.refresh(db_post)
    return db_post

def update_post_image_url(db: Session, post_id: int, image_url: str):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        db_post.image_url = image_url
        db.commit()
        db.refresh(db_post)
    return db_post

def delete_post(db: Session, post_id: int):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        db.delete(db_post)
        db.commit()
        return {"ok": True}
    return None

# --- Character CRUD ---
def get_character(db: Session, character_id: int):
    return db.query(models.Character).filter(models.Character.id == character_id).first()

def get_characters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Character).order_by(models.Character.name).offset(skip).limit(limit).all()

def create_character(db: Session, character: schemas.CharacterCreate):
    db_character = models.Character(**character.model_dump())
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return db_character

def update_character(db: Session, character_id: int, character: schemas.CharacterCreate):
    db_character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if db_character:
        update_data = character.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_character, key, value)
        db.commit()
        db.refresh(db_character)
    return db_character

def delete_character(db: Session, character_id: int):
    db_character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if db_character:
        db.delete(db_character)
        db.commit()
        return {"ok": True}
    return None

# --- Setting CRUD ---
def get_setting(db: Session, key: str):
    return db.query(models.Setting).filter(models.Setting.key == key).first()

def get_all_settings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Setting).offset(skip).limit(limit).all()

def update_setting(db: Session, key: str, setting: schemas.SettingUpdate):
    db_setting = db.query(models.Setting).filter(models.Setting.key == key).first()
    if db_setting and setting.value is not None:
        db_setting.value = setting.value
        db.commit()
        db.refresh(db_setting)
    return db_setting
    
# --- TargetPersona CRUD ---
def get_target_persona(db: Session, persona_id: int):
    return db.query(models.TargetPersona).filter(models.TargetPersona.id == persona_id).first()

def get_target_personas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.TargetPersona).order_by(models.TargetPersona.name).offset(skip).limit(limit).all()

def create_target_persona(db: Session, persona: schemas.TargetPersonaCreate):
    db_persona = models.TargetPersona(**persona.model_dump())
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

def update_target_persona(db: Session, persona_id: int, persona: schemas.TargetPersonaCreate):
    db_persona = db.query(models.TargetPersona).filter(models.TargetPersona.id == persona_id).first()
    if db_persona:
        update_data = persona.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_persona, key, value)
        db.commit()
        db.refresh(db_persona)
    return db_persona

def delete_target_persona(db: Session, persona_id: int):
    db_persona = db.query(models.TargetPersona).filter(models.TargetPersona.id == persona_id).first()
    if db_persona:
        db.delete(db_persona)
        db.commit()
        return {"ok": True}
    return None

# ★★★ 新しいNoteArticleの操作関数を追加 ★★★
# --- NoteArticle CRUD ---
def create_note_article(db: Session, article: schemas.NoteArticleCreate, project_id: int):
    db_article = models.NoteArticle(**article.model_dump(), project_id=project_id)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def update_note_article(db: Session, article_id: int, article: schemas.NoteArticleUpdate):
    db_article = db.query(models.NoteArticle).filter(models.NoteArticle.id == article_id).first()
    if db_article:
        update_data = article.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_article, key, value)
        db.commit()
        db.refresh(db_article)
    return db_article

def delete_note_article(db: Session, article_id: int):
    db_article = db.query(models.NoteArticle).filter(models.NoteArticle.id == article_id).first()
    if db_article:
        db.delete(db_article)
        db.commit()
        return {"ok": True}
    return None
