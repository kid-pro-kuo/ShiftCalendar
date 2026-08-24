import { Platform, Alert } from 'react-native';

if (Platform.OS === 'web') {
  let isAlertActive = false;

  Alert.alert = (title, message, buttons) => {
    if (isAlertActive) return;
    isAlertActive = true;

    try {
      if (buttons && buttons.length > 0) {
        const cancelBtn = buttons.find(b => b.style === 'cancel' || b.text?.toLowerCase() === 'cancel');
        const actionBtn = buttons.find(b => b !== cancelBtn) || buttons[0];

        const confirmed = window.confirm(`${title || ''}${message ? '\n\n' + message : ''}`);
        if (confirmed) {
          if (actionBtn && typeof actionBtn.onPress === 'function') {
            actionBtn.onPress();
          }
        } else {
          if (cancelBtn && typeof cancelBtn.onPress === 'function') {
            cancelBtn.onPress();
          }
        }
      } else {
        window.alert(`${title || ''}${message ? '\n\n' + message : ''}`);
      }
    } finally {
      setTimeout(() => {
        isAlertActive = false;
      }, 200);
    }
  };
}

if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./widgets/widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

import 'expo-router/entry';


