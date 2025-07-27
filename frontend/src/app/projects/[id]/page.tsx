'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import EditablePost from '@/components/EditablePost';
import EditableNoteArticle from '@/components/EditableNoteArticle';

// APIのベースURLを定義
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// 型定義
interface Project {
  id: number;
  name: string;
  url: string;
  posts: Post[];
  note_articles: NoteArticle[];
  research_summary: string | null;
  hashtags: string | null;
}
interface Post {
  id: number;
  content: string;
  status: string;
  scheduled_at: string | null;
  image_url: string | null;
}
interface NoteArticle {
  id: number;
  title: string | null;
  content: string | null;
  status: string;
}
interface Character {
  id: number;
  name: string;
}
interface TargetPersona {
  id: number;
  name: string;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [noteArticles, setNoteArticles] = useState<NoteArticle[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [targetPersonas, setTargetPersonas] = useState<TargetPersona[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [selectedTargetPersonaId, setSelectedTargetPersonaId] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('日本語');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  
  const [researchSummary, setResearchSummary] = useState('');
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ name: '', url: '', hashtags: '' });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [projectRes, charRes, targetRes] = await Promise.all([
        fetch(`${API_URL}/projects/${params.id}`),
        fetch(`${API_URL}/characters/`),
        fetch(`${API_URL}/target-personas/`)
      ]);

      if (!projectRes.ok) throw new Error('プロジェクトの取得に失敗しました。');
      if (!charRes.ok) throw new Error('投稿者キャラクター一覧の取得に失敗しました。');
      if (!targetRes.ok) throw new Error('ターゲットペルソナ一覧の取得に失敗しました。');

      const projectData: Project = await projectRes.json();
      const charData: Character[] = await charRes.json();
      const targetData: TargetPersona[] = await targetRes.json();
      
      setProject(projectData);
      setPosts(projectData.posts || []);
      setNoteArticles(projectData.note_articles || []);
      setResearchSummary(projectData.research_summary || '');
      setProjectFormData({
        name: projectData.name || '',
        url: projectData.url || '',
        hashtags: projectData.hashtags || ''
      });
      setCharacters(charData);
      setTargetPersonas(targetData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProjectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsSavingSummary(true); 
    try {
        const res = await fetch(`${API_URL}/projects/${project.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectFormData),
        });
        if (!res.ok) throw new Error('プロジェクト情報の更新に失敗しました。');
        const updatedProject = await res.json();
        setProject(updatedProject); 
        setIsEditingProject(false); 
    } catch(err: any) {
        alert(err.message);
    } finally {
        setIsSavingSummary(false);
    }
  };

  const handleSummarySave = async () => {
    if (!project) return;
    setIsSavingSummary(true);
    setSaveSuccessMessage('');
    setError('');
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}/summary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ research_summary: researchSummary }),
      });
      if (!res.ok) throw new Error('サマリーの保存に失敗しました。');
      setSaveSuccessMessage('保存しました！');
      setTimeout(() => setSaveSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingSummary(false);
    }
  };
  
  const handleGeneratePosts = async () => {
    setIsGeneratingPosts(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/projects/${params.id}/generate-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            character_id: selectedCharacterId ? parseInt(selectedCharacterId) : null,
            target_persona_id: selectedTargetPersonaId ? parseInt(selectedTargetPersonaId) : null,
            language: selectedLanguage
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'AIのポスト生成に失敗しました。');
      }
      const newPosts: Post[] = await res.json();
      setPosts((currentPosts) => [...currentPosts, ...newPosts]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingPosts(false);
    }
  };
  
  const handleGenerateNoteArticle = async () => {
    setIsGeneratingNote(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/projects/${params.id}/generate-note-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            character_id: selectedCharacterId ? parseInt(selectedCharacterId) : null,
            target_persona_id: selectedTargetPersonaId ? parseInt(selectedTargetPersonaId) : null,
            language: selectedLanguage
        }),
      });
      if (!res.ok) { 
        const errorData = await res.json();
        throw new Error(errorData.detail || 'note記事のAI生成に失敗しました。'); 
      }
      const newArticle = await res.json();
      setNoteArticles(prev => [...prev, newArticle]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const handlePostDelete = (deletedPostId: number) => {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== deletedPostId));
  };

  const handleNoteArticleUpdate = async (id: number, title: string, content: string) => {
    const res = await fetch(`${API_URL}/note-articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'note記事の更新に失敗しました。');
    }
    const updatedArticle = await res.json();
    setNoteArticles(prev => prev.map(a => a.id === id ? updatedArticle : a));
    alert('note記事を更新しました！');
  };

