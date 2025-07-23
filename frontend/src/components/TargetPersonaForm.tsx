'use client';

import { useState, useEffect } from 'react';

// 型定義
interface TargetPersona {
  id: number;
  name: string;
  challenges: string | null;
  goals: string | null;
  knowledge_level: string | null;
  info_sources: string | null;
  keywords: string | null;
  decision_triggers: string | null;
}

interface TargetPersonaFormData {
    name: string;
    challenges: string;
    goals: string;
    knowledge_level: string;
    info_sources: string;
    keywords: string;
    decision_triggers: string;
}

interface TargetPersonaFormProps {
  existingPersona?: TargetPersona;
  onSave: (personaData: TargetPersonaFormData, personaId?: number) => Promise<void>;
  onCancel?: () => void;
  isCreatingNew: boolean;
}

export default function TargetPersonaForm({ existingPersona, onSave, onCancel, isCreatingNew }: TargetPersonaFormProps) {
  const [formData, setFormData] = useState<TargetPersonaFormData>({
    name: '', challenges: '', goals: '', knowledge_level: '',
    info_sources: '', keywords: '', decision_triggers: ''
  });
  
  const [seedText, setSeedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingPersona) {
      setFormData({
        name: existingPersona.name || '',
        challenges: existingPersona.challenges || '',
        goals: existingPersona.goals || '',
        knowledge_level: existingPersona.knowledge_level || '',
        info_sources: existingPersona.info_sources || '',
        keywords: existingPersona.keywords || '',
        decision_triggers: existingPersona.decision_triggers || '',
      });
    }
  }, [existingPersona]);

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
      const res = await fetch('http://127.0.0.1:8000/target-personas/generate-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed_text: seedText }),
      });
      if (!res.ok) throw new Error('AIによるペルソナ生成に失敗しました。');
      const aiGeneratedData = await res.json();
      setFormData({ ...formData, ...aiGeneratedData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await onSave(formData, existingPersona?.id);

      if (isCreatingNew) {
        setFormData({
            name: '', challenges: '', goals: '', knowledge_level: '',
            info_sources: '', keywords: '', decision_triggers: ''
        });
        setSeedText('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 mb-12 bg-white border rounded-lg shadow-sm">
      {isCreatingNew && (
        <div className="p-4 mb-6 bg-sky-50 border border-sky-200 rounded-lg">
          <h3 className="text-lg font-bold mb-2">AIペルソナアシスタント</h3>
          <p className="text-sm text-gray-600 mb-2">ターゲットのキーワード（例：「新しい技術に興味がある大学生」）を入力してボタンを押すと、AIが以下の詳細項目を自動で生成します。</p>
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
        <h2 className="text-2xl font-bold">{isCreatingNew ? '新規ターゲットペルソナ作成' : 'ターゲットペルソナ編集'}</h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-gray-700">1. ペルソナ名 (必須)</label>
          <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="challenges" className="block text-sm font-bold text-gray-700">2. 抱えている課題・悩み</label>
          <textarea id="challenges" name="challenges" value={formData.challenges} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="goals" className="block text-sm font-bold text-gray-700">3. 達成したいこと</label>
          <textarea id="goals" name="goals" value={formData.goals} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="knowledge_level" className="block text-sm font-bold text-gray-700">4. 知識レベル</label>
            <input id="knowledge_level" name="knowledge_level" type="text" value={formData.knowledge_level} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
          </div>
          <div>
            <label htmlFor="info_sources" className="block text-sm font-bold text-gray-700">5. 主な情報源</label>
            <input id="info_sources" name="info_sources" type="text" value={formData.info_sources} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="keywords" className="block text-sm font-bold text-gray-700">6. 関心を引くキーワード</label>
            <input id="keywords" name="keywords" type="text" value={formData.keywords} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
          </div>
          <div>
            <label htmlFor="decision_triggers" className="block text-sm font-bold text-gray-700">7. 行動の決め手</label>
            <input id="decision_triggers" name="decision_triggers" type="text" value={formData.decision_triggers} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md" disabled={isLoading} />
          </div>
        </div>
        <div className="pt-5 flex items-center gap-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={isLoading}>
                {isLoading ? '保存中...' : (isCreatingNew ? '作成' : '更新を保存')}
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