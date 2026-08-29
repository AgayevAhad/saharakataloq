import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { ThemeColors } from '../types/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  visible: boolean;
  theme: ThemeColors;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', visible, theme }) => {
  if (!visible) return null;

  return (
    <View style={styles.toastContainer}>
      <View
        style={[
          styles.toastBody,
          {
            backgroundColor: theme.mode === 'dark' ? '#0f172a' : '#ffffff',
            borderColor: theme.mode === 'dark' ? '#334155' : '#e2e8f0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
          },
        ]}
      >
        {type === 'success' ? (
          <CheckCircle2 size={18} color="#16a34a" />
        ) : (
          <AlertCircle size={18} color={theme.primary} />
        )}
        <Text style={[styles.toastText, { color: theme.text }]}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'fixed' as any,
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  toastBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
