'use client';

import { useState, useEffect } from 'react';
import ProjectForm from '@/components/ProjectForm';
import Link from 'next/link';

// APIのベースURLを定義
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// 型定義
interface Project {
  id: number;
  name: string;
  url: string;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ページが最初に表示された時にプロジェクト一覧を取得
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/projects/`);
        if (!res.ok) {
          throw new Error('プロジェクト一覧の取得に失敗しました。');
        }
        const data = await res.json();
        setProjects(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // プロジェクトを削除する関数
  const handleDeleteProject = async (e: React.MouseEvent, projectId: number, projectName: string) => {
    // 詳細ページへのリンク遷移をキャンセル
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`プロジェクト「${projectName}」を本当に削除しますか？\n関連するすべてのポストも削除されます。`)) {
      try {
        const res = await fetch(`${API_URL}/projects/${projectId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          throw new Error('プロジェクトの削除に失敗しました。');
        }

        // 成功したら、画面上のリストから削除する
        setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
        alert('プロジェクトを削除しました。');
        
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <main className="flex flex-col items-center p-8 sm:p-24">
      <div className="w-full max-w-4xl">
        {/* ProjectFormは、作成成功後に詳細ページへリダイレクトします */}
        <ProjectForm />
        
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-6">プロジェクト一覧</h2>
          <div className="bg-white border rounded-lg shadow-sm">
            <ul className="divide-y divide-gray-200">
              {isLoading && <li className="p-6 text-center text-gray-500">読み込み中...</li>}
              {error && <li className="p-6 text-center text-red-500">{error}</li>}
              {!isLoading && !error && projects.length > 0 ? (
                projects.map((project) => (
                  <li key={project.id} className="group">
                    <Link href={`/projects/${project.id}`} className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-800 truncate">{project.name}</h3>
                          <p className="text-blue-600 break-all">{project.url}</p>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                          className="ml-4 flex-shrink-0 bg-red-500 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        >
                          削除
                        </button>
                      </div>
                    </Link>
                  </li>
                ))
              ) : (
                !isLoading && !error && <li className="p-6 text-center text-gray-500">まだプロジェクトがありません。最初のプロジェクトを作成しましょう！</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
