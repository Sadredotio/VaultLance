import toast from 'react-hot-toast';

const baseStyle = {
  borderRadius: '12px',
  fontWeight: 'bold',
  padding: '16px'
};

export const showToasts = {
  success: (message) => {
    toast.success(message, {
      icon: '✅',
      style: {
        ...baseStyle,
        background: '#10b981',
        color: '#fff'
      }
    });
  },

  error: (message, duration = 4000) => {
    toast.error(message, {
      icon: '❌',
      style: {
        ...baseStyle,
        background: '#ef4444',
        color: '#fff'
      },
      duration
    });
  },

  warning: (message, duration = 4000) => {
    toast.error(message, {
      icon: '⚠️',
      style: {
        ...baseStyle,
        background: '#f59e0b',
        color: '#fff'
      },
      duration
    });
  },

  alreadyExists: (duration = 4000) => {
    toast.error('📧 This email is already registered. Try logging in instead!', {
      icon: '⚠️',
      style: {
        ...baseStyle,
        background: '#f59e0b',
        color: '#fff'
      },
      duration
    });
  }
};

export default showToasts;
