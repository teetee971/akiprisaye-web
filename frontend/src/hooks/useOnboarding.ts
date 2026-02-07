import { useState, useCallback } from 'react';

const ONBOARDING_KEY = 'akiprisaye_onboarding_completed';

export const useOnboarding = () => {
  const [isRunning, setIsRunning] = useState(false);

  const isCompleted = useCallback(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  }, []);

  const startTour = useCallback(() => {
    setIsRunning(true);
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsRunning(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
  }, []);

  return {
    isRunning,
    isCompleted: isCompleted(),
    startTour,
    completeTour,
    resetTour,
    setIsRunning,
  };
};

export default useOnboarding;
