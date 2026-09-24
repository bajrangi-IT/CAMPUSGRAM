import { College } from '@/types/database.types';

export const RECOGNIZED_COLLEGES: College[] = [
  {
    id: 'col-iitb',
    name: 'Indian Institute of Technology, Bombay (IIT Bombay)',
    logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&auto=format&fit=crop&q=80',
    domain: 'iitb.ac.in',
    description: 'Premier engineering, research, and technical institute in Powai, Mumbai.',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'col-iitd',
    name: 'Indian Institute of Technology, Delhi (IIT Delhi)',
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&auto=format&fit=crop&q=80',
    domain: 'iitd.ac.in',
    description: 'Autonomous public technical university located in Hauz Khas, New Delhi.',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'col-bits',
    name: 'BITS Pilani (Birla Institute of Technology and Science)',
    logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&auto=format&fit=crop&q=80',
    domain: 'pilani.bits-pilani.ac.in',
    description: 'Higher education institute deemed to be university under UGC, Pilani.',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'col-du',
    name: 'University of Delhi (DU)',
    logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=128&auto=format&fit=crop&q=80',
    domain: 'du.ac.in',
    description: 'Collegiate public central university in New Delhi, founded in 1922.',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'col-nitt',
    name: 'National Institute of Technology, Tiruchirappalli (NIT Trichy)',
    logo: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=128&auto=format&fit=crop&q=80',
    domain: 'nitt.edu',
    description: 'Top-ranked National Institute of Technology located in Tamil Nadu.',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'col-iitm',
    name: 'Indian Institute of Technology, Madras (IIT Madras)',
    logo: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=128&auto=format&fit=crop&q=80',
    domain: 'iitm.ac.in',
    description: 'National institute of technical education and research in Chennai.',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
];

const STORAGE_KEY = 'campusgram_colleges_list';

export function getAllColleges(): College[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(RECOGNIZED_COLLEGES));
      return RECOGNIZED_COLLEGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : RECOGNIZED_COLLEGES;
  } catch {
    return RECOGNIZED_COLLEGES;
  }
}

export function registerNewCollege(name: string, domain?: string): College {
  const all = getAllColleges();
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
  const id = `col-${slug}-${Date.now().toString().slice(-4)}`;

  const newCollege: College = {
    id,
    name: name.trim(),
    logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&auto=format&fit=crop&q=80',
    domain: domain || `${slug}.edu`,
    description: `Private Campus Network for ${name.trim()}.`,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = [...all, newCollege];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save colleges:', e);
  }
  return newCollege;
}

export function getCollegeById(id?: string | null): College {
  if (!id) return RECOGNIZED_COLLEGES[0];
  const all = getAllColleges();
  return all.find((c) => c.id === id) || RECOGNIZED_COLLEGES[0];
}
