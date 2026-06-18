import AxiosInstance from '../AxiosInstance';

export interface DoctorDashboardStats {
  ecgsToday: number;
  pendingReviews: number;
  criticalAlerts: number;
  totalPatients: number;
}

export const dashboardService = {
  async getDoctorStats(): Promise<DoctorDashboardStats> {
    const res = await AxiosInstance.get('/api/dashboard/stats');
    const payload = res.data?.data ?? res.data;
    return {
      ecgsToday: payload.ecgsToday ?? 0,
      pendingReviews: payload.pendingReviews ?? 0,
      criticalAlerts: payload.criticalAlerts ?? 0,
      totalPatients: payload.totalPatients ?? 0,
    };
  },
};
