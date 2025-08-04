// frontend/src/utils/api.ts
import axios from 'axios';

const API_BASE = 'https://job-tracker-dashboard-cuhe.onrender.com';

export default axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});
