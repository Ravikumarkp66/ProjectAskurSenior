import React from 'react';

const TodoForm = ({ todos, setTodos }) => {
  const handleAddTodo = () => {
    if (todos.length >= 3) return alert('Maximum 3 tasks allowed for now.');
    setTodos([...todos, { text: '', done: false }]);
  };

  const handleUpdateTodo = (index, value) => {
    const newTodos = [...todos];
    newTodos[index].text = value;
    setTodos(newTodos);
  };

  const handleRemoveTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Daily To-Do Tasks</h2>
        <p className="text-gray-600 dark:text-gray-400">Add up to 3 priority tasks for your assistant to track.</p>
      </div>

      <div className="space-y-4">
        {todos.map((todo, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={todo.text}
              onChange={(e) => handleUpdateTodo(index, e.target.value)}
              placeholder={`Task ${index + 1}...`}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={() => handleRemoveTodo(index)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}

        {todos.length < 3 && (
          <button
            onClick={handleAddTodo}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-all font-medium"
          >
            + Add Task
          </button>
        )}
      </div>
    </div>
  );
};

export default TodoForm;
