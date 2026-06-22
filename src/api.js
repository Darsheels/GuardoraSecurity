import axios from "axios"
const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

if (!localStorage.getItem("sessionId")) {
    localStorage.setItem("sessionId", crypto.randomUUID());
}

const api = axios.create({ 
    baseURL,
    headers: {
        "X-Session-ID": localStorage.getItem("sessionId")
    }
});

export default api;