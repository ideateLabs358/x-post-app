'use client';

import { useState, useEffect } from 'react';
import EditablePost from '@/components/EditablePost';
import EditableNoteArticle from '@/components/EditableNoteArticle';

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
  title: string;
  content: string;
}
interface Character {
  id: number;
  name: string;
}
interface TargetPersona {
  id: number;
  name: string;
}

// ★★★ ここでコンポーネントに直接、インラインで型を指定します ★★★
export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [noteArticles, setNoteArticles] = useState<NoteArticle[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [targetPersonas, setTargetPersonas] = useState<TargetPersona[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [selectedTargetPersonaId, setSelectedTargetPersonaId] = useState<string>('');
  const [language, setLanguage] = useState('日本語');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);

  const [researchSummary, setResearchSummary] = useState('');
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ name: '', url: '', hashtags: '' });

  useEffect(() => {
    const fetchData = async () => {
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
        setProject(projectData);
        if (projectData.posts) setPosts(projectData.posts);
        if (projectData.note_articles) setNoteArticles(projectData.note_articles);
        if (projectData.research_summary) setResearchSummary(projectData.research_summary);
        setProjectFormData({
            name: projectData.name || '',
            url: projectData.url || '',
            hashtags: projectData.hashtags || ''
        });

        setCharacters(await charRes.json());
        setTargetPersonas(await targetRes.json());

      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('予期せぬエラーが発生しました。');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleProjectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

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
    } catch (err) {
        if (err instanceof Error) {
            alert(err.message);
        }
    }
  };

  const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectFormData({ ...projectFormData, [e.target.name]: e.target.value });
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
    } catch (err) {
      if (err instanceof Error) {
          setError(err.message);
      }
    } finally {
      setIsSavingSummary(false);
    }
  };

  const handleGenerateContent = async (type: 'posts' | 'note') => {
    if (type === 'posts') setIsGeneratingPosts(true);
    if (type === 'note') setIsGeneratingNote(true);
    setError('');

    const endpoint = type === 'posts' 
        ? `/projects/${params.id}/generate-posts`
        : `/projects/${params.id}/generate-note-article`;

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            character_id: selectedCharacterId ? parseInt(selectedCharacterId) : null,
            target_persona_id: selectedTargetPersonaId ? parseInt(selectedTargetPersonaId) : null,
            language: language
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'AIの生成に失敗しました。');
      }
      const data = await res.json();

      if (type === 'posts') {
        setPosts((currentPosts) => [...currentPosts, ...data]);
      } else {
        setNoteArticles((currentArticles) => [...currentArticles, data]);
      }
    } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
      }
    } finally {
      if (type === 'posts') setIsGeneratingPosts(false);
      if (type === 'note') setIsGeneratingNote(false);
    }
  };
  
  const handlePostDelete = (deletedPostId: number) => {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== deletedPostId));
  };
  
  const handleNoteArticleUpdate = (id: number, data: { title: string; content: string }) => {
    setNoteArticles(prev => 
      prev.map(article => 
        article.id === id ? { ...article, ...data } : article
      )
    );
  };

  const handleNoteArticleDelete = (deletedArticleId: number) => {
    setNoteArticles(prev => prev.filter(a => a.id !== deletedArticleId));
  };

  if (isLoading) return <div className="p-24 text-center">読み込み中...</div>;
  if (error && !project) return <div className="p-24 text-center text-red-500">エラー: {error}</div>;
  if (!project) return <div className="p-24 text-center">プロジェクトが見つかりませんでした。</div>;

  return (
    <main className="flex flex-col items-center p-8 sm:p-24">
      <div className="w-full max-w-4xl space-y-12">
        <header className="border-b pb-4 group relative">
          {!isEditingProject ? (
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">{project.name}</h1>
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all mt-2 inline-block">{project.url}</a>
              <p className="text-gray-500 mt-2 text-sm">{project.hashtags}</p>
              <button onClick={() => setIsEditingProject(true)} className="absolute top-0 right-0 bg-white text-xs px-2 py-1 rounded border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                プロジェクト情報を編集
              </button>
            </div>
          ) : (
            <form onSubmit={handleProjectUpdate}>
              <input type="text" name="name" value={projectFormData.name} onChange={handleProjectFormChange} className="text-4xl sm:text-5xl font-extrabold text-gray-800 w-full border-b-2 mb-2"/>
              <input type="text" name="url" value={projectFormData.url} onChange={handleProjectFormChange} className="text-blue-600 w-full border-b-2 mb-2"/>
              <input type="text" name="hashtags" value={projectFormData.hashtags} onChange={handleProjectFormChange} className="text-gray-500 text-sm w-full border-b-2 mb-2"/>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-blue-600 text-white text-xs px-2 py-1 rounded">保存</button>
                <button type="button" onClick={() => setIsEditingProject(false)} className="bg-gray-200 text-xs px-2 py-1 rounded">キャンセル</button>
              </div>
            </form>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)} className="block w-full p-2 border border-gray-300 rounded-md shadow-sm">
              <option value="日本語">日本語</option>
              <option value="英語">英語</option>
            </select>
          </div>
          <p className="mb-6 text-gray-600">ペルソナや言語を選択すると、それに合わせた内容が生成されます。</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => handleGenerateContent('posts')} disabled={isGeneratingPosts || isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all disabled:bg-gray-400">
              {isGeneratingPosts ? 'AIが考え中...' : 'Xのポスト案を追加生成'}
            </button>
            <button onClick={() => handleGenerateContent('note')} disabled={isGeneratingNote || isLoading} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all disabled:bg-gray-400">
              {isGeneratingNote ? 'AIが執筆中...' : 'noteの記事案を作成する'}
            </button>
          </div>
        </div>
        
        {noteArticles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-3xl font-bold">note記事一覧・編集</h3>
            {noteArticles.map(article => (
              <EditableNoteArticle 
                key={article.id} 
                article={article} 
                onUpdate={handleNoteArticleUpdate}
                onDelete={handleNoteArticleDelete}
              />
            ))}
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