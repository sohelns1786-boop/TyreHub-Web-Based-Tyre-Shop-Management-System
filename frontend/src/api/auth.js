import api from './axios';

export const loginAdmin = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerAdmin = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const googleLogin = async (email, name) => {
  const response = await api.post('/auth/google-login', { email, name });
  return response.data;
};
