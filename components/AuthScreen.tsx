import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/AuthContext';
import { useAppSettings } from '../hooks/ThemeContext';
import * as Haptics from 'expo-haptics';

export function AuthScreen() {
  const { colors, isDark } = useAppSettings();
  const { login, isForcedPasswordChange, forceSetNewPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Please enter your passcode.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError('');
    const success = await login(password);
    if (!success) {
      setError('Incorrect passcode. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPassword('');
    }
  };

  const handleForceChange = async () => {
    const pTrim = newPassword.trim();
    if (!pTrim) {
      setError('Password cannot be empty.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (pTrim.length < 4) {
      setError('Passcode must be at least 4 characters long.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (pTrim.toLowerCase() === 'admin') {
      setError('For security, passcode cannot be the default "admin".');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passcodes do not match.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError('');
    const success = await forceSetNewPassword(newPassword);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError('Something went wrong. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!isForcedPasswordChange ? (
          // LOGIN MODE
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="lock-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Unlock ShiftCalendar</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your passcode to access your shift schedule.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                placeholder="Passcode"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel="Toggle passcode visibility"
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Unlock</Text>
            </TouchableOpacity>

            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Hint: The default passcode is <Text style={{ fontWeight: '700' }}>admin</Text>
            </Text>
          </View>
        ) : (
          // FORCED CHANGE PASSWORD MODE
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.noteAccent + '15' }]}>
              <MaterialCommunityIcons name="shield-key-outline" size={48} color={colors.noteAccent} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Secure Your Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              You must set a new passcode to replace the default password before proceeding.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                placeholder="New Passcode"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  setError('');
                }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowNewPassword(!showNewPassword)}
                accessibilityLabel="Toggle new passcode visibility"
              >
                <MaterialCommunityIcons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { marginTop: 12 }]}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                placeholder="Confirm New Passcode"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setError('');
                }}
                onSubmitEditing={handleForceChange}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                accessibilityLabel="Toggle confirm passcode visibility"
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleForceChange}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Save & Unlock</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 48,
    fontSize: 16,
    fontWeight: '600',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 16,
    padding: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 12,
    marginTop: 18,
    textAlign: 'center',
  },
});
