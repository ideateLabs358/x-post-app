'use client';

import { useState } from 'react';
import CharacterForm from './CharacterForm';

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
  created_at: string;
  updated_at: string | null;
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

// 親コンポーネントから受け取る関数の型定義を修正
interface EditableCharacterProps {
  character: Character;
  onUpdate: (formData: CharacterFormData, id: number) => Promise<void>; // ★★★ ここを修正 ★★★
  onDelete: (id: number) => void;
}

export default function EditableCharacter({ character, onUpdate, onDelete }: EditableCharacterProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`「${character.name}」を本当に削除しますか？`)) {
      setIsLoading(true);
      try {
        const res = await fetch(`process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'/characters/${character.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('削除に失敗しました。');
        onDelete(character.id);
      } catch (error) {
        console.error(error);
        alert('削除中にエラーが発生しました。');
        setIsLoading(false);
      }
    }
  };

  // フォームが保存された時の処理を修正
  const handleFormSave = async (formData: CharacterFormData, characterId?: number) => {
    await onUpdate(formData, character.id); // 親に処理をそのまま渡す
    setIsEditing(false); // 編集モードを終了
  };


  if (isEditing) {
    // --- 編集モードの時は、CharacterFormを呼び出す ---
    return (
      <CharacterForm
        existingCharacter={character}
        onSave={handleFormSave}
        onCancel={() => setIsEditing(false)}
        isCreatingNew={false}
      />
    );
  }

  // --- 通常の表示モード ---
  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm group relative">
      <h3 className="text-xl font-semibold text-gray-800">{character.name} <span className="text-base font-normal text-gray-500">- {character.title || '肩書未設定'}</span></h3>
      <p className="mt-2 text-gray-600 whitespace-pre-wrap"><strong>専門分野:</strong> {character.expertise || '未設定'}</p>
      <p className="mt-2 text-gray-600 whitespace-pre-wrap"><strong>口調:</strong> {character.base_tone || '未設定'}</p>
      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)} className="bg-white text-xs px-2 py-1 rounded border shadow-sm hover:bg-gray-50">編集</button>
        <button onClick={handleDelete} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded border shadow-sm">削除</button>
      </div>
    </div>
  );
}