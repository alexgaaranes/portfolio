import { useEffect, useState, useMemo, useRef } from 'react';
import { getProjects, getBlogs, getProfile } from './api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Modal from './components/Modal';
import Card from './components/Card';
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaGithub, FaLinkedin, FaInstagram, FaEnvelope, FaPhone, FaChevronLeft, FaChevronRight, FaImage, FaSun, FaMoon } from 'react-icons/fa';
import { motion, useScroll, useTransform, useMotionTemplate, AnimatePresence } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const CarouselCard = ({ item, isActive, index, openModal }: any) => {
  const swiper = useSwiper();
  const isLeft = swiper ? index < swiper.activeIndex : false;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Card 
        isActive={isActive} 
        onClick={() => {
          if (isActive) openModal(item);
        }}
      >
        {item.images?.[0] ? (
          <img src={item.images[0].image_base64} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem', pointerEvents: 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '180px', backgroundColor: 'var(--placeholder-bg)', borderRadius: '4px', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
            <FaImage style={{ fontSize: '3rem', color: 'var(--placeholder-icon)' }} />
          </div>
        )}
        <h3>{item.title || item.headline}</h3>
        <div className="excerpt-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {item.description || item.body || ''}
          </ReactMarkdown>
        </div>
      </Card>
      
      {!isActive && swiper && (
        <div 
          className={`slide-overlay ${isLeft ? 'left-overlay' : 'right-overlay'}`} 
          onClick={(e) => {
            e.stopPropagation();
            swiper.slideTo(index);
          }}
        >
          {isLeft ? <FaChevronLeft className="nav-arrow" /> : <FaChevronRight className="nav-arrow" />}
        </div>
      )}
    </div>
  );
};

