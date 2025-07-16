// src/App.tsx
import React, { useEffect, useState } from 'react';
import { SignIn, useUser, useAuth } from '@clerk/clerk-react';
import toast, { Toaster } from 'react-hot-toast';
import Select, { StylesConfig, SingleValue } from 'react-select';
import ListCard, { TodoList } from './components/ListCard';
import './index.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL as string;

type SortOption = { value: 'az' | 'za'; label: string };

// list sorting
const listSortOptions: SortOption[] = [
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
];
// task sorting
const taskSortOptions: SortOption[] = [...listSortOptions];

// custom styles for react-select
const selectStyles: StylesConfig<SortOption, false> = {
  control: (provided) => ({
    ...provided,
    borderRadius: '9999px',
    borderColor: '#d1d5db',
    padding: '0.125rem 0.75rem',
    minHeight: '2rem',
    boxShadow: 'none',
    backgroundColor: 'white',
    color: '#111827',
  }),
  singleValue: (provided) => ({ ...provided, color: '#111827' }),
  placeholder: (provided) => ({ ...provided, color: '#6b7280' }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? '#e0e7ff' : undefined,
    color: state.isSelected ? '#4f46e5' : '#111827',
  }),
};

export default function App() {
  const { isSignedIn } = useUser();
  const { getToken, signOut } = useAuth();

  const [lists, setLists] = useState<TodoList[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  const [globalSearch, setGlobalSearch] = useState('');
  const [showIncomplete, setShowIncomplete] = useState(false);

  // true = a→z, false = z→a
  const [sortListsAZ, setSortListsAZ] = useState(true);
  const [sortTasksAZ, setSortTasksAZ] = useState(true);

  // centralized error handler
  const handleError = (msg: string) => {
    setError(msg);
    toast.error(msg);
  };

  // fetch lists on sign-in
  useEffect(() => {
    if (!isSignedIn) {
      setLists(null);
      setError(null);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        await fetch(`${API_BASE}/api/sync-user`, {
          method: 'POST',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        const res = await fetch(`${API_BASE}/api/lists`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(res.statusText);
        const data: TodoList[] = await res.json();
        setLists(data);
      } catch (e: any) {
        console.error(e);
        handleError(e.message);
        setLists([]);
      }
    })();
  }, [isSignedIn, getToken]);

  // create list
  const addList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreatingList(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`${API_BASE}/api/lists`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: TodoList = await res.json();
      setLists((prev) => (prev ? [created, ...prev] : [created]));
      setNewTitle('');
      toast.success('List created');
    } catch (e: any) {
      console.error(e);
      handleError(e.message);
    } finally {
      setCreatingList(false);
    }
  };

  // handlers
  const renameList = (updated: TodoList) =>
    setLists((prev) => prev!.map((l) => (l.id === updated.id ? updated : l)));
  const deleteList = (id: string) => {
    setLists((prev) => prev!.filter((l) => l.id !== id));
    toast.success('List deleted');
  };
  const addTask = (listId: string, task: TodoList['tasks'][0]) => {
    setLists((prev) =>
      prev!.map((l) =>
        l.id === listId ? { ...l, tasks: [...l.tasks, task] } : l
      )
    );
    toast.success('Task added');
  };
  const updateTask = (listId: string, updated: TodoList['tasks'][0]) => {
    setLists((prev) =>
      prev!.map((l) =>
        l.id === listId
          ? {
              ...l,
              tasks: l.tasks.map((t) => (t.id === updated.id ? updated : t)),
            }
          : l
      )
    );
    toast.success('Task updated');
  };
  const deleteTask = (listId: string, taskId: string) => {
    setLists((prev) =>
      prev!.map((l) =>
        l.id === listId
          ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) }
          : l
      )
    );
    toast.success('Task deleted');
  };

  // signed-out or loading
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-6 bg-white rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl mb-4">Please sign in</h2>
          <SignIn />
        </div>
      </div>
    );
  }
  if (lists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading your lists…</p>
      </div>
    );
  }

  // apply search, filter, sort
  let processed = lists;
  if (globalSearch.trim()) {
    const q = globalSearch.toLowerCase();
    processed = processed
      .map((l) => ({
        ...l,
        tasks: l.tasks.filter((t) =>
          t.content.toLowerCase().includes(q)
        ),
      }))
      .filter((l) => l.tasks.length);
  }
  if (showIncomplete) {
    processed = processed
      .map((l) => ({
        ...l,
        tasks: l.tasks.filter((t) => !t.completed),
      }))
      .filter((l) => l.tasks.length);
  }
  processed = [...processed].sort((a, b) =>
    sortListsAZ ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
  );
  processed = processed.map((l) => ({
    ...l,
    tasks: [...l.tasks].sort((a, b) =>
      sortTasksAZ ? a.content.localeCompare(b.content) : b.content.localeCompare(a.content)
    ),
  }));

  const autoExpand = showIncomplete || Boolean(globalSearch.trim());
  const hasAnyTasks = lists.some((l) => l.tasks.length > 0);

  return (
    <>
      <Toaster position="top-center" />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
          To Do
        </h1>

        {/* controls */}
        <div className="space-y-4 mb-4">
          {hasAnyTasks && (
            <input
              type="text"
              className="w-full border rounded p-2"
              placeholder="Search all tasks…"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showIncomplete}
                onChange={(e) => setShowIncomplete(e.target.checked)}
                className="
                  appearance-none h-5 w-5 border-2 border-gray-300 rounded-sm
                  checked:bg-black checked:border-black transition cursor-pointer
                "
              />
              <span>Only incomplete tasks</span>
            </label>

            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium whitespace-nowrap">Sort lists:</span>
                <div className="w-full sm:w-36">
                  <Select
                    styles={selectStyles}
                    value={listSortOptions.find((o) =>
                      sortListsAZ ? o.value === 'az' : o.value === 'za'
                    )}
                    onChange={(opt: SingleValue<SortOption>) =>
                      setSortListsAZ(opt?.value === 'az')
                    }
                    options={listSortOptions}
                    isSearchable={false}
                    menuPlacement="auto"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-medium whitespace-nowrap">Sort tasks:</span>
                <div className="w-full sm:w-36">
                  <Select
                    styles={selectStyles}
                    value={taskSortOptions.find((o) =>
                      sortTasksAZ ? o.value === 'az' : o.value === 'za'
                    )}
                    onChange={(opt: SingleValue<SortOption>) =>
                      setSortTasksAZ(opt?.value === 'az')
                    }
                    options={taskSortOptions}
                    isSearchable={false}
                    menuPlacement="auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 mb-4">Error: {error}</p>}

        {processed.length === 0 ? (
          <p>No lists match the current filters or search. Create one below.</p>
        ) : (
          <ul className="space-y-4 mb-6">
            {processed.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                expand={autoExpand}
                searchTerm={globalSearch}
                onRename={renameList}
                onDelete={deleteList}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onError={handleError}
              />
            ))}
          </ul>
        )}

        {/* new list form */}
        <form
          className="mt-4 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0"
          onSubmit={addList}
        >
          <input
            className="flex-1 border rounded p-2"
            placeholder="New list title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={creatingList}
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-gray-800 text-white rounded disabled:opacity-50 transition"
            disabled={creatingList}
          >
            {creatingList ? 'Creating…' : 'Create'}
          </button>
        </form>

        {/* sign out */}
        <div className="mt-6 text-center">
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

// typescript
type Task = { id: string; content: string; completed: boolean };
