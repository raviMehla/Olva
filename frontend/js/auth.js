// js/auth.js

export function initAuth() {
    // 1. Check the URL for the token
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    // 2. If it's in the URL, save it to the browser and clean the URL
    if (urlToken) {
        localStorage.setItem('olva_token', urlToken);
        window.history.replaceState({}, document.title, "/app.html"); 
    }

    // 3. Check if we have a token saved
    const token = localStorage.getItem('olva_token');

    if (!token) {
        window.location.href = '/';
        return null;
    }

    // 4. Decode the JWT safely
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        document.getElementById('user-name').innerText = payload.name;
        
        return token; // Return the token so other modules can use it
    } catch (e) {
        console.error("Token parsing failed:", e);
        logout();
        return null;
    }
}

export function logout() {
    localStorage.removeItem('olva_token');
    window.location.href = '/';
}