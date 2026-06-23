import axios from 'axios'

const PROD_API = 'https://groomgo-salon-bookinghttps-github-com.onrender.com/api'
const DEV_API  = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: import.meta.env.PROD ? PROD_API : DEV_API,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gg_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — redirect to home on token expiry
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gg_token')
      localStorage.removeItem('gg_user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api
