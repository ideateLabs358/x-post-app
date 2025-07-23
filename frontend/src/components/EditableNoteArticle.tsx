'use client';

import { useState } from 'react';

// 型定義
interface NoteArticle {
  id: number;
  title: string | null;
  content: string | null;
}

interface EditableNoteArticleProps {
  article: NoteArticle;
  onUpdate: (id: number, title: string, content: string) => Promise<void>;
  onDelete: (id: number) => void;
}

export default function EditableNoteArticle({ article, onUpdate, onDelete }: EditableNoteArticleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(article.title || '');
  const [content, setContent] = useState(article.content || '');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdate(article.id, title, content);
      setIsEditing(false); // 保存が成功したら編集モードを終了
    } catch (error) {
      alert('記事の更新に失敗しました。');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`この記事「${title}」を本当に削除しますか？`)) {
      onDelete(article.id);
    }
  };

  if (isEditing) {
    // --- 編集モード ---
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-300 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">本文</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full p-2 border rounded-md font-sans"
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {isLoading ? '保存中...' : '更新を保存'}
          </button>
          <button onClick={() => setIsEditing(false)} className="text-sm text-gray-600 hover:underline" disabled={isLoading}>
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  // --- 表示モード ---
  return (
    <div className="p-8 bg-white border rounded-lg shadow-sm relative group">
      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)} className="bg-white text-xs px-2 py-1 rounded border shadow-sm hover:bg-gray-50">
          編集
        </button>
        <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded border shadow-sm">
          削除
        </button>
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <pre className="whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-md">{content}</pre>
    </div>
  );
}
