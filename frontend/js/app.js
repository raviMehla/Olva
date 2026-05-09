

import { initAuth, logout } from './auth.js';
import { initChat } from './chat.js';
import { initProjects, initFileUpload } from './projects.js';

const token = initAuth();

if (token) {
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Initialize the Projects Sidebar FIRST
    initProjects().then(() => {
        initFileUpload();
        initChat(token);
    });
}