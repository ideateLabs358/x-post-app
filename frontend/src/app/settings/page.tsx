'use client';

import { useState, useEffect } from 'react';

// APIのベースURLを定義
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// 型定義
interface Setting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
}

export default function SettingsPage() {
  const [xPrompt, setXPrompt] = useState('');
  const [notePrompt, setNotePrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ページ読み込み時に現在の設定値を取得
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/settings/`);
        if (!res.ok) throw new Error('設定の読み込みに失敗しました。');
        
        const settings: Setting[] = await res.json();
        const xPromptSetting = settings.find(s => s.key === 'default_post_prompt');
        const notePromptSetting = settings.find(s => s.key === 'default_note_prompt');

        if (xPromptSetting) setXPrompt(xPromptSetting.value || '');
        if (notePromptSetting) setNotePrompt(notePromptSetting.value || '');

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 設定を保存する関数
  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setError('');
    try {
      // 2つの更新処理を並行して実行
      const [xRes, noteRes] = await Promise.all([
        fetch(`${API_URL}/settings/default_post_prompt`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: xPrompt }),
        }),
        fetch(`${API_URL}/settings/default_note_prompt`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: notePrompt }),
        })
      ]);

      if (!xRes.ok) throw new Error('X用プロンプトの保存に失敗しました。');
      if (!noteRes.ok) throw new Error('note用プロンプトの保存に失敗しました。');

      setSuccessMessage('設定を保存しました！');
      setTimeout(() => setSuccessMessage(''), 3000); // 3秒後にメッセージを消す
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-24 text-center">読み込み中...</div>;

  return (
    <main className="flex flex-col items-center p-8 sm:p-24">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">プロンプト設定</h1>
            <p className="mt-2 text-lg text-gray-500">AIに指示するプロンプトをカスタマイズします。</p>
        </div>

        <div className="p-8 bg-white border rounded-lg shadow-sm space-y-8">
          <div>
            <label htmlFor="x-prompt" className="block text-lg font-bold text-gray-700 mb-2">Xのポスト用プロンプト</label>
            <p className="text-sm text-gray-500 mb-2">AIがXのポスト案を生成する際の指示書です。`{`{...}`}`の部分は、実際の情報に自動で置き換えられます。</p>
            <textarea
              id="x-prompt"
              value={xPrompt}
              onChange={(e) => setXPrompt(e.target.value)}
              rows={15}
              className="w-full p-2 border rounded-md font-mono text-sm bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="note-prompt" className="block text-lg font-bold text-gray-700 mb-2">noteの記事用プロンプト</label>
            <p className="text-sm text-gray-500 mb-2">AIがnoteの記事案を生成する際の指示書です。</p>
            <textarea
              id="note-prompt"
              value={notePrompt}
              onChange={(e) => setNotePrompt(e.target.value)}
              rows={15}
              className="w-full p-2 border rounded-md font-mono text-sm bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400"
            >
              {isSaving ? '保存中...' : '設定を保存'}
            </button>
            {successMessage && <p className="text-green-600 font-semibold">{successMessage}</p>}
            {error && <p className="text-red-500">{error}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
