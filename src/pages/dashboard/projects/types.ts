export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface ProgressLog {
  date: string;
  description: string;
  progress: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  client_id: string | null;
  address: string;
  project_type: string;
  value: number;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'on_hold';
  progress: number;
  progress_logs?: ProgressLog[];
  workers?: string[];
  notes?: string[];
  owner_id: string;
  created_at: string;
  files?: Array<{
    id: string;
    file_name: string;
    file_url: string;
  }>;
}