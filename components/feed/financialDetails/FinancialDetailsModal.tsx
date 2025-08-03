import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, ScrollView, Animated, Dimensions } from 'react-native';
import { AgriculturalProject } from '~/hooks/use-project-data';
import { FinancialDetailsModalProps } from './types';
import ModalHeader from './ModalHeader';
import LoadingState from './LoadingState';
import PaginationDots from './PaginationDots';
import CultureSection from './CultureSection';
import SummarySection from './SummarySection';

const screenWidth = Dimensions.get('window').width;

const FinancialDetailsModal: React.FC<FinancialDetailsModalProps> = ({
  visible,
  onClose,
  project,
  cultureDetails,
  loading,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const shakeAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && cultureDetails.length > 0) {
      // Animation de shake pour indiquer que c'est swipable
      const shake = () => {
        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      };

      const timer = setTimeout(shake, 500);
      return () => clearTimeout(timer);
    }
  }, [visible, cultureDetails.length]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  };

  const totalSections = cultureDetails.length + 1; // +1 for summary
  const hasData = cultureDetails.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <ModalHeader projectTitle={project?.title} onClose={onClose} />

        {/* Loading/Empty State */}
        <LoadingState loading={loading} hasData={hasData} />

        {/* Main Content */}
        {!loading && hasData && (
          <View className="flex-1">
            {/* Pagination Dots */}
            <PaginationDots
              totalSections={totalSections}
              currentIndex={currentIndex}
              shakeAnimation={shakeAnimation}
            />

            {/* Swipeable Content */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              className="flex-1">
              {/* Culture Sections */}
              {cultureDetails.map((detail, index) => (
                <CultureSection
                  key={detail.id_projet_culture}
                  detail={detail}
                  index={index}
                  totalCultures={cultureDetails.length}
                />
              ))}

              {/* Summary Section */}
              <SummarySection cultureDetails={cultureDetails} />
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default FinancialDetailsModal;
