import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { InputRow } from '../components/InputRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { useApp } from '../store/context';
import { DDayItem, DDayType, Priority } from '../types';
import { calculateDaysDiff, formatDate } from '../utils';

export const DDayScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const [courseName, setCourseName] = useState('');
  const [type, setType] = useState<DDayType>('assignment');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleAddItem = () => {
    if (!courseName.trim() || !dueDate.trim()) {
      Alert.alert('입력 오류', '과목명과 마감일을 모두 입력해주세요.');
      return;
    }

    const newItem: DDayItem = {
      id: Date.now().toString(),
      courseName: courseName.trim(),
      type,
      dueDate,
      priority,
    };

    dispatch({ type: 'ADD_DDAY_ITEM', payload: newItem });

    // 폼 초기화
    setCourseName('');
    setDueDate('');
    setType('assignment');
    setPriority('medium');
    setIsFormVisible(false);
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert('삭제 확인', '이 항목을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_DDAY_ITEM', payload: id }),
      },
    ]);
  };

  const getDaysDiffDisplay = (dueDate: string) => {
    const daysDiff = calculateDaysDiff(dueDate);

    // TODO: 실제 D-day 계산 로직은 여기에 구현 필요
    // 담당자: D-day 기능 개발자
    // 구현 내용:
    // - 정확한 날짜 차이 계산 (시간 포함)
    // - D-7, D-3, D-Day 등의 알림 표시
    // - 푸시 알림 연동 (D-7, D-3, D-Day 전에 알림)
    // - 위젯 연동 (홈 화면 위젯에 D-day 표시)

    if (daysDiff < 0) {
      return { text: `D+${Math.abs(daysDiff)}`, color: '#999' };
    }
    if (daysDiff === 0) {
      return { text: 'D-Day', color: '#FF3B30' };
    }
    if (daysDiff <= 3) {
      return { text: `D-${daysDiff}`, color: '#FF9500' };
    }
    if (daysDiff <= 7) {
      return { text: `D-${daysDiff}`, color: '#FF9500' };
    }
    return { text: `D-${daysDiff}`, color: '#007AFF' };
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
    }
  };

  const getPriorityText = (p: Priority) => {
    switch (p) {
      case 'high':
        return '상';
      case 'medium':
        return '중';
      case 'low':
        return '하';
    }
  };

  const sortedItems = [...state.dDayItems].sort((a, b) => {
    const diffA = calculateDaysDiff(a.dueDate);
    const diffB = calculateDaysDiff(b.dueDate);
    if (diffA !== diffB) return diffA - diffB;

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <ScrollView style={styles.container}>
      <SectionHeader
        title="과제/시험 D-day"
        subtitle="중요한 일정을 관리하세요"
      />

      {!isFormVisible ? (
        <View style={styles.addButtonContainer}>
          <PrimaryButton
            title="+ 새 항목 추가"
            onPress={() => setIsFormVisible(true)}
          />
        </View>
      ) : (
        <View style={styles.formCard}>
          <InputRow
            label="과목명"
            value={courseName}
            onChangeText={setCourseName}
            placeholder="예: 자료구조"
          />

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>유형</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'exam' && styles.typeButtonActive,
                ]}
                onPress={() => setType('exam')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'exam' && styles.typeButtonTextActive,
                  ]}
                >
                  시험
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'assignment' && styles.typeButtonActive,
                ]}
                onPress={() => setType('assignment')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'assignment' && styles.typeButtonTextActive,
                  ]}
                >
                  과제
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <InputRow
            label="마감일"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            keyboardType="default"
          />

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>우선순위</Text>
            <View style={styles.buttonGroup}>
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && {
                      backgroundColor: getPriorityColor(p),
                    },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === p && styles.priorityButtonTextActive,
                    ]}
                  >
                    {getPriorityText(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formActions}>
            <PrimaryButton
              title="취소"
              onPress={() => setIsFormVisible(false)}
              variant="secondary"
            />
            <View style={styles.spacer} />
            <PrimaryButton title="추가" onPress={handleAddItem} />
          </View>
        </View>
      )}

      <View style={styles.listContainer}>
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => {
            const dDayDisplay = getDaysDiffDisplay(item.dueDate);
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemHeaderLeft}>
                    <Text style={styles.itemCourseName}>{item.courseName}</Text>
                    <View style={styles.itemBadges}>
                      <View
                        style={[
                          styles.typeBadge,
                          item.type === 'exam' && styles.typeBadgeExam,
                        ]}
                      >
                        <Text style={styles.typeBadgeText}>
                          {item.type === 'exam' ? '시험' : '과제'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(item.priority) },
                        ]}
                      >
                        <Text style={styles.priorityBadgeText}>
                          {getPriorityText(item.priority)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.itemHeaderRight}>
                    <Text
                      style={[styles.dDayDisplay, { color: dDayDisplay.color }]}
                    >
                      {dDayDisplay.text}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemDueDate}>
                  마감일: {formatDate(item.dueDate)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 항목이 없습니다</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addButtonContainer: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formRow: {
    marginVertical: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  spacer: {
    width: 12,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemHeaderLeft: {
    flex: 1,
  },
  itemCourseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E3F2FD',
  },
  typeBadgeExam: {
    backgroundColor: '#FFEBEE',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  itemHeaderRight: {
    marginLeft: 12,
  },
  dDayDisplay: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemDueDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
