interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    text: string;
    score: number;
  }>;
}

export default function Message({ role, content, sources }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 shadow-md ${
          isUser
            ? 'bg-gradient-anclora text-white'
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        
        {sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold mb-2 opacity-75">Fuentes:</p>
            {sources.map((source, idx) => (
              <div key={idx} className="text-xs opacity-70 mb-1">
                <span className="font-mono bg-anclora-secondary/20 px-1 rounded">
                  {(source.score * 100).toFixed(1)}%
                </span>{' '}
                {source.text.substring(0, 100)}...
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
