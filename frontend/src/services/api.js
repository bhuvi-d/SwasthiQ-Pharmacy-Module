import axios from 'axios';

const api = axios.create({
    baseURL: 'https://swasthiq-pharmacy-module.onrender.com',
});

export default api;
