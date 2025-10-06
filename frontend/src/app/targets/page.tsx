'use client';

import { useState, useEffect } from 'react';
import TargetPersonaForm from '@/components/TargetPersonaForm';
import EditableTargetPersona from '@/components/EditableTargetPersona';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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
  created_at: string;
  updated_at: string | null;
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

export default function TargetPersonasPage() {
  const [personas, setPersonas] = useState<TargetPersona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ページ読み込み時にターゲットペルソナ一覧を取得
  useEffect(() => {
    const fetchTargetPersonas = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/target-personas/`);
        if (!res.ok) throw new Error('ターゲットペルソナ一覧の取得に失敗しました。');
        const data = await res.json();
        setPersonas(data);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('予期せぬエラーが発生しました。');
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTargetPersonas();
  }, []);

  // 新規作成または更新の処理をまとめる
  const handlePersonaSave = async (formData: TargetPersonaFormData, personaId?: number) => {
    const endpoint = personaId
      ? `${API_URL}/target-personas/${personaId}`
      : `${API_URL}/target-personas/`;
    const method = personaId ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'ペルソナの保存に失敗しました。');
    }
    const savedPersona = await res.json();
    
    if (personaId) {
        // 更新の場合
        setPersonas(prev => prev.map(p => p.id === savedPersona.id ? savedPersona : p));
    } else {
        // 新規作成の場合
        setPersonas(prev => [...prev, savedPersona]);
    }
  };

  // ペルソナが削除された時の処理
  const handlePersonaDelete = (deletedPersonaId: number) => {
    setPersonas(prevPersonas => 
      prevPersonas.filter(p => p.id !== deletedPersonaId)
    );
  };

  return (
    <main className="flex flex-col items-center p-8 sm:p-24">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">ターゲットペルソナ管理</h1>
            <p className="mt-2 text-lg text-gray-500">投稿を届けたい相手の人物像を作成・管理します。</p>
        </div>

        <TargetPersonaForm onSave={handlePersonaSave} isCreatingNew={true} />
        
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-6">作成済みターゲットペルソナ一覧</h2>
          <div className="space-y-4">
            {isLoading && <p className="text-center">読み込み中...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!isLoading && !error && personas.length > 0 ? (
              personas.map((persona) => (
                <EditableTargetPersona
                  key={persona.id}
                  persona={persona}
                  onUpdate={handlePersonaSave}
                  onDelete={handlePersonaDelete}
                />
              ))
            ) : (
              !isLoading && !error && <p className="text-center text-gray-500">まだターゲットペルソナが作成されていません。</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
