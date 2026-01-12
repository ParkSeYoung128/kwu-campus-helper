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
import { TeamMember, MeetingTime } from '../types';

export const MeetingScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const [memberName, setMemberName] = useState('');
  const [availability, setAvailability] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [recommendedTimes, setRecommendedTimes] = useState<MeetingTime[]>([]);

  const handleAddMember = () => {
    if (!memberName.trim()) {
      Alert.alert('입력 오류', '팀원 이름을 입력해주세요.');
      return;
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: memberName.trim(),
      availability: availability.trim() || '미입력',
    };

    dispatch({ type: 'ADD_TEAM_MEMBER', payload: newMember });

    // 폼 초기화
    setMemberName('');
    setAvailability('');
    setIsFormVisible(false);
  };

  const handleDeleteMember = (id: string) => {
    Alert.alert('삭제 확인', '이 팀원을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_TEAM_MEMBER', payload: id }),
      },
    ]);
  };

  const handleFindCommonTimes = () => {
    if (state.teamMembers.length < 2) {
      Alert.alert('안내', '최소 2명 이상의 팀원이 필요합니다.');
      return;
    }

    // TODO: 겹치는 시간 계산 로직 구현 필요
    // 담당자: 회의 시간 추천 기능 개발자
    // 구현 내용:
    // - 각 팀원의 availability 문자열을 파싱하여 시간대 추출
    // - 모든 팀원의 가능한 시간대를 교집합하여 겹치는 시간 계산
    // - 여러 시간 슬롯이 있을 경우 모두 추천
    // - 계산된 결과를 MeetingTime[] 형식으로 변환하여 recommendedTimes에 설정
    // 
    // 예시 로직:
    // 1. availability 문자열 파싱 (예: "월 10:00-12:00, 수 14:00-16:00")
    // 2. 각 팀원의 가능한 시간대를 배열로 변환
    // 3. 교집합 계산 (모든 팀원이 가능한 시간대)
    // 4. 결과를 MeetingTime 형식으로 변환

    // 임시 더미 데이터
    setRecommendedTimes([
      { day: '월', startTime: '10:00', endTime: '12:00' },
      { day: '수', startTime: '14:00', endTime: '16:00' },
    ]);

    Alert.alert('완료', '추천 시간을 계산했습니다.');
  };

  return (
    <ScrollView style={styles.container}>
      <SectionHeader
        title="회의 시간 조율"
        subtitle="팀원들의 가능한 시간을 확인하고 회의 시간을 찾아보세요"
      />

      {!isFormVisible ? (
        <View style={styles.addButtonContainer}>
          <PrimaryButton
            title="+ 팀원 추가"
            onPress={() => setIsFormVisible(true)}
          />
        </View>
      ) : (
        <View style={styles.formCard}>
          <InputRow
            label="팀원 이름"
            value={memberName}
            onChangeText={setMemberName}
            placeholder="예: 홍길동"
          />

          <InputRow
            label="가능한 시간대"
            value={availability}
            onChangeText={setAvailability}
            placeholder="예: 월 10:00-12:00, 수 14:00-16:00"
            multiline
          />

          <Text style={styles.hint}>
            요일과 시간 범위를 입력하세요. 여러 시간대는 쉼표로 구분합니다.
          </Text>

          <View style={styles.formActions}>
            <PrimaryButton
              title="취소"
              onPress={() => setIsFormVisible(false)}
              variant="secondary"
            />
            <View style={styles.spacer} />
            <PrimaryButton title="추가" onPress={handleAddMember} />
          </View>
        </View>
      )}

      <View style={styles.membersContainer}>
        <SectionHeader title="팀원 목록" subtitle={`${state.teamMembers.length}명`} />
        {state.teamMembers.length > 0 ? (
          state.teamMembers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberAvailability}>
                  {member.availability}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteMember(member.id)}
              >
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 팀원이 없습니다</Text>
          </View>
        )}
      </View>

      {state.teamMembers.length >= 2 && (
        <View style={styles.recommendSection}>
          <View style={styles.recommendButtonContainer}>
            <PrimaryButton
              title="겹치는 시간 추천"
              onPress={handleFindCommonTimes}
            />
          </View>

          {recommendedTimes.length > 0 && (
            <View style={styles.recommendResults}>
              <SectionHeader title="추천 회의 시간" />
              {recommendedTimes.map((time, index) => (
                <View key={index} style={styles.timeSlotCard}>
                  <Text style={styles.timeSlotDay}>{time.day}요일</Text>
                  <Text style={styles.timeSlotTime}>
                    {time.startTime} - {time.endTime}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
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
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  formActions: {
    flexDirection: 'row',
  },
  spacer: {
    width: 12,
  },
  membersContainer: {
    paddingBottom: 16,
  },
  memberCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberAvailability: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  deleteButton: {
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
  recommendSection: {
    paddingBottom: 32,
  },
  recommendButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recommendResults: {
    paddingTop: 8,
  },
  timeSlotCard: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  timeSlotDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  timeSlotTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
