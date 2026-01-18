import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SectionHeader } from '../components/SectionHeader';
import { SummaryCard } from '../components/SummaryCard';
import { InputRow } from '../components/InputRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { analyzeGraduationRequirement } from '../utils/graduationUtils';
import { TranscriptItem, SpecificMajorType, CourseCategory } from '../types';
import { getSpecificMajorName, RECOMMENDED_COURSES } from '../data/graduationRules';

const screenWidth = Dimensions.get('window').width;

// 선택 가능한 학번 리스트
const YEAR_OPTIONS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export const GraduationScreen: React.FC = () => {
  // --- 1. 상태 관리 ---
  const [admissionYear, setAdmissionYear] = useState(2020);
  const [specificMajor, setSpecificMajor] = useState<SpecificMajorType>('system');
  
  const [transcript, setTranscript] = useState<TranscriptItem[]>([
    {
      id: '1',
      courseName: '디지털논리회로1',
      credits: 3,
      category: 'major_required',
      department: '컴퓨터정보공학부',
    },
  ]);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCredit, setNewCredit] = useState('');
  const [newCategory, setNewCategory] = useState<CourseCategory>('major_required');
  const [isOtherDept, setIsOtherDept] = useState(false);

  // --- 2. 실시간 분석 ---
  const analysis = useMemo(() => {
    return analyzeGraduationRequirement(transcript, admissionYear, specificMajor);
  }, [transcript, admissionYear, specificMajor]);

  // 학번이 바뀔 때 전공 명칭이 바뀌는 것을 UI에 반영하기 위해 변수 처리
  const systemMajorName = getSpecificMajorName(admissionYear, 'system');
  const infoMajorName = getSpecificMajorName(admissionYear, 'info');
  const currentMajorName = specificMajor === 'system' ? systemMajorName : infoMajorName;

  // --- 3. 핸들러 ---
  const handleAddCourse = () => {
    if (!newName.trim() || !newCredit.trim()) {
      Alert.alert('입력 오류', '과목명과 학점을 입력해주세요.');
      return;
    }
    const newItem: TranscriptItem = {
      id: Date.now().toString(),
      courseName: newName.trim(),
      credits: parseInt(newCredit) || 0,
      category: newCategory,
      department: isOtherDept ? '타학과' : '컴퓨터정보공학부',
      isCyber: false,
    };
    setTranscript([...transcript, newItem]);
    setNewName('');
    setNewCredit('');
    setIsFormVisible(false);
  };

  const handleDeleteCourse = (id: string) => {
    setTranscript(transcript.filter((item) => item.id !== id));
  };

  // 추천 과목 칩 클릭 시 자동 입력
  const handleSelectRecommendation = (name: string, credit: number) => {
    setNewName(name);
    setNewCredit(credit.toString());
  };

  const getCategoryLabel = (cat: CourseCategory) => {
    switch (cat) {
      case 'major_required': return '전필';
      case 'major_elective': return '전선';
      case 'general_required': return '교필';
      case 'general_elective': return '교선';
      default: return '일반';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* --- 설정 섹션 (학번, 전공) --- */}
      <View style={styles.settingsSection}>
        {/* 학번 선택 (가로 스크롤 버튼) */}
        <Text style={styles.label}>입학 연도</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
          {YEAR_OPTIONS.map((year) => (
            <TouchableOpacity
              key={year}
              style={[styles.yearChip, admissionYear === year && styles.yearChipActive]}
              onPress={() => setAdmissionYear(year)}
            >
              <Text style={[styles.yearText, admissionYear === year && styles.yearTextActive]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 세부 전공 선택 */}
        <Text style={[styles.label, { marginTop: 16 }]}>세부 전공</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, specificMajor === 'system' && styles.toggleBtnActive]}
            onPress={() => setSpecificMajor('system')}
          >
            <Text style={[styles.toggleText, specificMajor === 'system' && styles.toggleTextActive]}>
              {systemMajorName}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, specificMajor === 'info' && styles.toggleBtnActive]}
            onPress={() => setSpecificMajor('info')}
          >
            <Text style={[styles.toggleText, specificMajor === 'info' && styles.toggleTextActive]}>
              {infoMajorName}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- 분석 결과 차트 --- */}
      <SummaryCard title="졸업 요건 달성도">
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: analysis.categories.labels,
              datasets: [{ data: analysis.categories.data }],
            }}
            width={screenWidth - 64}
            height={220}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
              barPercentage: 0.7,
            }}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
        <Text style={styles.summaryText}>
          총 이수 학점: {analysis.totalCredits} / {analysis.totalRequired}
        </Text>
      </SummaryCard>

      {/* --- 상세 진단 --- */}
      <View style={styles.diagnosisContainer}>
        <SectionHeader title="상세 진단" />
        
        {/* 전공 필수 */}
        <View style={[styles.diagnosisCard, !analysis.details.majorRequired.passed && styles.warningBorder]}>
          <Text style={styles.diagnosisTitle}>전공 필수 (7과목)</Text>
          {analysis.details.majorRequired.passed ? (
            <Text style={styles.passText}>✅ 모두 이수했습니다.</Text>
          ) : (
            <View>
              <Text style={styles.failText}>❌ 미이수 과목:</Text>
              <Text style={styles.missingList}>{analysis.details.majorRequired.missing.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* 세부 전공 */}
        <View style={[styles.diagnosisCard, !analysis.details.specificMajor.passed && styles.warningBorder]}>
          <Text style={styles.diagnosisTitle}>세부 전공 ({currentMajorName})</Text>
          {analysis.details.specificMajor.passed ? (
            <Text style={styles.passText}>✅ 이수 요건을 충족했습니다.</Text>
          ) : (
            analysis.details.specificMajor.messages.map((msg, idx) => (
              <Text key={idx} style={styles.failText}>• {msg}</Text>
            ))
          )}
        </View>

        {/* 교양 */}
        <View style={[styles.diagnosisCard, !analysis.details.general.passed && styles.warningBorder]}>
          <Text style={styles.diagnosisTitle}>교양</Text>
          {analysis.details.general.messages.map((msg, idx) => (
            <Text key={idx} style={analysis.details.general.passed ? styles.passText : styles.failText}>
              {analysis.details.general.passed ? '✅ ' : '• '} {msg}
            </Text>
          ))}
        </View>
      </View>

      {/* --- 과목 관리 (수정된 폼) --- */}
      <SectionHeader title={`수강 과목 관리 (${transcript.length})`} />
      
      {!isFormVisible ? (
        <View style={styles.addButtonContainer}>
          <PrimaryButton title="+ 과목 추가하기" onPress={() => setIsFormVisible(true)} />
        </View>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>이수 구분 (먼저 선택하세요)</Text>
          <View style={styles.categoryBtnGroup}>
            {(['major_required', 'major_elective', 'general_required', 'general_elective'] as CourseCategory[]).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, newCategory === cat && styles.catBtnActive]}
                onPress={() => setNewCategory(cat)}
              >
                <Text style={[styles.catBtnText, newCategory === cat && styles.catBtnTextActive]}>
                  {getCategoryLabel(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 추천 과목 칩 (Quick Fill) */}
          {(newCategory === 'major_required' || newCategory === 'major_elective' || newCategory === 'general_required') && (
            <View style={styles.recommendationArea}>
              <Text style={styles.subLabel}>추천 과목 (터치 시 자동입력)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {RECOMMENDED_COURSES[newCategory]?.map((course, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.courseChip}
                    onPress={() => handleSelectRecommendation(course.name, course.credit)}
                  >
                    <Text style={styles.courseChipText}>{course.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <InputRow label="과목명" value={newName} onChangeText={setNewName} placeholder="직접 입력 가능" />
          <InputRow label="학점" value={newCredit} onChangeText={setNewCredit} placeholder="3" keyboardType="numeric" />

          <View style={styles.checkboxRow}>
            <Text style={styles.label}>타학과 개설 과목인가요?</Text>
            <TouchableOpacity 
              style={[styles.checkbox, isOtherDept && styles.checkboxActive]}
              onPress={() => setIsOtherDept(!isOtherDept)}
            >
              <Text style={isOtherDept ? styles.checkboxTextActive : styles.checkboxText}>{isOtherDept ? '예' : '아니오'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formActions}>
            <PrimaryButton title="취소" onPress={() => setIsFormVisible(false)} variant="secondary" />
            <View style={{ width: 10 }} />
            <PrimaryButton title="추가" onPress={handleAddCourse} />
          </View>
        </View>
      )}

      <View style={styles.listContainer}>
        {transcript.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={{flex: 1}}>
              <Text style={styles.itemTitle}>{item.courseName}</Text>
              <Text style={styles.itemSub}>
                {getCategoryLabel(item.category)} | {item.credits}학점 | {item.department}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteCourse(item.id)}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  settingsSection: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  
  // Year Scroll
  yearScroll: { flexDirection: 'row', marginBottom: 4 },
  yearChip: { 
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, 
    backgroundColor: '#f0f0f0', marginRight: 8, borderWidth: 1, borderColor: '#eee' 
  },
  yearChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  yearText: { color: '#666', fontWeight: '600' },
  yearTextActive: { color: '#fff' },

  // Toggle
  toggleContainer: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 8, padding: 2 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  toggleText: { color: '#666', fontSize: 14 },
  toggleTextActive: { color: '#007AFF', fontWeight: 'bold' },

  chartContainer: { alignItems: 'center', marginTop: 10 },
  summaryText: { textAlign: 'center', marginTop: 10, fontWeight: 'bold', color: '#333' },

  diagnosisContainer: { paddingBottom: 16 },
  diagnosisCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 12 },
  warningBorder: { borderWidth: 1, borderColor: '#FF3B30' },
  diagnosisTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  passText: { color: '#34C759', fontSize: 14 },
  failText: { color: '#FF3B30', fontSize: 14, marginBottom: 2 },
  missingList: { color: '#666', fontSize: 13, marginTop: 4, lineHeight: 18 },

  addButtonContainer: { padding: 16 },
  formCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  
  // Category Buttons
  categoryBtnGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f0f0f0' },
  catBtnActive: { backgroundColor: '#007AFF' },
  catBtnText: { color: '#666', fontSize: 13 },
  catBtnTextActive: { color: '#fff', fontWeight: 'bold' },

  // Recommendation Chips
  recommendationArea: { marginBottom: 16, backgroundColor: '#F2F2F7', padding: 10, borderRadius: 8 },
  chipScroll: { flexDirection: 'row' },
  courseChip: { backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#ddd' },
  courseChipText: { fontSize: 12, color: '#333' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  checkbox: { padding: 8, backgroundColor: '#eee', borderRadius: 6, width: 60, alignItems: 'center' },
  checkboxActive: { backgroundColor: '#FF9500' },
  checkboxText: { color: '#666' },
  checkboxTextActive: { color: '#fff', fontWeight: 'bold' },
  formActions: { flexDirection: 'row', marginTop: 10 },

  listContainer: { paddingHorizontal: 16 },
  itemCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemSub: { fontSize: 12, color: '#888', marginTop: 2 },
  deleteText: { color: '#FF3B30', fontWeight: '600' },
});