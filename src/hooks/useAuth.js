// hooks/useAuthApi.js
import { useAuthContext } from './AuthContext';

export const useAuthApi = () => {
  const { authFetch } = useAuthContext();

  const get = (url) => authFetch(url, { method: 'GET' });
  
  const post = (url, data) => 
    authFetch(url, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  
  const put = (url, data) => 
    authFetch(url, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
  
  const del = (url) => authFetch(url, { method: 'DELETE' });

  return {
    get,
    post,
    put,
    delete: del,
    authFetch // Direct access to the fetch function
  };
};