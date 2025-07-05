
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ChatIALocal from './components/ChatIALocal';
import ScanOCR from './pages/ScanOCR';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/chat' element={<ChatIALocal />} />
        <Route path='/scan' element={<ScanOCR />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
