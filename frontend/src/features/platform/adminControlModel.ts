export type AdminControlView = 'pipeline' | 'ai' | 'teams' | 'alerts' | 'operations';

export const isAdminControlView = (value: string | null): value is AdminControlView =>
  value === 'pipeline' || value === 'ai' || value === 'teams' || value === 'alerts' || value === 'operations';

export const adminControlViewLabel: Record<AdminControlView, string> = {
  pipeline: 'Service Pipeline',
  ai: 'AI And Portfolio',
  teams: 'Team Supply',
  alerts: 'Alerts',
  operations: 'Operations',
};
