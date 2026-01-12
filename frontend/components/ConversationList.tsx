'use client';

import React from 'react';
import { MessageSquare, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}: ConversationListProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(['today'])
  );
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const groupConversations = (convs: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      week: [] as Conversation[],
      older: [] as Conversation[],
    };

    convs.forEach((conv) => {
      const date = new Date(conv.updated_at);
      if (date >= today) {
        groups.today.push(conv);
      } else if (date >= yesterday) {
        groups.yesterday.push(conv);
      } else if (date >= weekAgo) {
        groups.week.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const groups = groupConversations(conversations);

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const isActive = conversation.id === activeConversationId;
    const isHovered = hoveredId === conversation.id;
    const isEditing = editingId === conversation.id;

    return (
      <div
        className={`group relative rounded-lg mb-1 transition-colors ${
          isActive ? 'bg-[#E7F3FF] dark:bg-slate-800' : 'hover:bg-[#F3F2F0] dark:hover:bg-slate-800'
        }`}
        onMouseEnter={() => setHoveredId(conversation.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <button
          onClick={() => !isEditing && onSelectConversation(conversation.id)}
          className="w-full text-left px-3 py-2.5 flex items-start gap-2"
        >
          <MessageSquare
            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              isActive ? 'text-[#0A66C2]' : 'text-[#666666] dark:text-slate-400'
            }`}
          />
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="w-full px-2 py-0.5 text-sm font-medium border border-[#0A66C2] rounded focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className={`text-sm font-medium truncate ${
                  isActive ? 'text-[#0A66C2] dark:text-blue-400' : 'text-black dark:text-white'
                }`}
              >
                {conversation.title}
              </div>
            )}
          </div>
        </button>

        {/* Action buttons */}
        {isHovered && !isEditing && (
          <div className="absolute right-2 top-2 flex gap-1 bg-white dark:bg-slate-700 rounded shadow-sm border border-[#E0DFDC] dark:border-slate-600">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit(conversation);
              }}
              className="p-1.5 hover:bg-[#F3F2F0] dark:hover:bg-slate-600 rounded transition-colors"
              title="Rename"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#666666] dark:text-slate-300" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this conversation?')) {
                  onDeleteConversation(conversation.id);
                }
              }}
              className="p-1.5 hover:bg-[#F3F2F0] dark:hover:bg-slate-600 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#CC1016]" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const GroupHeader = ({ title, count, groupKey }: { title: string; count: number; groupKey: string }) => {
    const isExpanded = expandedGroups.has(groupKey);
    if (count === 0) return null;

    return (
      <button
        onClick={() => toggleGroup(groupKey)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#666666] dark:text-slate-400 hover:bg-[#F3F2F0] dark:hover:bg-slate-800 rounded transition-colors mb-1"
      >
        <span className="uppercase tracking-wide">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-[#999999]">{count}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-1">
      {/* Today */}
      <GroupHeader title="Today" count={groups.today.length} groupKey="today" />
      {expandedGroups.has('today') &&
        groups.today.map((conv) => <ConversationItem key={conv.id} conversation={conv} />)}

      {/* Yesterday */}
      <GroupHeader title="Yesterday" count={groups.yesterday.length} groupKey="yesterday" />
      {expandedGroups.has('yesterday') &&
        groups.yesterday.map((conv) => <ConversationItem key={conv.id} conversation={conv} />)}

      {/* Previous 7 Days */}
      <GroupHeader title="Previous 7 Days" count={groups.week.length} groupKey="week" />
      {expandedGroups.has('week') &&
        groups.week.map((conv) => <ConversationItem key={conv.id} conversation={conv} />)}

      {/* Older */}
      <GroupHeader title="Older" count={groups.older.length} groupKey="older" />
      {expandedGroups.has('older') &&
        groups.older.map((conv) => <ConversationItem key={conv.id} conversation={conv} />)}
    </div>
  );
}

