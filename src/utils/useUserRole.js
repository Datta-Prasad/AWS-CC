import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export function useUserRole() {
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function getUserRole() {
      try {
        // Read Cognito group membership exclusively from token payload (JWT cognito:groups claim)
        const session = await fetchAuthSession().catch(() => null);
        const groups = session?.tokens?.accessToken?.payload?.['cognito:groups'] || [];
        
        let detectedRole = null;
        if (groups.includes('Admin')) {
          detectedRole = 'Admin';
        } else if (groups.includes('DeliveryBoy')) {
          detectedRole = 'DeliveryBoy';
        } else if (groups.includes('Customer')) {
          detectedRole = 'Customer';
        }

        // Single source of truth: server-managed Cognito groups
        if (isMounted) {
          setRole(detectedRole || 'Customer');
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        if (isMounted) {
          setRole('Customer');
        }
      } finally {
        if (isMounted) {
          setLoadingRole(false);
        }
      }
    }

    getUserRole();

    return () => {
      isMounted = false;
    };
  }, []);

  return { role, loadingRole };
}
