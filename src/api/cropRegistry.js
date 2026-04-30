import { apiFetch } from './client';

export async function fetchCropRegistry() {
  const res = await apiFetch('/api/crop-registry');
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch crop registry');
  return json.data;
}
