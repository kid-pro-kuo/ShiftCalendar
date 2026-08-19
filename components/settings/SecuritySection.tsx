import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/AuthContext';
import * as Haptics from 'expo-haptics';

type Props = {
  colors: any;
};

export function SecuritySection({ colors }: Props) {
  const { changePassword, logout } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMsg('All fields are required.');
      setSuccessMsg('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMsg('New passcode must be at least 4 characters long.');
      setSuccessMsg('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (newPassword.trim().toLowerCase() === 'admin') {
      setErrorMsg('For security, you cannot change the passcode to "admin".');
      setSuccessMsg('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passcodes do not match.');
      setSuccessMsg('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setErrorMsg('');
    const success = await changePassword(currentPassword, newPassword);
    
    if (success) {
      setSuccessMsg('Passcode changed successfully!');
      setErrorMsg('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setErrorMsg('Incorrect current passcode.');
      setSuccessMsg('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleLock = () => {
    Alert.alert('Lock Session', 'Are you sure you want to lock the app immediately?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Lock',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout();
        },
      },
    ]);
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SECURITY</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        
        <Text style={[styles.label, { color: colors.text }]}>Change Passcode</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Update your secure passcode. Must be at least 4 characters.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
            placeholder="Current Passcode"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showCurrent}
            value={currentPassword}
            onChangeText={(t) => {
              setCurrentPassword(t);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
            <MaterialCommunityIcons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, { marginTop: 10 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
            placeholder="New Passcode"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showNew}
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
            <MaterialCommunityIcons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, { marginTop: 10 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
            placeholder="Confirm New Passcode"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
            <MaterialCommunityIcons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleChangePassword}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Change Passcode</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 16 }]} />

        <Text style={[styles.label, { color: colors.text }]}>App Session Lock</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Lock the application immediately. You will need to re-enter your passcode.
        </Text>

        <TouchableOpacity
          style={[styles.lockButton, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
          onPress={handleLock}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="lock" size={16} color={colors.overtimeAccent} />
          <Text style={[styles.lockButtonText, { color: colors.overtimeAccent }]}>Lock Session Now</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  divider: { height: 1 },
  inputContainer: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 40,
    fontSize: 14,
    fontWeight: '600',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  button: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  lockButton: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  lockButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  successText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});
