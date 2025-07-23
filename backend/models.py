from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, TEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String)
    latest_ai_response = Column(TEXT, nullable=True)
    research_summary = Column(TEXT, nullable=True)
    hashtags = Column(TEXT, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    posts = relationship("Post", back_populates="project", cascade="all, delete-orphan")
    note_articles = relationship("NoteArticle", back_populates="project", cascade="all, delete-orphan") # ★★★ この行を追加 ★★★

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(TEXT, nullable=False)
    status = Column(String, default="draft")
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    tweet_id = Column(String, nullable=True)
    retweet_count = Column(Integer, default=0)
    reply_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    impression_count = Column(Integer, default=0)
    image_url = Column(TEXT, nullable=True)
    
    project = relationship("Project", back_populates="posts")

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    title = Column(TEXT, nullable=True)
    expertise = Column(TEXT, nullable=True)
    background = Column(TEXT, nullable=True)
    values_beliefs = Column(TEXT, nullable=True)
    goal = Column(TEXT, nullable=True)
    base_tone = Column(TEXT, nullable=True)
    style_features = Column(TEXT, nullable=True)
    catchphrases = Column(TEXT, nullable=True)
    favorite_emojis = Column(TEXT, nullable=True)
    impression = Column(TEXT, nullable=True)

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False, unique=True, index=True)
    value = Column(TEXT, nullable=True)
    description = Column(TEXT, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class TargetPersona(Base):
    __tablename__ = "target_personas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    challenges = Column(TEXT, nullable=True)
    goals = Column(TEXT, nullable=True)
    knowledge_level = Column(TEXT, nullable=True)
    info_sources = Column(TEXT, nullable=True)
    keywords = Column(TEXT, nullable=True)
    decision_triggers = Column(TEXT, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# ★★★ 新しいNoteArticleクラスを追加 ★★★
class NoteArticle(Base):
    __tablename__ = "note_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(TEXT, nullable=True)
    content = Column(TEXT, nullable=True)
    status = Column(String(50), default='draft')
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="note_articles")
