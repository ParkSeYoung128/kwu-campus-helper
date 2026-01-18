import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';

import { apiGet } from '../config/api';
import { SectionHeader } from '../components/SectionHeader';
import { useApp } from '../store/context';
import { formatDate } from '../utils';

// ✅ 타입 위치가 다르면 여기만 수정하세요.
// (확실하지 않음: 프로젝트에 따라 ../types 또는 ../types/index.ts 등일 수 있음)
import type { CafeteriaMenu } from '../types';

export const CafeteriaScreen: React.FC = () => {
  const { state, dispatch } = useApp();

  const [notificationTime, setNotificationTime] = useState(
    state.notifications.cafeteriaTime
  );
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(
    state.notifications.cafeteriaEnabled
  );

  // ✅ selectedDate/state 선언 누락 해결
  const [selectedDate, setSelectedDate] = useState<string>('');

  // ✅ useEffect 중복 제거 + 데이터 로딩 1회만
  useEffect(() => {
    const run = async () => {
      try {
        const data = await apiGet<CafeteriaMenu[]>('/cafeteria/week');

        if (Array.isArray(data) && data.length > 0) {
          dispatch({ type: 'UPDATE_CAFETERIA_MENU', payload: data });

          // 선택 날짜가 없거나 주간 데이터에 없으면 첫 날짜로 보정
          if (!selectedDate || !data.find((m) => m.date === selectedDate)) {
            setSelectedDate(data[0].date);
          }
        }
      } catch (e) {
        // 백엔드 연결 전/에러 시에도 앱이 죽지 않게 무시
        // 필요하면 여기서 토스트/알림 처리
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleNotification = (value: boolean) => {
    setIsNotificationEnabled(value);
    dispatch({
      type: 'UPDATE_NOTIFICATIONS',
      payload: { cafeteriaEnabled: value },
    });

    // TODO: 카카오톡 알림 전송 로직 구현 필요
  };

  const handleTimeChange = (text: string) => {
    setNotificationTime(text);
    dispatch({
      type: 'UPDATE_NOTIFICATIONS',
      payload: { cafeteriaTime: text },
    });

    // TODO: 시간 변경 시 알림 스케줄 업데이트 로직 구현 필요
  };

  // ✅ selectedDate가 있으면 그 날짜 메뉴만 보여주고 싶다면 아래로 변경 가능(추측입니다)
  // const menusToShow = selectedDate
  //   ? state.cafeteriaMenus.filter((m) => m.date === selectedDate)
  //   : state.cafeteriaMenus;

  return (
    <ScrollView style={styles.container}>
      <SectionHeader title="학식 메뉴" subtitle="주간 학식 정보를 확인하세요" />

      <View style={styles.menuList}>
        {state.cafeteriaMenus.map((menu) => (
          <View key={menu.date} style={styles.menuCard}>
            <Text style={styles.menuDate}>{formatDate(menu.date)}</Text>

            <View style={styles.mealsContainer}>
              {menu.meals.breakfast && menu.meals.breakfast.length > 0 && (
                <View style={styles.mealSection}>
                  <Text style={styles.mealType}>아침</Text>
                  <Text style={styles.mealItems}>
                    {menu.meals.breakfast.join(', ')}
                  </Text>
                </View>
              )}

              {menu.meals.lunch && menu.meals.lunch.length > 0 && (
                <View style={styles.mealSection}>
                  <Text style={styles.mealType}>점심</Text>
                  <Text style={styles.mealItems}>
                    {menu.meals.lunch.join(', ')}
                  </Text>
                </View>
              )}

              {menu.meals.dinner && menu.meals.dinner.length > 0 && (
                <View style={styles.mealSection}>
                  <Text style={styles.mealType}>저녁</Text>
                  <Text style={styles.mealItems}>
                    {menu.meals.dinner.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader title="카카오톡 알림 설정" />

        <View style={styles.notificationCard}>
          <View style={styles.notificationRow}>
            <View style={styles.notificationRowLeft}>
              <Text style={styles.notificationLabel}>알림 받기</Text>
              <Text style={styles.notificationDescription}>
                매일 지정된 시간에 학식 메뉴를 카카오톡으로 받습니다
              </Text>
            </View>

            <Switch
              value={isNotificationEnabled}
              onValueChange={handleToggleNotification}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          {isNotificationEnabled && (
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>알림 시간</Text>
              <TextInput
                style={styles.timeInput}
                value={notificationTime}
                onChangeText={handleTimeChange}
                placeholder="12:00"
                placeholderTextColor="#999"
              />
              <Text style={styles.timeHint}>HH:MM 형식으로 입력하세요</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  menuList: {
    padding: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  mealsContainer: {
    gap: 12,
  },
  mealSection: {
    marginBottom: 8,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  mealItems: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  section: {
    paddingBottom: 32,
  },
  notificationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationRowLeft: {
    flex: 1,
    marginRight: 16,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  timeInputContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  timeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
