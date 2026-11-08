import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Safe markdown rendering (raw HTML is ignored). */
export function Markdown({ children, className = "prose-wood" }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
