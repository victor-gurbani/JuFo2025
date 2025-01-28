import axios from "axios";

const api = axios.create({
  baseURL: "http://oraclevarfield.sytes.net:3000" // point to your backend
});

export default api;