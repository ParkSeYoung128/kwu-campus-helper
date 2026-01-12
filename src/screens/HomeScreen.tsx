import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { useApp } from '../store/context';
import { getTodayString, formatDate, calculateDaysDiff } from '../utils';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootTabParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { state } = useApp();

  const today = getTodayString();
  const todayMenu = state.cafeteriaMenus.find((menu) => menu.date === today);
  const todayDDayItems = state.dDayItems
    .filter((item) => {
      const daysDiff = calculateDaysDiff(item.dueDate);
      return daysDiff >= 0 && daysDiff <= 7;
    })
    .sort((a, b) => calculateDaysDiff(a.dueDate) - calculateDaysDiff(b.dueDate))
    .slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#666';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '상';
      case 'medium':
        return '중';
      case 'low':
        return '하';
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(today)}</Text>
        <Text style={styles.greeting}>안녕하세요! 👋</Text>
      </View>

      <SummaryCard
        title="오늘 할 일 (과제/시험 D-day)"
        onPress={() => navigation.navigate('DDay' as any)}
      >
        {todayDDayItems.length > 0 ? (
          todayDDayItems.map((item) => {
            const daysDiff = calculateDaysDiff(item.dueDate);
            const dDayText = daysDiff === 0 ? 'D-Day' : `D-${daysDiff}`;
            return (
              <View key={item.id} style={styles.ddayItem}>
                <View style={styles.ddayItemLeft}>
                  <Text style={styles.ddayItemName}>{item.courseName}</Text>
                  <Text style={styles.ddayItemType}>
                    {item.type === 'exam' ? '시험' : '과제'}
                  </Text>
                </View>
                <View style={styles.ddayItemRight}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(item.priority) },
                    ]}
                  >
                    <Text style={styles.priorityText}>
                      {getPriorityText(item.priority)}
                    </Text>
                  </View>
                  <Text style={styles.ddayText}>{dDayText}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>오늘 할 일이 없습니다</Text>
        )}
      </SummaryCard>

      <SummaryCard
        title="오늘 학식"
        subtitle={formatDate(today)}
        onPress={() => navigation.navigate('Cafeteria' as any)}
      >
        {todayMenu ? (
          <View>
            {todayMenu.meals.lunch && (
              <View style={styles.menuSection}>
                <Text style={styles.menuType}>점심</Text>
                <Text style={styles.menuItems}>
                  {todayMenu.meals.lunch.join(', ')}
                </Text>
              </View>
            )}
            {todayMenu.meals.dinner && (
              <View style={styles.menuSection}>
                <Text style={styles.menuType}>저녁</Text>
                <Text style={styles.menuItems}>
                  {todayMenu.meals.dinner.join(', ')}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>오늘 학식 정보가 없습니다</Text>
        )}
      </SummaryCard>

      <SummaryCard
        title="추천 회의 시간"
        subtitle="팀원들과의 시간 조율"
        onPress={() => navigation.navigate('Meeting' as any)}
      >
        <Text style={styles.emptyText}>
          회의 시간 추천 기능을 사용해보세요
        </Text>
      </SummaryCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  ddayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ddayItemLeft: {
    flex: 1,
  },
  ddayItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  ddayItemType: {
    fontSize: 12,
    color: '#666',
  },
  ddayItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ddayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  menuSection: {
    marginBottom: 12,
  },
  menuType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  menuItems: {
    fontSize: 15,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
