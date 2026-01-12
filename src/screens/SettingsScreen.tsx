import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { useApp } from '../store/context';

export const SettingsScreen: React.FC = () => {
  const { state, dispatch } = useApp();

  const handleToggleNotification = (value: boolean) => {
    dispatch({
      type: 'UPDATE_NOTIFICATIONS',
      payload: { dDayEnabled: value },
    });
  };

  const handleToggleTheme = (value: boolean) => {
    // TODO: 테마 적용 로직 구현 필요 (선택 사항)
    // 담당자: UI/UX 개발자
    // 구현 내용:
    // - 다크 모드/라이트 모드 전환
    // - 테마 상태 저장 및 적용
  };

  return (
    <ScrollView style={styles.container}>
      <SectionHeader title="설정" subtitle="앱 설정을 관리하세요" />

      <View style={styles.section}>
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>알림</Text>
        </View>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={styles.settingLabel}>D-day 알림</Text>
              <Text style={styles.settingDescription}>
                중요한 과제나 시험 전에 알림을 받습니다
              </Text>
            </View>
            <Switch
              value={state.notifications.dDayEnabled}
              onValueChange={handleToggleNotification}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>화면</Text>
        </View>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={styles.settingLabel}>다크 모드</Text>
              <Text style={styles.settingDescription}>
                어두운 테마로 전환합니다
              </Text>
            </View>
            <Switch
              value={false}
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>정보</Text>
        </View>
        <View style={styles.settingCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>앱 버전</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>계정</Text>
            <Text style={styles.infoValue}>로그인 필요</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          University Life Manager{'\n'}© 2024
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  settingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingRowLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
