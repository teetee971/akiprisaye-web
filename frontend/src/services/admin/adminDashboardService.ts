import { adminFetchJson } from './adminApiClient';

export interface AdminDashboardActivity {
  id: string;
  type: 'store' | 'product' | 'price';
  entityName: string;
  details: string;
  occurredAt: string;
  route: string;
  territory?: string;
}

export interface AdminDashboardOverview {
  stats: {
    storesCount: number;
    productsCount: number;
    pricesCount: number;
    territoriesCount: number;
  };
  activities: AdminDashboardActivity[];
}

export async function getAdminDashboardOverview(params: {
  period: '24h' | '7d' | '30d';
  territory: string;
}): Promise<AdminDashboardOverview> {
  const query = new URLSearchParams({
    period: params.period,
    territory: params.territory,
  });

  return adminFetchJson(`/admin/dashboard/overview?${query}`);
}
