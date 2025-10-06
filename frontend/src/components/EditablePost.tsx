'use client';

import { useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// 型定義
interface Post {
  id: number;
  content: string;
  status: string;
  scheduled_at: string | null;
  image_url: string | null;
}

interface EditablePostProps {
  post: Post;
  onPostDelete: (id: number) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function EditablePost({ post, onPostDelete }: EditablePostProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [content, setContent] = useState(post.content);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(
    post.scheduled_at ? new Date(post.scheduled_at) : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(post.status);
  const [imageUrl, setImageUrl] = useState(post.image_url);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaPrompts, setMediaPrompts] = useState<{ image_prompt: string, video_prompt: string } | null>(null);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content }),
      });
      if (!res.ok) throw new Error('保存に失敗しました。');
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('保存中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('このポストを本当に削除しますか？')) {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/posts/${post.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('削除に失敗しました。');
        onPostDelete(post.id);
      } catch (error) {
        console.error(error);
        alert('削除中にエラーが発生しました');
        setIsLoading(false);
      }
    }
  };

  const handleSchedule = async () => {
    if (!scheduledAt) {
      alert('予約日時を選択してください。');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: scheduledAt.toISOString() }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || '予約に失敗しました。');
      }
      const updatedPost = await res.json();
      setStatus(updatedPost.status);
      setScheduledAt(new Date(updatedPost.scheduled_at));
      setIsScheduling(false);
      alert('予約が完了しました！');
    } catch (err) {
      if (err instanceof Error) {
        alert(`予約中にエラーが発生しました: ${err.message}`);
      } else {
        alert('予期せぬエラーが発生しました。');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostNow = async () => {
    if (window.confirm('この内容で今すぐXに投稿しますか？')) {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/posts/${post.id}/post-now`, {
          method: 'POST',
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || '投稿に失敗しました。');
        }
        alert('投稿に成功しました！');
        setStatus('posted');
      } catch (err) {
        if (err instanceof Error) {
          alert(`投稿中にエラーが発生しました: ${err.message}`);
        } else {
          alert('予期せぬエラーが発生しました。');
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('プロンプトをコピーしました！');
    }, () => {
      alert('コピーに失敗しました。');
    });
  };
  
  const handleGenerateMediaPrompts = async () => {
    setIsGeneratingMedia(true);
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/generate-media-prompts`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'メディアプロンプトの生成に失敗しました。');
      }
      const data = await res.json();
      setMediaPrompts(data);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('画像のアップロードに失敗しました。');
      }
      const updatedPost = await res.json();
      setImageUrl(updatedPost.image_url);
      alert('画像が添付されました！');
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg shadow-md">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-40 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <div className="mt-2 flex items-center gap-4">
          <button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm disabled:bg-gray-400">
            {isLoading ? '保存中...' : '保存'}
          </button>
          <button onClick={() => setIsEditing(false)} className="text-sm text-gray-600 hover:underline" disabled={isLoading}>
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg group relative transition-colors ${status === 'posted' ? 'bg-green-100' : (status === 'scheduled' ? 'bg-blue-100' : 'bg-gray-100')}`}>
      {isScheduling && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col justify-center items-center z-10 p-4 rounded-lg border">
          <h4 className="font-bold mb-2">投稿日時を選択</h4>
          <DatePicker selected={scheduledAt} onChange={(date: Date | null) => setScheduledAt(date)} showTimeSelect dateFormat="yyyy/MM/dd HH:mm" timeFormat="HH:mm" className="text-center p-2 border rounded" minDate={new Date()} />
          <div className="mt-4 space-x-4">
            <button onClick={handleSchedule} disabled={isLoading} className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-1 rounded disabled:bg-gray-400">
              {isLoading ? '設定中...' : 'この日時に予約する'}
            </button>
            <button onClick={() => setIsScheduling(false)} className="text-sm text-gray-600">キャンセル</button>
          </div>
        </div>
      )}

      {imageUrl && (
        <div className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="添付画像" className="max-w-full h-auto rounded-lg border" />
        </div>
      )}

      <p className="whitespace-pre-wrap">{content}</p>

      {status === 'posted' && (<div className="mt-2 text-sm font-bold text-green-700">✓ 投稿済み</div>)}
      {status === 'scheduled' && scheduledAt && (
        <div className="mt-2 text-sm font-bold text-blue-700">✓ {scheduledAt.toLocaleString('ja-JP')} に予約済み</div>
      )}

      {isGeneratingMedia && <p className="text-sm text-gray-500 mt-4 animate-pulse">メディア用プロンプトをAIが生成中です...</p>}
      {mediaPrompts && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">画像生成プロンプト (Midjourney用)</label>
            <textarea readOnly value={mediaPrompts.image_prompt} className="w-full h-24 p-2 border rounded-md font-mono text-xs bg-gray-50" />
            <button onClick={() => copyToClipboard(mediaPrompts.image_prompt)} className="mt-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">コピー</button>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">動画生成プロンプト</label>
            <textarea readOnly value={mediaPrompts.video_prompt} className="w-full h-20 p-2 border rounded-md font-mono text-xs bg-gray-50" />
            <button onClick={() => copyToClipboard(mediaPrompts.video_prompt)} className="mt-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">コピー</button>
          </div>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
      />

      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || status !== 'draft'} className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded border shadow-sm disabled:bg-gray-400">
          画像
        </button>
        <button onClick={handleGenerateMediaPrompts} disabled={isGeneratingMedia || isLoading} className="bg-teal-500 hover:bg-teal-600 text-white text-xs px-2 py-1 rounded border shadow-sm disabled:bg-gray-400">
          AIプロンプト
        </button>
        {status === 'draft' && (
          <>
            <button onClick={handlePostNow} disabled={isLoading} className="bg-sky-500 hover:bg-sky-600 text-white text-xs px-2 py-1 rounded border shadow-sm disabled:bg-gray-400">投稿</button>
            <button onClick={() => setIsScheduling(true)} disabled={isLoading} className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-2 py-1 rounded border shadow-sm disabled:bg-gray-400">予約</button>
            <button onClick={() => setIsEditing(true)} disabled={isLoading} className="bg-white text-xs px-2 py-1 rounded border shadow-sm hover:bg-gray-50">編集</button>
          </>
        )}
        <button onClick={handleDelete} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded border shadow-sm">削除</button>
      </div>
    </div>
  );
}
