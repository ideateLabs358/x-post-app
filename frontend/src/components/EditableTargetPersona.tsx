'use client';

import { useState } from 'react';
import TargetPersonaForm from './TargetPersonaForm';

// APIのベースURLを定義
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

interface EditableTargetPersonaProps {
  persona: TargetPersona;
  onUpdate: (updatedPersona: TargetPersona) => void;
  onDelete: (id: number) => void;
}

export default function EditableTargetPersona({ persona, onUpdate, onDelete }: EditableTargetPersonaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`「${persona.name}」を本当に削除しますか？`)) {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/target-personas/${persona.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('削除に失敗しました。');
        onDelete(persona.id);
      } catch (error) {
        console.error(error);
        alert('削除中にエラーが発生しました。');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // フォームが保存された時の処理
  const handleFormSave = async (formData: TargetPersonaFormData, personaId?: number) => {
    if (!personaId) return;
    
    const res = await fetch(`${API_URL}/target-personas/${personaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || '更新に失敗しました。');
    }
    const updatedPersona = await res.json();
    onUpdate(updatedPersona); // 親コンポーネントに更新を通知
    setIsEditing(false); // 編集モードを終了
  };


  if (isEditing) {
    // --- 編集モードの時は、TargetPersonaFormを呼び出す ---
    return (
      <TargetPersonaForm
        existingPersona={persona}
        onSave={handleFormSave}
        onCancel={() => setIsEditing(false)}
        isCreatingNew={false}
      />
    );
  }

  // --- 通常の表示モード ---
  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm group relative">
        <h3 className="text-xl font-semibold text-gray-800">{persona.name}</h3>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li><strong>課題:</strong> {persona.challenges || '未設定'}</li>
            <li><strong>目標:</strong> {persona.goals || '未設定'}</li>
            <li><strong>知識レベル:</strong> {persona.knowledge_level || '未設定'}</li>
            <li><strong>情報源:</strong> {persona.info_sources || '未設定'}</li>
            <li><strong>キーワード:</strong> {persona.keywords || '未設定'}</li>
            <li><strong>決め手:</strong> {persona.decision_triggers || '未設定'}</li>
        </ul>
      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)} className="bg-white text-xs px-2 py-1 rounded border shadow-sm hover:bg-gray-50">編集</button>
        <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded border shadow-sm" disabled={isLoading}>削除</button>
      </div>
    </div>
  );
}
