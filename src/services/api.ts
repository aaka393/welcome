import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // This would be your actual API base URL
  timeout: 10000,
});

// Mock data for development
export const availablePujaris = [
  {
    id: '1',
    name: 'Pandit Raghunath',
    tagline: 'Chants in Sanskrit & Hindi',
    image: '/images/priest4.png',
    language: 'Hindi',
    specialization: ['Ganesh Chaturthi', 'Satyanarayana Puja']
  },
  {
    id: '2',
    name: 'Pandit Venkatesh',
    tagline: 'Chants in Telugu & Sanskrit',
    image: '/images/priest1.png',
    language: 'Telugu',
    specialization: ['Lakshmi Puja', 'Satyanarayana Puja']
  },
  {
    id: '3',
    name: 'Pandit Murugan',
    tagline: 'Chants in Tamil & Sanskrit',
    image: '/images/priest2.png',
    language: 'Tamil',
    specialization: ['Ganesh Chaturthi', 'Lakshmi Puja']
  },
  {
    id: '4',
    name: 'Pandit Krishnamurthy',
    tagline: 'Traditional Vedic Chants',
    image: '/images/priest3.png',
    language: 'Sanskrit',
    specialization: ['Ganesh Chaturthi', 'Satyanarayana Puja', 'Lakshmi Puja']
  },  {
    id: '5',
    name: 'Pandit Sharma',
    tagline: 'Traditional Vedic Chants',
    image: '/images/priest5.png',
    language: 'Sanskrit',
    specialization: ['Ganesh Chaturthi', 'Satyanarayana Puja', 'Lakshmi Puja']
  }
];


export default api;