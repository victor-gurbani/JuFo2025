import axios from "axios";

const api = axios.create({
  baseURL: "https://accesscontrol.jufo.varfield.com"
});

export default api;
