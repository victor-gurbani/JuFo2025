import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000" // point to your backend
});

export default api;