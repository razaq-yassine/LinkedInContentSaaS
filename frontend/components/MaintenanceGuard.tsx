'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { MaintenanceBanner } from './MaintenanceBanner';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const router = useRouter();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/settings`
        );
        const data = response.data;
        const isMaintenanceMode = data.maintenance_mode === 'true' || data.maintenance_mode === true;
        
        if (isMaintenanceMode) {
          setMaintenanceMode(true);
          setMaintenanceMessage(data.maintenance_message || '');
          // Clear user session when maintenance mode is active
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();
    
    // Check maintenance status periodically (every 30 seconds)
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (maintenanceMode) {
    return <MaintenanceBanner message={maintenanceMessage} variant="fullpage" />;
  }

  return <>{children}</>;
}