function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [activeBlogIndex, setActiveBlogIndex] = useState(0);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [transitioningTheme, setTransitioningTheme] = useState<string | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTransitioningTheme(nextTheme);
    
    setTimeout(() => {
      setTheme(nextTheme);
    }, 300);

    setTimeout(() => {
      setTransitioningTheme(null);
    }, 1000);
  };

  const { scrollY } = useScroll();
  const headerHeight = useTransform(scrollY, [0, 50], ["120px", "70px"]);
  const headerPadding = useTransform(scrollY, [0, 50], ["2rem 0", "0.5rem 2rem"]);
  const nameSize = useTransform(scrollY, [0, 50], ["2.5rem", "1.5rem"]);

  const bgOpacity = useTransform(scrollY, [0, 50], [0, 0.95]);
  const headerBgColor = theme === 'light' ? '255, 255, 255' : '30, 30, 30';
  const dynamicHeaderBg = useMotionTemplate`rgba(${headerBgColor}, ${bgOpacity})`;

  const borderOpacity = useTransform(scrollY, [0, 50], [0, 0.1]);
  const borderColor = theme === 'light' ? '0, 0, 0' : '255, 255, 255';
  const dynamicHeaderBorder = useMotionTemplate`1px solid rgba(${borderColor}, ${borderOpacity})`;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projRes, blogRes, profRes] = await Promise.all([
          getProjects(),
          getBlogs(),
          getProfile()
        ]);
        setProjects(projRes.data || []);
        setBlogs(blogRes.data || []);
        setProfile(profRes.data || null);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Failed to connect to backend. Make sure the server is running at http://localhost:8000");
      }
    };
    loadData();
  }, []);

  const openModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const lastUpdated = useMemo(() => {
    const dates = [
      ...projects.map((p: any) => new Date(p.created_at)),
      ...blogs.map((b: any) => new Date(b.created_at))
    ].filter(d => !isNaN(d.getTime()))
     .sort((a, b) => b.getTime() - a.getTime());
    return dates.length > 0 ? dates[0].toLocaleDateString() : new Date().toLocaleDateString();
  }, [projects, blogs]);

  if (error) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
      <h2 style={{ color: '#e53935' }}>{error}</h2>
      <p>Check the backend terminal for errors.</p>
    </div>
  );

  if (!profile) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
      <h2>Loading Portfolio...</h2>
    </div>
  );

  return (
    <div className="portfolio-wrapper" style={{ paddingTop: '130px' }}>
      <AnimatePresence>
        {transitioningTheme && (
          <motion.div
            key="theme-transition"
            className="theme-transition-overlay"
            initial={{ clipPath: `circle(0% at ${toggleBtnRef.current?.getBoundingClientRect().left || 50}px ${toggleBtnRef.current?.getBoundingClientRect().top || 50}px)` }}
            animate={{ clipPath: `circle(150% at ${toggleBtnRef.current?.getBoundingClientRect().left || 50}px ${toggleBtnRef.current?.getBoundingClientRect().top || 50}px)` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{ 
              backgroundColor: transitioningTheme === 'light' ? '#f5f5f5' : '#121212',
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              pointerEvents: 'none'
            }}
          />
        )}
      </AnimatePresence>

      <motion.header
        style={{
          height: headerHeight,
          padding: headerPadding,
          background: dynamicHeaderBg,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          borderBottom: dynamicHeaderBorder
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 2rem' }}>
          <motion.h1 style={{ fontSize: nameSize, margin: 0, border: 'none', padding: 0, color: 'var(--text-color)' }}>
            {profile.name}
          </motion.h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="social-links" style={{ fontSize: '1.5rem', display: 'flex', gap: '1rem' }}>
              {profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer"><FaGithub /></a>}
              {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer"><FaLinkedin /></a>}
              {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noreferrer"><FaInstagram /></a>}
            </div>
            {profile.cv_file && (
              <a href={`http://localhost:8000${profile.cv_file}`} download className="cv-download" style={{ border: '1px solid #e53935', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Download CV
              </a>
            )}
            <button 
              ref={toggleBtnRef}
              onClick={toggleTheme} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem' }}
              title="Toggle Light/Dark Mode"
            >
              {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </div>
      </motion.header>

      <div className="container">
        <div className="contact-info" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit' }}><FaEnvelope /> {profile.email}</a>
          <a href={`tel:${profile.contact_no}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit' }}><FaPhone /> {profile.contact_no}</a>
        </div>

        {profile.summary && (
          <section>
            <div className="section-divider" />
            <div className="rich-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{profile.summary}</ReactMarkdown>
            </div>
          </section>
        )}
        <section>
          <div className="section-divider" />
          <h2>Projects</h2>
          {projects.length === 0 ? <p style={{ opacity: 0.5 }}>No projects added yet.</p> : (
            <Swiper
              className="list-carousel"
              modules={[Autoplay]}
              spaceBetween={30}
              slidesPerView={'auto'}
              centeredSlides={true}
              onSlideChange={(swiper) => setActiveProjectIndex(swiper.activeIndex)}
            >
              {projects.map((project: any, index: number) => (
                <SwiperSlide key={project.id} data-id={project.id}>
                  {({ isActive }) => (
                    <CarouselCard 
                      item={project} 
                      isActive={isActive} 
                      index={index} 
                      openModal={openModal} 
                    />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>

        <section>
          <div className="section-divider" />
          <h2>Blog</h2>
          {blogs.length === 0 ? <p style={{ opacity: 0.5 }}>No blog posts yet.</p> : (
            <Swiper
              className="list-carousel"
              modules={[Autoplay]}
              spaceBetween={30}
              slidesPerView={'auto'}
              centeredSlides={true}
              onSlideChange={(swiper) => setActiveBlogIndex(swiper.activeIndex)}
            >
              {blogs.map((blog: any, index: number) => (
                <SwiperSlide key={blog.id} data-id={blog.id}>
                  {({ isActive }) => (
                    <CarouselCard 
                      item={blog} 
                      isActive={isActive} 
                      index={index} 
                      openModal={openModal} 
                    />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>
      </div>

      <footer className="portfolio-footer">
        <div className="footer-socials">
          {profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer"><FaGithub /></a>}
          {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer"><FaLinkedin /></a>}
          {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noreferrer"><FaInstagram /></a>}
        </div>
        <p style={{ margin: 0, opacity: 0.5, fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} {profile.name}. All rights reserved. <br/>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Last Updated: {lastUpdated}</span>
        </p>
      </footer>

      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <div className="modal-inner">
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    navigation
                    pagination={{ clickable: true }}
                    loop={true}
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    spaceBetween={30}
                    slidesPerView={1}
                  >
                    {selectedItem.images.map((img: any, idx: number) => (
                      <SwiperSlide key={img.id || idx}>
                        <img src={img.image_base64} alt="" style={{ width: '100%', height: '400px', objectFit: 'contain' }} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
              <h2>{selectedItem.title || selectedItem.headline}</h2>
              <div className="rich-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedItem.description || selectedItem.body}
                </ReactMarkdown>
              </div>
              {selectedItem.link && (
                <a href={selectedItem.link} target="_blank" rel="noreferrer" className="btn" style={{ display: 'inline-block', marginTop: '2rem', border: '1px solid #e53935', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                  Visit Link &rarr;
                </a>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Portfolio;
