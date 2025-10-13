type LanguageCode = "es" | "en";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  language: LanguageCode;
  sources?: Array<{
    text: string;
    score: number;
  }>;
}

const SOURCES_LABEL: Record<LanguageCode, string> = {
  es: "Fuentes:",
  en: "Sources:",
};

export default function Message({ role, content, sources, language }: MessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 ${
          isUser ? "bg-gradient-anclora text-white" : ""
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>

        {sources && sources.length > 0 && (
          <div className="mt-3 border-t border-gray-200 pt-3 dark:border-slate-700">
            <p className="mb-2 text-xs font-semibold opacity-75">{SOURCES_LABEL[language]}</p>
            {sources.map((source, idx) => (
              <div key={idx} className="mb-1 text-xs opacity-70 dark:text-slate-300/80">
                <span className="rounded bg-anclora-secondary/20 px-1 font-mono">
                  {(source.score * 100).toFixed(1)}%
                </span>{" "}
                {source.text.substring(0, 100)}...
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
