import { Tag } from "@/types/task";
import { cn } from "@/lib/utils";

interface TaskTagProps {
  tag: Tag;
  onRemove?: () => void;
}

export const TaskTag = ({ tag, onRemove }: TaskTagProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded transition-colors",
        `bg-tag-${tag.color}/10 text-tag-${tag.color}`
      )}
    >
      {tag.label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          type="button"
        >
          ×
        </button>
      )}
    </span>
  );
};
