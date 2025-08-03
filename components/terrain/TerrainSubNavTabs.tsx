import { View, Text, Pressable, StyleSheet } from 'react-native';

type SubNavTabsProps = {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
};

export default function SubNavTabs({ tabs, activeTab, onChange }: SubNavTabsProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onChange(tab)}
          style={[styles.tab, activeTab === tab && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#C4E8D1',
    padding: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F4FBF6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  tabText: {
    color: '#6B7280',
  },
  activeTabText: {
    fontWeight: '600',
    color: 'black',
  },
});
