// src/components/TaskItem.tsx
import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const API_BASE = process.env.REACT_APP_API_BASE_URL as string;

export type Task = {
  id: string;
  content: string;
  completed: boolean;
};

interface TaskItemProps {
  listId: string;
  task: Task;
  searchTerm: string;
  onUpdate: (updated: Task) => void;
  onDelete: (taskId: string) => void;
  onError: (message: string) => void;
}

export default function TaskItem({
  task,
  onUpdate,
  onDelete,
  onError,
}: TaskItemProps) {
  const { getToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(task.content);

  // toggle complete task
  const toggle = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');
      const res = await fetch(
        `${API_BASE}/api/tasks/${task.id}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: !task.completed }),
        }
      );
      if (!res.ok) throw new Error('Toggle failed');
      const updated: Task = await res.json();
      onUpdate(updated);
    } catch (e: any) {
      console.error(e);
      onError(e.message);
    }
  };

  // save edit
  const saveEdit = async () => {
    const trimmed = draftContent.trim();
    if (!trimmed || trimmed === task.content) {
      setEditing(false);
      setDraftContent(task.content);
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');
      const res = await fetch(
        `${API_BASE}/api/tasks/${task.id}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: trimmed }),
        }
      );
      if (!res.ok) throw new Error('Rename failed');
      const updated: Task = await res.json();
      onUpdate(updated);
    } catch (e: any) {
      console.error(e);
      onError(e.message);
      setDraftContent(task.content);
    } finally {
      setEditing(false);
    }
  };

  // delete task
  const remove = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');
      const res = await fetch(
        `${API_BASE}/api/tasks/${task.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Delete failed');
      onDelete(task.id);
    } catch (e: any) {
      console.error(e);
      onError(e.message);
    }
  };

  return (
    <li className="flex items-center">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={toggle}
        className="
          appearance-none h-5 w-5 border-2 border-gray-300 rounded-sm
          checked:bg-black checked:border-black transition cursor-pointer
        "
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      />

      <span
        className={`ml-3 flex-1 cursor-pointer ${
          task.completed ? 'line-through text-gray-500' : ''
        }`}
        onClick={() => setEditing(true)}
      >
        {editing ? (
          <input
            className="w-full border-b-2 focus:outline-none bg-transparent"
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            autoFocus
            aria-label="Edit task content"
          />
        ) : (
          task.content
        )}
      </span>

      {!editing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="group p-1 transform hover:scale-110 transition"
          title="Edit task"
          aria-label="Edit task"
        >
          <PencilIcon className="h-5 w-5 text-black group-hover:text-gray-700" />
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          remove();
        }}
        className="group p-1 transform hover:scale-110 transition"
        title="Delete task"
        aria-label="Delete task"
      >
        <TrashIcon className="h-5 w-5 text-black group-hover:text-gray-700" />
      </button>
    </li>
  );
}