  const handleNoteArticleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/note-articles/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('note記事の削除に失敗しました。');
      setNoteArticles(prev => prev.filter(a => a.id !== id));
      alert('note記事を削除しました。');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className="p-24 text-center">読み込み中...</div>;
  if (error) return <div className="p-24 text-center text-red-500">エラー: {error}</div>;
  if (!project) return <div className="p-24 text-center">プロジェクトが見つかりませんでした。</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-24">
      <div className="w-full max-w-4xl space-y-12">
        <header className="group relative">
          {isEditingProject ? (
            <form onSubmit={handleProjectUpdate} className="p-6 bg-yellow-50 border rounded-lg">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700">プロジェクト名</label>
                        <input value={projectFormData.name} onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">URL</label>
                        <input value={projectFormData.url} onChange={(e) => setProjectFormData({...projectFormData, url: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">プロジェクト用ハッシュタグ</label>
                        <input value={projectFormData.hashtags} onChange={(e) => setProjectFormData({...projectFormData, hashtags: e.target.value})} placeholder="#タグ1 #タグ2" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"/>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                    <button type="submit" disabled={isSavingSummary} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm disabled:bg-gray-400">保存</button>
                    <button type="button" onClick={() => setIsEditingProject(false)} className="text-sm text-gray-600 hover:underline">キャンセル</button>
                </div>
            </form>
          ) : (
            <div className="border-b pb-4">
                <button onClick={() => setIsEditingProject(true)} className="absolute top-0 right-0 bg-white text-xs px-2 py-1 rounded border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    プロジェクト情報を編集
                </button>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">{project.name}</h1>
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all mt-2 inline-block">{project.url}</a>
                {project.hashtags && <p className="mt-2 text-sm text-gray-500">{project.hashtags}</p>}
            </div>
          )}
        </header>
        
        <div className="p-8 bg-white border rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">AIによる調査結果サマリー</h2>
            <p className="text-sm text-gray-500 mb-4">プロジェクト作成時にAIがURLを調査して作成した要約です。この内容を編集して保存すると、以降のAIによるコンテンツ生成の精度が向上します。</p>
            <textarea
                value={researchSummary}
                onChange={(e) => setResearchSummary(e.target.value)}
                rows={10}
                className="w-full p-2 border rounded-md font-mono text-sm bg-gray-50"
            />
            <div className="mt-4 flex items-center gap-4">
                <button onClick={handleSummarySave} disabled={isSavingSummary} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
                    {isSavingSummary ? '保存中...' : 'このサマリーを保存'}
                </button>
                {saveSuccessMessage && <p className="text-green-600 font-semibold">{saveSuccessMessage}</p>}
            </div>
        </div>

        <div className="p-8 bg-white border rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4">AIコンテンツ生成</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label htmlFor="character-select" className="block text-sm font-bold text-gray-700 mb-1">投稿者キャラクター (誰が)</label>
              <select id="character-select" value={selectedCharacterId} onChange={(e) => setSelectedCharacterId(e.target.value)} className="block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                <option value="">キャラクターなし</option>
                {characters.map((char) => (<option key={char.id} value={char.id}>{char.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="target-select" className="block text-sm font-bold text-gray-700 mb-1">ターゲット (誰に)</label>
              <select id="target-select" value={selectedTargetPersonaId} onChange={(e) => setSelectedTargetPersonaId(e.target.value)} className="block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                <option value="">ターゲットなし</option>
                {targetPersonas.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="language-select" className="block text-sm font-bold text-gray-700 mb-1">生成言語</label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="日本語">日本語</option>
              <option value="英語">英語</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-4">
            <button onClick={handleGeneratePosts} disabled={isGeneratingPosts} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all disabled:bg-gray-400">
              {isGeneratingPosts ? 'AIが考え中...' : 'Xのポスト案を追加生成'}
            </button>
            <button onClick={handleGenerateNoteArticle} disabled={isGeneratingNote} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all disabled:bg-gray-400">
              {isGeneratingNote ? 'AIが執筆中...' : 'noteの記事案を作成する'}
            </button>
          </div>
        </div>
        
        {noteArticles.length > 0 && (
          <div className="mt-12">
            <h3 className="text-3xl font-bold mb-6">note記事一覧・編集</h3>
            <div className="space-y-8">
              {noteArticles.map((article) => (
                <EditableNoteArticle
                  key={article.id}
                  article={article}
                  onUpdate={handleNoteArticleUpdate}
                  onDelete={handleNoteArticleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-3xl font-bold mb-6">Xポスト一覧・編集</h3>
            <div className="space-y-4">
              {posts.map((post) => (<EditablePost key={post.id} post={post} onPostDelete={handlePostDelete} />))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
