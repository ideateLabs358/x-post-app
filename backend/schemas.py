from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# --- NoteArticle Schemas (Projectで参照するため先に定義) ---
class NoteArticleBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NoteArticleCreate(NoteArticleBase):
    pass

class NoteArticleUpdate(NoteArticleBase):
    pass

class NoteArticle(NoteArticleBase):
    id: int
    status: str
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Post Schemas ---
class PostBase(BaseModel):
    content: str
class PostCreate(PostBase):
    pass
class PostSchedule(BaseModel):
    scheduled_at: datetime
class Post(PostBase):
    id: int
    status: str
    scheduled_at: Optional[datetime] = None
    project_id: int
    created_at: datetime
    tweet_id: Optional[str] = None
    retweet_count: Optional[int] = 0
    reply_count: Optional[int] = 0
    like_count: Optional[int] = 0
    impression_count: Optional[int] = 0
    image_url: Optional[str] = None
    class Config:
        from_attributes = True

# --- Character Schemas ---
class CharacterBase(BaseModel):
    name: str
    title: Optional[str] = None
    expertise: Optional[str] = None
    background: Optional[str] = None
    values_beliefs: Optional[str] = None
    goal: Optional[str] = None
    base_tone: Optional[str] = None
    style_features: Optional[str] = None
    catchphrases: Optional[str] = None
    favorite_emojis: Optional[str] = None
    impression: Optional[str] = None
class CharacterCreate(CharacterBase):
    pass
class Character(CharacterBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True
        
# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    url: str
    hashtags: Optional[str] = None
class ProjectCreate(ProjectBase):
    pass
class ProjectSummaryUpdate(BaseModel):
    research_summary: str
class Project(ProjectBase):
    id: int
    latest_ai_response: str | None = None
    research_summary: str | None = None
    hashtags: Optional[str] = None
    created_at: datetime
    updated_at: datetime | None = None
    posts: List[Post] = []
    note_articles: List[NoteArticle] = [] # ★★★ この行を追加 ★★★
    class Config:
        from_attributes = True

# --- TargetPersona Schemas ---
class TargetPersonaBase(BaseModel):
    name: str
    challenges: Optional[str] = None
    goals: Optional[str] = None
    knowledge_level: Optional[str] = None
    info_sources: Optional[str] = None
    keywords: Optional[str] = None
    decision_triggers: Optional[str] = None
class TargetPersonaCreate(TargetPersonaBase):
    pass
class TargetPersona(TargetPersonaBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- AI Request Schemas ---
class GeneratePostsRequest(BaseModel):
    character_id: Optional[int] = None
    target_persona_id: Optional[int] = None
    language: Optional[str] = "日本語"
class GenerateCharacterRequest(BaseModel):
    seed_text: str
class GenerateTargetPersonaRequest(BaseModel):
    seed_text: str

# --- Setting Schemas ---
class SettingBase(BaseModel):
    value: Optional[str] = None
class SettingCreate(SettingBase):
    key: str
    description: Optional[str] = None
class SettingUpdate(SettingBase):
    pass
class Setting(SettingBase):
    id: int
    key: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True
