import { searchRAG } from './rag.js';
import { getProjects, getActiveProjectId } from './storage.js';

let chatHistory = []; 

export function initChat(token) {
    // Bind the Enter key to send messages
    document.getElementById("message-input").addEventListener("keypress", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage(token);
        }
    });

    // Bind the Send button
    document.getElementById("send-btn").addEventListener("click", () => {
        sendMessage(token);
    });
}

async function sendMessage(token) {
    const inputEl = document.getElementById('message-input');
    const message = inputEl.value.trim();
    if (!message) return;

    const model = document.getElementById('model-select').value;
    const chatBox = document.getElementById('chat-box');

    // Add User Message to UI
    if (chatHistory.length === 0) chatBox.innerHTML = ''; 
    
    chatBox.innerHTML += `
            <div class="flex justify-end animate-fade-in-up">
                <div class="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[75%] text-[15px] leading-relaxed shadow-md shadow-blue-500/20">
                    ${message}
                </div>
            </div>
        `;
    
    inputEl.value = ''; 
    chatBox.scrollTop = chatBox.scrollHeight; 

    // Add User Message to History Array
    chatHistory.push({ role: "user", content: message });
    // --- RAG INJECTION LOGIC ---
        // 1. Get the current active project's sources
        const activeId = await getActiveProjectId();
        const projects = await getProjects();
        const activeProject = projects.find(p => p.id === activeId);
        
        let messagesToSend = [...chatHistory]; // Copy history so we don't mess up the UI array

        if (activeProject && activeProject.sources.length > 0) {
            // 2. Search notes for relevance
            const context = searchRAG(message, activeProject.sources);
            
            if (context) {
                // 3. Inject context secretly as a system prompt just for this specific API call
                messagesToSend.unshift({
                    role: "system",
                    content: `You are Olva, a study assistant. Use the following user notes to answer their question. If the answer is not in the notes, use your own knowledge but clarify that.\n\nUSER NOTES:\n${context}`
                });
            }
        }
        // --- END RAG LOGIC ---

    // Create Placeholder for AI Message
    const aiMessageId = 'ai-msg-' + Date.now();
    chatBox.innerHTML += `
            <div class="flex justify-start animate-fade-in-up">
                <div id="${aiMessageId}" class="bg-white border border-slate-200 text-slate-800 px-5 py-4 rounded-2xl rounded-tl-sm max-w-[95%] md:max-w-[85%] text-[15px] prose prose-slate shadow-sm">
                    <span class="flex items-center gap-2 text-slate-400">
                        <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Thinking...
                    </span>
                </div>
            </div>
        `;
    chatBox.scrollTop = chatBox.scrollHeight;

    // Fetch from Backend (Streaming)
    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ messages: messagesToSend, model: model })
        });

        if (!response.ok) throw new Error("API Error");

        const aiContainer = document.getElementById(aiMessageId);
        aiContainer.innerHTML = ''; 
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let aiFullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        if (data.choices[0].delta.content) {
                            aiFullResponse += data.choices[0].delta.content;
                            aiContainer.innerHTML = marked.parse(aiFullResponse); 
                            chatBox.scrollTop = chatBox.scrollHeight;
                        }
                    } catch (e) { /* Ignore incomplete chunks */ }
                }
            }
        }

        // Save AI response to history
        chatHistory.push({ role: "assistant", content: aiFullResponse });

    } catch (error) {
        console.error(error);
        document.getElementById(aiMessageId).innerHTML = '<span class="text-red-500">Error connecting to AI. Please try again.</span>';
    }
}