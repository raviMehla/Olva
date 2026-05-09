
import { getProjects, saveProjects, getActiveProjectId, setActiveProjectId } from './storage.js';
import { chunkText, searchRAG } from './rag.js';
let projects = [];
let activeProjectId = null;

export async function initProjects() {
    // Load data from IndexedDB
    projects = await getProjects();
    activeProjectId = await getActiveProjectId();

    // If no projects exist, create a default one
    if (projects.length === 0) {
        const defaultProject = {
            id: 'proj_' + Date.now(),
            name: 'General Study',
            sources: [], // This will hold your Markdown files later
            messages: [] // This will hold the chat history
        };
        projects.push(defaultProject);
        activeProjectId = defaultProject.id;
        await saveProjects(projects);
        await setActiveProjectId(activeProjectId);
    }

    // Bind the "New Project" button
    document.getElementById('new-project-btn').addEventListener('click', createNewProject);

    // Render the sidebar
    renderProjectList();
}

async function createNewProject() {
    if (projects.length >= 10) {
        alert("Production Limit: You can only have 10 active projects. Please delete one to create another.");
        return;
    }

    const projectName = prompt("Enter project name (e.g., 'Modern History', 'Maths Mocks'):");
    if (!projectName || projectName.trim() === '') return;

    const newProject = {
        id: 'proj_' + Date.now(),
        name: projectName.trim(),
        sources: [],
        messages: []
    };

    projects.push(newProject);
    activeProjectId = newProject.id;
    
    // Save to database and update UI
    await saveProjects(projects);
    await setActiveProjectId(activeProjectId);
    renderProjectList();
    
    // TODO: Clear the chat UI so it's fresh for the new project
    document.getElementById('chat-box').innerHTML = '<div class="text-center text-slate-400 text-sm mt-10 font-medium">Start a new conversation.</div>';
}

function renderProjectList() {
    const listContainer = document.getElementById('project-list');
    listContainer.innerHTML = '';

    projects.forEach(project => {
        const isActive = project.id === activeProjectId;
        
        // Create the button for each project
        const btn = document.createElement('button');
        btn.className = `w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`;
        
        btn.innerHTML = `
            <svg class="w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
            <span class="truncate">${project.name}</span>
        `;

        // When clicked, switch active project
        btn.onclick = async () => {
            activeProjectId = project.id;
            await setActiveProjectId(activeProjectId);
            renderProjectList();
            
            // TODO: Load the chat history for this specific project into the UI
            alert(`Switched to: ${project.name}`); // Temporary alert to prove it works
        };

        listContainer.appendChild(btn);
    });
}

// Add this at the bottom of the file
export function initFileUpload() {
    const fileInput = document.getElementById('file-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const statusText = document.getElementById('upload-status');

    // Clicking paperclip opens the hidden file input
    uploadBtn.addEventListener('click', () => fileInput.click());

    // When a file is selected...
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const rawText = event.target.result;
            
            // 1. Chunk the text
            const chunks = chunkText(rawText, file.name);
            
            // 2. Add to active project
            projects = await getProjects();
            activeProjectId = await getActiveProjectId();
            
            const projectIndex = projects.findIndex(p => p.id === activeProjectId);
            if (projectIndex !== -1) {
                // Merge new chunks with existing sources
                projects[projectIndex].sources = [...projects[projectIndex].sources, ...chunks];
                await saveProjects(projects);
                
                // Show success message
                statusText.classList.remove('hidden');
                setTimeout(() => statusText.classList.add('hidden'), 3000);
            }
        };
        reader.readAsText(file);
    });
}