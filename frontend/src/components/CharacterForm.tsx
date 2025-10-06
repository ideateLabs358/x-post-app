'use client';

import { useState, useEffect } from 'react';

// 型定義
interface Character {
  id: number;
  name: string;
  title: string | null;
  expertise: string | null;
  background: string | null;
  values_beliefs: string | null;
  goal: string | null;
  base_tone: string | null;
  style_features: string | null;
  catchphrases: string | null;
  favorite_emojis: string | null;
  impression: string | null;
}

interface CharacterFormData {
    name: string;
    title: string;
    expertise: string;
    background: string;
    values_beliefs: string;
    goal: string;
    base_tone: string;
    style_features: string;
    catchphrases: string;
    favorite_emojis: string;
    impression: string;
}

interface CharacterFormProps {
  existingCharacter?: Character;
  onSave: (characterData: CharacterFormData, characterId?: number) => Promise<void>;
  onCancel?: () => void;
  isCreatingNew: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function CharacterForm({ existingCharacter, onSave, onCancel, isCreatingNew }: CharacterFormProps) {
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '', title: '', expertise: '', background: '', values_beliefs: '',
    goal: '', base_tone: '', style_features: '', catchphrases: '',
    favorite_emojis: '', impression: ''
  });
  
  const [seedText, setSeedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingCharacter) {
      setFormData({
        name: existingCharacter.name || '',
        title: existingCharacter.title || '',
        expertise: existingCharacter.expertise || '',
        background: existingCharacter.background || '',
        values_beliefs: existingCharacter.values_beliefs || '',
        goal: existingCharacter.goal || '',
        base_tone: existingCharacter.base_tone || '',
        style_features: existingCharacter.style_features || '',
        catchphrases: existingCharacter.catchphrases || '',
        favorite_emojis: existingCharacter.favorite_emojis || '',
        impression: existingCharacter.impression || '',
      });
    }
  }, [existingCharacter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleGenerateDetails = async () => {
    if (!seedText) {
      alert('キーワードを入力してください。');
      return;
    }
    setIsGenerating(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/characters/generate-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed_text: seedText }),
      });
      if (!res.ok) throw new Error('AIによるペルソナ生成に失敗しました。');
      const aiGeneratedData = await res.json();
      setFormData({ ...formData, ...aiGeneratedData });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await onSave(formData, existingCharacter?.id);

      if (isCreatingNew) {
        setFormData({
            name: '', title: '', expertise: '', background: '', values_beliefs: '',
            goal: '', base_tone: '', style_features: '', catchphrases: '',
            favorite_emojis: '', impression: ''
        });
        setSeedText('');
      }
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

  return (
    <div className="p-8 mb-12 bg-white border rounded-lg shadow-sm">
      {isCreatingNew && (
        <div className="p-4 mb-6 bg-sky-50 border border-sky-200 rounded-lg">
          <h3 className="text-lg font-bold mb-2">AIペルソナアシスタント</h3>
          <p className="text-sm text-gray-600 mb-2">キャラクターのキーワード（例：「明るく元気な新人広報担当」）を入力してボタンを押すと、AIが以下の詳細項目を自動で生成します。</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              placeholder="キーワードを入力..."
              className="flex-grow shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              disabled={isGenerating}
            />
            <button type="button" onClick={handleGenerateDetails} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded" disabled={isGenerating}>
              {isGenerating ? '生成中...' : 'AIで生成'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold">{isCreatingNew ? '新規キャラクター作成' : 'キャラクター編集'}</h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-700">1. 名前 (必須)</label>
            <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="title" className="block text-sm font-bold text-gray-700">2. 肩書</label>
                <input id="title" name="title" type="text" value={formData.title} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
            </div>
            <div>
                <label htmlFor="expertise" className="block text-sm font-bold text-gray-700">3. 専門分野・テーマ</label>
                <input id="expertise" name="expertise" type="text" value={formData.expertise} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
            </div>
        </div>
        <div>
            <label htmlFor="background" className="block text-sm font-bold text-gray-700">4. ペルソナの背景</label>
            <textarea id="background" name="background" value={formData.background} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
        </div>
        <div>
            <label htmlFor="values_beliefs" className="block text-sm font-bold text-gray-700">5. 価値観・信念</label>
            <textarea id="values_beliefs" name="values_beliefs" value={formData.values_beliefs} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
        </div>
        <div>
            <label htmlFor="goal" className="block text-sm font-bold text-gray-700">6. 発信活動の目標</label>
            <textarea id="goal" name="goal" value={formData.goal} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="base_tone" className="block text-sm font-bold text-gray-700">7. 口調の基本</label>
                <input id="base_tone" name="base_tone" type="text" value={formData.base_tone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
            </div>
            <div>
                <label htmlFor="catchphrases" className="block text-sm font-bold text-gray-700">8. 口癖・決め台詞</label>
                <input id="catchphrases" name="catchphrases" type="text" value={formData.catchphrases} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
            </div>
        </div>
        <div>
            <label htmlFor="style_features" className="block text-sm font-bold text-gray-700">9. 文体の特徴</label>
            <textarea id="style_features" name="style_features" value={formData.style_features} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="favorite_emojis" className="block text-sm font-bold text-gray-700">10. よく使う絵文字</label>
                <input id="favorite_emojis" name="favorite_emojis" type="text" value={formData.favorite_emojis} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
            </div>
            <div>
                <label htmlFor="impression" className="block text-sm font-bold text-gray-700">11. 読者に与えたい印象</label>
                <input id="impression" name="impression" type="text" value={formData.impression} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
            </div>
        </div>

        <div className="pt-5 flex items-center gap-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={isLoading}>
                {isLoading ? '保存中...' : (isCreatingNew ? 'キャラクターを作成' : '更新を保存')}
            </button>
            {!isCreatingNew && onCancel && (
                <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:underline" disabled={isLoading}>
                    キャンセル
                </button>
            )}
        </div>
      </form>
    </div>
  );
}
