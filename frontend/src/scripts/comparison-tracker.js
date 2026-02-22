const ComparisonTracker = {
  KEYS: {
    COUNT: 'akp_comparisons_count',
    MESSAGE_SHOWN: 'akp_3x_message_shown',
    FIRST_COMPARISON_DATE: 'akp_first_comparison_date',
  },

  track() {
    try {
      const current = Number(localStorage.getItem(this.KEYS.COUNT) || '0');
      const next = current + 1;
      localStorage.setItem(this.KEYS.COUNT, String(next));

      if (!localStorage.getItem(this.KEYS.FIRST_COMPARISON_DATE)) {
        localStorage.setItem(this.KEYS.FIRST_COMPARISON_DATE, new Date().toISOString());
      }

      return { count: next, shouldShowMessage: next >= 3 && !this.isMessageShown() };
    } catch {
      return { count: 0, shouldShowMessage: false };
    }
  },

  isMessageShown() {
    return localStorage.getItem(this.KEYS.MESSAGE_SHOWN) === '1';
  },

  markMessageShown() {
    localStorage.setItem(this.KEYS.MESSAGE_SHOWN, '1');
  },

  reset() {
    Object.values(this.KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

export default ComparisonTracker;
