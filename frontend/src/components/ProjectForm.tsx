'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 作成後に受け取るプロジェクト情報の型を定義
interface CreatedProject {
  id: number;
  name: string;
  url: string;
}

export default function ProjectForm() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [hashtags, setHashtags] = useState(''); // ★★★ ハッシュタグ用の状態を追加 ★★★
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name || !url) {
      setError('プロジェクト名とURLの両方を入力してください。');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ★★★ ハッシュタグも一緒に送信 ★★★
        body: JSON.stringify({ name, url, hashtags }), 
      });

      if (!res.ok) {
        throw new Error('プロジェクトの作成に失敗しました。');
      }
      
      const newProject: CreatedProject = await res.json();

      // 新しいプロジェクトの詳細ページへ移動
      router.push(`/projects/${newProject.id}`);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl p-8 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">新規プロジェクト作成</h2>
      {error && <p className="mb-4 text-red-500">{error}</p>}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">プロジェクト名 (必須)</label>
            <input id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} />
          </div>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">調査対象のURL (必須)</label>
            <input id="url" name="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1 shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} />
          </div>
        </div>
        {/* ★★★ ハッシュタグ入力欄を追加 ★★★ */}
        <div>
          <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700">プロジェクト用ハッシュタグ</label>
          <input 
            id="hashtags" 
            name="hashtags" 
            type="text" 
            value={hashtags} 
            onChange={(e) => setHashtags(e.target.value)} 
            placeholder="#ハッシュタグ1 #ハッシュタグ2"
            className="mt-1 shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" 
            disabled={isLoading} 
          />
          <p className="mt-2 text-xs text-gray-500">スペースで区切って複数入力できます。</p>
        </div>
      </div>
      <div className="pt-8">
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400" disabled={isLoading}>
          {isLoading ? 'AIが調査中...' : 'プロジェクトを作成＆調査開始'}
        </button>
      </div>
    </form>
  );
}
