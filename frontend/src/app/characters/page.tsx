'use client';

import { useState, useEffect } from 'react';
import CharacterForm from '@/components/CharacterForm';
import EditableCharacter from '@/components/EditableCharacter';

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

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ページ読み込み時にキャラクター一覧を取得
  useEffect(() => {
    const fetchCharacters = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'/characters/');
        if (!res.ok) throw new Error('キャラクター一覧の取得に失敗しました。');
        const data = await res.json();
        setCharacters(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCharacters();
  }, []);

  // 新しいキャラクターが作成/更新された時の処理
  const handleCharacterSave = async (formData: CharacterFormData, characterId?: number) => {
    const endpoint = characterId
      ? `process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'/characters/${characterId}`
      : 'process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'/characters/';
    const method = characterId ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'キャラクターの保存に失敗しました。');
    }
    const savedCharacter = await res.json();
    
    if (characterId) {
        // 更新の場合
        setCharacters(prev => prev.map(c => c.id === savedCharacter.id ? savedCharacter : c));
    } else {
        // 新規作成の場合
        setCharacters(prev => [...prev, savedCharacter]);
    }
  };

  // キャラクターが削除された時の処理
  const handleCharacterDelete = (deletedCharacterId: number) => {
    setCharacters(prevCharacters => 
      prevCharacters.filter(c => c.id !== deletedCharacterId)
    );
  };

  return (
    <main className="flex flex-col items-center p-8 sm:p-24">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">投稿者キャラクター管理</h1>
            <p className="mt-2 text-lg text-gray-500">投稿者となるペルソナを作成・管理します。</p>
        </div>

        <CharacterForm onSave={handleCharacterSave} isCreatingNew={true} />
        
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-6">作成済みキャラクター一覧</h2>
          <div className="space-y-4">
            {isLoading && <p className="text-center">読み込み中...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!isLoading && !error && characters.length > 0 ? (
              characters.map((char) => (
                <EditableCharacter
                  key={char.id}
                  character={char}
                  onUpdate={handleCharacterSave}
                  onDelete={handleCharacterDelete}
                />
              ))
            ) : (
              !isLoading && !error && <p className="text-center text-gray-500">まだキャラクターが作成されていません。</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}