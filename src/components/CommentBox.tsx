import { useState } from 'react';

const API_URL = 'https://lcd.jxh.io';

export default function CommentBox() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('sending');
    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'anon',
          message: message.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to send');

      setStatus('sent');
      setMessage('');
      setName('');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <div className="border-t border-neutral-800 pt-3 mt-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-neutral-600 text-xs font-mono">&gt;</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="anon"
            maxLength={50}
            className="bg-transparent text-neutral-400 text-xs font-mono placeholder:text-neutral-700 focus:outline-none w-16 md:w-20"
          />
          <span className="text-neutral-700 text-xs font-mono">:</span>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="leave a note..."
            maxLength={500}
            className="flex-1 bg-transparent text-neutral-300 text-xs font-mono placeholder:text-neutral-700 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!message.trim() || status === 'sending'}
            className="text-xs font-mono text-neutral-600 hover:text-neutral-400 disabled:text-neutral-800 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'sending' ? '...' : status === 'sent' ? 'ok' : status === 'error' ? 'err' : 'send'}
          </button>
        </div>
      </form>
    </div>
  );
}
