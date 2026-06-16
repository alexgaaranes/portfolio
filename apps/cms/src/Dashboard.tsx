import { useState, useEffect, useMemo, useRef } from 'react';
import api, { getProjects, createProject, deleteProject, getBlogs, createBlog, deleteBlog, getProfile, updateProfile } from './api';
import SimpleMdeReact from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactDOMServer from 'react-dom/server';
import './CMS.css';

const convertBase64ToBlobUrls = async (text: string): Promise<string> => {
  if (!text) return text;
  const regex = /!\[(.*?)\]\((data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/=]+)\)/g;
  let match;
  let resultText = text;
  
  const matches: { full: string; alt: string; dataUrl: string }[] = [];
  const tempRegex = new RegExp(regex);
  while ((match = tempRegex.exec(text)) !== null) {
    matches.push({ full: match[0], alt: match[1], dataUrl: match[2] });
  }

  for (const m of matches) {
    try {
      const res = await fetch(m.dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      resultText = resultText.replace(m.full, `![${m.alt}](${blobUrl})`);
    } catch (err) {
      console.error("Failed to convert base64 image to blob URL:", err);
    }
  }
  return resultText;
};

const convertBlobUrlsToBase64 = async (text: string): Promise<string> => {
  if (!text) return text;
  const regex = /!\[(.*?)\]\((blob:https?:\/\/[^\s)]+)\)/g;
  let match;
  let resultText = text;

  const matches: { full: string; alt: string; blobUrl: string }[] = [];
  const tempRegex = new RegExp(regex);
  while ((match = tempRegex.exec(text)) !== null) {
    matches.push({ full: match[0], alt: match[1], blobUrl: match[2] });
  }

  for (const m of matches) {
    try {
      const res = await fetch(m.blobUrl);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      resultText = resultText.replace(m.full, `![${m.alt}](${base64})`);
    } catch (err) {
      console.error("Failed to convert blob URL back to base64:", err);
    }
  }
  return resultText;
};

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        }, "image/jpeg", 0.75);
      };
    };
  });
};

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [profile, setProfile] = useState<any>({});
  const [activeTab, setActiveTab] = useState('profile');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'project' | 'blog' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Pending images to upload alongside the form
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Form states for adding/editing
  const [formData, setFormData] = useState<any>({ title: '', headline: '', description: '', body: '', link: '' });

  const mdeOptions = useMemo(() => ({
    spellChecker: false,
    minHeight: "200px",
    autofocus: false,
    placeholder: "Write content here (Markdown supported)...",
    toolbar: [
      "bold", "italic", "heading", "|",
      "quote", "unordered-list", "ordered-list", "|",
      "link",
      {
        name: "upload-image",
        action: (editor: any) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
              const compressed = await compressImage(file);
              const blobUrl = URL.createObjectURL(compressed);
              const cm = editor.codemirror;
              const doc = cm.getDoc();
              const cursor = doc.getCursor();
              doc.replaceRange(`\n![image](${blobUrl})\n`, cursor);
            }
          };
          input.click();
        },
        className: "fa fa-image",
        title: "Insert Image",
      },
      "|",
      "preview", "side-by-side", "fullscreen", "guide"
    ] as any,
    previewRender(text: string) {
      return ReactDOMServer.renderToString(
        <div className="rich-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      );
    }
  }), []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projRes, blogRes, profRes] = await Promise.all([
        getProjects(),
        getBlogs(),
        getProfile(),
      ]);
      setProjects(projRes.data.results || []);
      setBlogs(blogRes.data.results || []);
      setProfile(profRes.data || {});
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  const ensureProtocol = (url: string) => {
    if (!url) return url;
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append('name', profile.name || '');
    payload.append('email', profile.email || '');
    payload.append('contact_no', profile.contact_no || '');
    payload.append('linkedin_url', ensureProtocol(profile.linkedin_url) || '');
    payload.append('github_url', ensureProtocol(profile.github_url) || '');
    payload.append('instagram_url', ensureProtocol(profile.instagram_url) || '');
    payload.append('summary', profile.summary || '');
    
    if (profile.cv_file_new) {
      payload.append('cv_file', profile.cv_file_new);
    }

    try {
      await api.patch('/profile/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Profile updated');
      fetchData();
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleOpenModal = async (type: 'project' | 'blog', item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    
    let initialFormData = item ? { ...item } : { title: '', headline: '', description: '', body: '', link: '' };
    if (item) {
      if (type === 'project' && item.description) {
        initialFormData.description = await convertBase64ToBlobUrls(item.description);
      } else if (type === 'blog' && item.body) {
        initialFormData.body = await convertBase64ToBlobUrls(item.body);
      }
    }
    
    setFormData(initialFormData);
    setPendingImages([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: '', headline: '', description: '', body: '', link: '' });
    setPendingImages([]);
  };

  const uploadImagesForId = async (type: 'projects' | 'blogs', id: number) => {
    for (const file of pendingImages) {
      const data = new FormData();
      data.append('image', file);
      try {
        await api.post(`/${type}/${id}/upload_image/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        console.error('Failed to upload an image', err);
      }
    }
  };

  const handleDeleteExistingImage = async (imgId: number) => {
    if (!editingItem) return;
    const type = modalType === 'project' ? 'projects' : 'blogs';
    try {
      await api.delete(`/${type}/${editingItem.id}/delete_image/${imgId}/`);
      setEditingItem({...editingItem, images: editingItem.images.filter((i:any) => i.id !== imgId)});
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleRemovePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalFormData = { ...formData };
      if (modalType === 'project') {
        finalFormData.description = await convertBlobUrlsToBase64(formData.description);
        const payload = { ...finalFormData, link: ensureProtocol(finalFormData.link) };
        if (editingItem) {
          await api.patch(`/projects/${editingItem.id}/`, payload);
          await uploadImagesForId('projects', editingItem.id);
        } else {
          const res = await createProject(payload);
          await uploadImagesForId('projects', res.data.id);
        }
      } else {
        finalFormData.body = await convertBlobUrlsToBase64(formData.body);
        if (editingItem) {
          await api.patch(`/blogs/${editingItem.id}/`, finalFormData);
          await uploadImagesForId('blogs', editingItem.id);
        } else {
          const res = await createBlog(finalFormData);
          await uploadImagesForId('blogs', res.data.id);
        }
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert('Operation failed');
    }
  };

  return (
    <div className="cms-wrapper">
      <nav>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</button>
        <button className={activeTab === 'projects' ? 'active' : ''} onClick={() => setActiveTab('projects')}>Projects</button>
        <button className={activeTab === 'blogs' ? 'active' : ''} onClick={() => setActiveTab('blogs')}>Blogs</button>
        <button className="secondary" onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>Logout</button>
      </nav>

      <div className="container">
        {activeTab === 'profile' && (
          <section>
            <h2>Profile Settings</h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Name</label>
                <input value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Contact No</label>
                <input value={profile.contact_no || ''} onChange={e => setProfile({...profile, contact_no: e.target.value})} />
              </div>
              <div className="form-group">
                <label>CV File</label>
                <input type="file" onChange={e => setProfile({...profile, cv_file_new: e.target.files?.[0]})} />
                {profile.cv_file && (
                  <small>
                    Current CV: <a href={`http://localhost:8000${profile.cv_file}`} target="_blank" rel="noreferrer">View CV</a>
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Summary (Markdown)</label>
                <SimpleMdeReact 
                  value={profile.summary || ''} 
                  onChange={val => setProfile({...profile, summary: val})} 
                  options={mdeOptions}
                />
              </div>
              <div className="form-group">
                <label>Github URL</label>
                <input value={profile.github_url || ''} onChange={e => setProfile({...profile, github_url: e.target.value})} />
              </div>
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input value={profile.linkedin_url || ''} onChange={e => setProfile({...profile, linkedin_url: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Instagram URL</label>
                <input value={profile.instagram_url || ''} onChange={e => setProfile({...profile, instagram_url: e.target.value})} />
              </div>
              <button type="submit">Save Profile</button>
            </form>
          </section>
        )}

        {activeTab === 'projects' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2>Projects</h2>
              <button onClick={() => handleOpenModal('project')}>+ Add Project</button>
            </div>
            
            <div className="grid">
              {projects.map((p: any) => (
                <div key={p.id} className="card-item">
                  <div className="card-header">
                    <h4>{p.title}</h4>
                    <div className="actions">
                      <button className="secondary sm" onClick={() => handleOpenModal('project', p)}>Edit</button>
                      <button className="secondary sm" onClick={() => deleteProject(p.id).then(fetchData)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'blogs' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2>Blog Posts</h2>
              <button onClick={() => handleOpenModal('blog')}>+ Add Post</button>
            </div>
            
            <div className="grid">
              {blogs.map((b: any) => (
                <div key={b.id} className="card-item">
                  <div className="card-header">
                    <h4>{b.headline}</h4>
                    <div className="actions">
                      <button className="secondary sm" onClick={() => handleOpenModal('blog', b)}>Edit</button>
                      <button className="secondary sm" onClick={() => deleteBlog(b.id).then(fetchData)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {isModalOpen && (
        <div className="cms-modal-overlay">
          <div className="cms-modal">
            <header>
              <h3>{editingItem ? 'Edit' : 'Add'} {modalType === 'project' ? 'Project' : 'Blog'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </header>
            <form onSubmit={handleSubmit}>
              {modalType === 'project' ? (
                <>
                  <input placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  <SimpleMdeReact value={formData.description} onChange={val => setFormData({...formData, description: val})} options={mdeOptions} />
                  <input placeholder="Link" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                </>
              ) : (
                <>
                  <input placeholder="Headline" value={formData.headline} onChange={e => setFormData({...formData, headline: e.target.value})} required />
                  <SimpleMdeReact value={formData.body} onChange={val => setFormData({...formData, body: val})} options={mdeOptions} />
                </>
              )}
              
              <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                <h4>Gallery Images (Max 5)</h4>
                <div className="image-preview-grid" style={{ marginTop: '0.5rem' }}>
                  {editingItem?.images?.map((img: any) => (
                    <div key={img.id} className="image-preview">
                      <img src={img.image_base64} alt="" />
                      <button type="button" className="del-btn" onClick={() => handleDeleteExistingImage(img.id)}>×</button>
                    </div>
                  ))}
                  {pendingImages.map((file, idx) => (
                    <div key={`pending-${idx}`} className="image-preview">
                      <img src={URL.createObjectURL(file)} alt="" />
                      <button type="button" className="del-btn" onClick={() => handleRemovePendingImage(idx)}>×</button>
                    </div>
                  ))}
                  {((editingItem?.images?.length || 0) + pendingImages.length) < 5 && (
                    <div className="image-upload-small">
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        ref={imageInputRef}
                        onChange={async e => {
                          if (e.target.files?.[0]) {
                            const compressed = await compressImage(e.target.files[0]);
                            setPendingImages([...pendingImages, compressed]);
                            e.target.value = ''; // reset
                          }
                        }} 
                      />
                      <button type="button" style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: '#e53935', cursor: 'pointer' }} onClick={() => imageInputRef.current?.click()}>
                        + Img
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
