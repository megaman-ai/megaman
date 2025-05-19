// filepath: /Users/zhengxu/workspace/megaman.ai/megaman/src/components/Header.jsx
import React from 'react';
import iconImage from '../assets/icon.png';
import '../App.css';

const Header = ({ title = 'Megaman' }) => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <img src={iconImage} alt="Megaman AI Logo" className="header-logo" />
          <h1>{title}</h1>
        </div>
        <div className="header-right">
          {/* Add additional header items here if needed */}
        </div>
      </div>
    </header>
  );
};

export default Header;