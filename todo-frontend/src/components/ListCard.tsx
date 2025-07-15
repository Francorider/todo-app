// src/components/ListCard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import TaskItem, { Task } from './TaskItem';

const API_BASE = process.env.REACT_APP_API_BASE_URL as string;

export type TodoList = {
  id: string;
  title: string;
  tasks: Task[];
};

interface ListCardProps {
  list: TodoList;
  expand?: boolean;
  searchTerm?: string;
  onRename: (updated: TodoList) => void;
  onDelete: (listId: string) => void;
  onAddTask: (listId: string, task: Task) => void;
  onUpdateTask: (listId: string, updated: Task) => void;
  onDeleteTask: (listId: string, taskId: string) => void;
  onError: (message: string) => void;
}

export default function ListCard({
  list,
  expand,
  searchTerm = '',
  onRename,
  onDelete,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onError,
}: ListCardProps) {
  const { getToken } = useAuth();

  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(list.title);
  const [newContent, setNewContent] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // counts for header display
  const totalCount = list.tasks.length;
  const completedCount = list.tasks.filter((t) => t.completed).length;

  useEffect(() => {
    if (expand !== undefined) {
      setExpanded(expand);
    }
  }, [expand]);

  // rename list
  const saveTitle = async () => {
    const title = draftTitle.trim();
    if (!title || title === list.title) {
      setEditing(false);
      setDraftTitle(list.title);
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');
      const res = await fetch(
        `${API_BASE}/api/lists/${list.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        }
      );
      if (!res.ok) throw new Error('Rename failed');
      const updated: TodoList = await res.json();
      onRename(updated);
    } catch (e: any) {
      console.error(e);
      onError(e.message);
      setDraftTitle(list.title);
    } finally {
      setEditing(false);
    }
  };

  // delete list
  const removeList = async () => {
    if (!window.confirm('Delete this list?')) return;
    try {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');
      const res = await fetch(
        `${API_BASE}/api/lists/${list.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Delete failed');
      onDelete(list.id);
    } catch (e: any) {
      console.error(e);
      onError(e.message);
    }
  };

  // create task
  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newContent.trim();
    if (!content) return;
    setCreatingTask(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');
      const res = await fetch(
        `${API_BASE}/api/lists/${list.id}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) throw new Error('Create task failed');
      const task: Task = await res.json();
      onAddTask(list.id, task);
      setNewContent('');
    } catch (e: any) {
      console.error(e);
      onError(e.message);
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <li className="border rounded mb-4 overflow-hidden">
      {/* header */}
      <div
        className="flex items-center justify-between p-4 bg-black text-white cursor-pointer"
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="flex-1 flex items-center space-x-2">
          {editing ? (
            <input
              className="flex-1 bg-black text-white border-b border-white focus:outline-none"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              autoFocus
            />
          ) : (
            <>
              <h2 className="text-lg font-semibold">{list.title}</h2>
              <span className="text-sm text-gray-400">
                {completedCount}/{totalCount}
              </span>
            </>
          )}
        </div>

        <div className="flex space-x-2">
          {!editing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="group p-1 transform hover:scale-110 transition"
              title="Rename list"
            >
              <PencilIcon className="h-5 w-5 text-white group-hover:text-gray-300" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeList();
            }}
            className="group p-1 transform hover:scale-110 transition"
            title="Delete list"
          >
            <TrashIcon className="h-5 w-5 text-white group-hover:text-gray-300" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pt-4 pb-4">
          <ul className="mb-3 space-y-2">
            {list.tasks.map((task) => (
              <TaskItem
                key={task.id}
                listId={list.id}
                task={task}
                searchTerm={searchTerm}
                onUpdate={(u) => onUpdateTask(list.id, u)}
                onDelete={(tid) => onDeleteTask(list.id, tid)}
                onError={onError}
              />
            ))}
          </ul>

          <form
            className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0"
            onSubmit={createTask}
          >
            <input
              className="flex-1 border rounded p-1"
              placeholder="Add a task…"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              disabled={creatingTask}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-2 bg-black hover:bg-gray-800 text-white rounded disabled:opacity-50 transition"
              disabled={creatingTask}
            >
              {creatingTask ? '…' : '+'}
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
