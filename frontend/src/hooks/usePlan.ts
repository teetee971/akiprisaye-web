import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plan, getOrCreateUserPlan } from '../services/freemium';

export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setPlan('free');
      return;
    }
    setLoading(true);
    getOrCreateUserPlan(user.uid)
      .then((next) => {
        if (mounted) setPlan(next);
      })
      .catch(() => {
        if (mounted) setPlan('free');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  return { plan, loading, isPro: plan === 'pro' };
}
