/**
 * Utility for haptic feedback using the Vibration API
 */
export const hapticFeedback = (type = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'success':
        navigator.vibrate([10, 30, 10]);
        break;
      case 'error':
        navigator.vibrate([50, 50, 50]);
        break;
      default:
        navigator.vibrate(10);
    }
  }
};
