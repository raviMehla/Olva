// js/storage.js

// Initialize the IndexedDB store specifically for Olva
localforage.config({
    name: 'OlvaVault',
    storeName: 'projects'
});

export async function getProjects() {
    try {
        const projects = await localforage.getItem('olva_projects');
        return projects || []; // Return empty array if no projects exist yet
    } catch (err) {
        console.error("Error loading projects:", err);
        return [];
    }
}

export async function saveProjects(projectsArray) {
    try {
        await localforage.setItem('olva_projects', projectsArray);
    } catch (err) {
        console.error("Error saving projects:", err);
    }
}

export async function getActiveProjectId() {
    return await localforage.getItem('olva_active_project_id');
}

export async function setActiveProjectId(id) {
    await localforage.setItem('olva_active_project_id', id);
}