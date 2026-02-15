import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { consumeGuestQuota, consumeUserQuota, getGuestQuotaStatus, QuotaStatus } from '../services/freemium';
import { usePlan } from './usePlan';

const initialGuest = getGuestQuotaStatus();

export function useQuota() {
  const { user } = useAuth();
  const { plan } = usePlan();
  const [status, setStatus] = useState<QuotaStatus>(initialGuest);

  const refreshGuest = () => setStatus(getGuestQuotaStatus());

  const consume = async () => {
    if (!user) {
      const next = consumeGuestQuota();
      setStatus(next);
      return next;
    }
    const next = await consumeUserQuota(user.uid, plan);
    setStatus(next);
    return next;
  };

  const effective = useMemo(() => {
    if (user) return status;
    return getGuestQuotaStatus();
  }, [status, user]);

  return { status: effective, consume, refreshGuest };
}
