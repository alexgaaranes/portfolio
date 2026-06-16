import { useState } from 'react';
import { createProject } from './api';

function CMS() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject({ title, description }).then(() => {
      alert('Project added!');
      setTitle('');
      setDescription('');
    });
  };

  return (
    <div>
      <h1>CMS Dashboard</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <button type="submit">Add Project</button>
      </form>
    </div>
  );
}

export default CMS;
