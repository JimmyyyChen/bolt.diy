import React from 'react';

export interface TagItem {
  id: string;
  name: string;
}

interface ContextTagsProps<T extends TagItem> {
  items: T[];
  onRemove: (id: string) => void;
  onAddClick: (e: React.MouseEvent) => void;
  onItemClick?: (e: React.MouseEvent, item: T) => void;
  tagIcon: string; // CSS class for the icon
  addButtonText: string;
  addButtonIcon: string; // CSS class for the add button icon
}

export function ContextTags<T extends TagItem>({
  items,
  onRemove,
  onAddClick,
  onItemClick,
  tagIcon,
  addButtonText,
  addButtonIcon,
}: ContextTagsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1 mb-2 px-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="text-xs px-2 py-1 rounded-md bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary flex items-center group relative cursor-pointer"
          onClick={(e) => onItemClick && onItemClick(e, item)}
        >
          <span className={`${tagIcon} text-xs mr-1 group-hover:hidden`}></span>
          <button
            className="i-ph:x text-xs mr-1 hidden group-hover:inline-block text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            aria-label={`Remove ${item.name}`}
          />
          {item.name}
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={onAddClick}
        className="text-xs px-3 py-1 rounded-md border border-dashed border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 flex items-center gap-1 cursor-pointer transition-colors"
        aria-label={addButtonText}
      >
        <span className={`${addButtonIcon} text-xs`}></span>
        <span>{addButtonText}</span>
      </button>
    </div>
  );
}
