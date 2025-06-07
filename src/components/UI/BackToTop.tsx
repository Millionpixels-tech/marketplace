import React, { useState, useEffect } from 'react';

const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 400px
      if (window.pageYOffset > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl"
      style={{
        backgroundColor: '#72b01d',
        color: '#ffffff'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#3f7d20';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#72b01d';
      }}
      aria-label="Back to top"
    >
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path 
          stroke="currentColor" 
          strokeWidth="2" 
          d="M12 19V5M5 12l7-7 7 7" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default BackToTop;
