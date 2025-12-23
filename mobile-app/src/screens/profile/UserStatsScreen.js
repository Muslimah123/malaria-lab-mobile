import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { api } from '../../services/api/authService';

const { width, height } = Dimensions.get('window');

const UserStatsScreen = ({ navigation }) => {
  const user = useSelector(selectUser);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserStats = async () => {
    try {
      setError(null);
      
      console.log('Fetching stats from dashboard API...');
      
      const response = await api.get('/dashboard/');
      
      console.log('Stats data received:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserStats();
  };

  const renderStatCard = (title, value, subtitle, icon, color = '#667eea') => (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderChart = () => {
    if (!stats?.weeklyTrend) return null;

    const chartData = {
      labels: stats.weeklyTrend.map(item => item.week),
      datasets: [{
        data: stats.weeklyTrend.map(item => item.count),
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        strokeWidth: 2
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Test Trend</Text>
        <LineChart
          data={chartData}
          width={width - 40}
          height={200}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: 'transparent',
            backgroundGradientTo: 'transparent',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#667eea"
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderTestStatusChart = () => {
    if (!stats?.summary) return null;

    const statusData = [
      {
        name: 'Completed',
        population: stats.summary.completedTests,
        color: '#27ae60',
        legendFontColor: '#fff',
        legendFontSize: 12,
      },
      {
        name: 'Pending',
        population: stats.summary.pendingTests,
        color: '#f39c12',
        legendFontColor: '#fff',
        legendFontSize: 12,
      },
      {
        name: 'Processing',
        population: stats.summary.processingTests,
        color: '#3498db',
        legendFontColor: '#fff',
        legendFontSize: 12,
      },
      {
        name: 'Failed',
        population: stats.summary.failedTests,
        color: '#e74c3c',
        legendFontColor: '#fff',
        legendFontSize: 12,
      },
    ];

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Test Status Distribution</Text>
        <PieChart
          data={statusData}
          width={width - 40}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>
    );
  };

  const renderRecentActivity = () => {
    if (!stats?.recentTests?.length) return null;

    return (
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {stats.recentTests.slice(0, 5).map((test, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons 
                name="flask" 
                size={16} 
                color={test.status === 'completed' ? '#27ae60' : '#f39c12'} 
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>
                Test {test.testId || test.test_id || test.id}
              </Text>
              <Text style={styles.activitySubtitle}>
                {test.patient?.firstName && test.patient?.lastName 
                  ? `${test.patient.firstName} ${test.patient.lastName}`
                  : test.patient_name || 'Unknown Patient'} • {test.status}
              </Text>
            </View>
            <Text style={styles.activityTime}>
              {new Date(test.createdAt || test.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          locations={[0, 0.6, 1]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4FC3F7" />
            <Text style={styles.loadingText}>Loading your statistics...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          locations={[0, 0.6, 1]}
          style={styles.gradient}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#e74c3c" />
            <Text style={styles.errorTitle}>Unable to Load Statistics</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Make sure the server is running and you're connected to the internet.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchUserStats}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Statistics</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4FC3F7"
            />
          }
        >
          {/* User Performance Stats */}
          {stats?.userStats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Performance</Text>
              <View style={styles.statsGrid}>
                {renderStatCard(
                  'Total Tests',
                  stats.userStats.totalTests || 0,
                  'Tests performed',
                  'flask',
                  '#667eea'
                )}
                {renderStatCard(
                  'Completed',
                  stats.userStats.completedTests || 0,
                  'Successfully completed',
                  'checkmark-circle',
                  '#27ae60'
                )}
                {renderStatCard(
                  'Success Rate',
                  `${Math.round(stats.userStats.completionRate || 0)}%`,
                  'Completion rate',
                  'trending-up',
                  '#f39c12'
                )}
              </View>
            </View>
          )}

          {/* Overall Statistics */}
          {stats?.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overall Statistics</Text>
              <View style={styles.statsGrid}>
                {renderStatCard(
                  'Total Patients',
                  stats.summary.totalPatients || 0,
                  'All time',
                  'people',
                  '#3498db'
                )}
                {renderStatCard(
                  'Total Tests',
                  stats.summary.totalTests || 0,
                  'All time',
                  'document-text',
                  '#9b59b6'
                )}
                {renderStatCard(
                  'Positive Results',
                  stats.summary.positiveResults || 0,
                  'Malaria detected',
                  'warning',
                  '#e74c3c'
                )}
                {renderStatCard(
                  'Negative Results',
                  stats.summary.negativeResults || 0,
                  'No malaria',
                  'checkmark',
                  '#27ae60'
                )}
              </View>
            </View>
          )}

          {/* Charts */}
          {renderChart()}
          {renderTestStatusChart()}

          {/* Recent Activity */}
          {renderRecentActivity()}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  activityContainer: {
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activityTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default UserStatsScreen;
