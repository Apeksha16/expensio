import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import RecommendsBadge from '../components/RecommendsBadge';
import image1 from '../assets/onboarding/image1.png';
import image2 from '../assets/onboarding/image2.png';
import image3 from '../assets/onboarding/image3.png';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: image1,
    title: 'Track every\npenny',
    subtitle: 'Monitor your daily spending and\nkeep your finances in check.',
  },
  {
    id: '2',
    image: image2,
    title: 'Save for\nyour goals',
    subtitle: 'Set targets for what matters\nand watch your savings grow.',
  },
  {
    id: '3',
    image: image3,
    title: 'Split bills\nwith friends',
    subtitle: 'Seamlessly share expenses and\nsettle debts without stress.',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  // Animate content on slide change
  useEffect(() => {
    fadeAnim.setValue(0);
    translateAnim.setValue(20);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentSlideIndex]);

  const updateCurrentSlideIndex = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    if (currentIndex !== currentSlideIndex) {
      setCurrentSlideIndex(currentIndex);
    }
  };

  const goToNextSlide = () => {
    const nextSlideIndex = currentSlideIndex + 1;
    if (nextSlideIndex !== slides.length) {
      const offset = nextSlideIndex * width;
      ref?.current?.scrollToOffset({ offset });
      setCurrentSlideIndex(nextSlideIndex);
    } else {
      onComplete();
    }
  };


  const skipToSlide = (index: number) => {
    const offset = index * width;
    ref?.current?.scrollToOffset({ offset });
    setCurrentSlideIndex(index);
  };

  const Slide = ({ item, index }: { item: any, index: number }) => {
    const isTextFirst = index % 2 === 0;

    const ImageSection = (
      <View style={styles.imageContainer}>
        <Animated.Image
          source={item.image}
          style={[
            styles.image,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }]
            }
          ]}
          resizeMode="contain"
        />
      </View>
    );

    const TextSection = (
      <View style={styles.textContainer}>
        <Animated.Text style={[
          styles.title,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }]
          }
        ]}>
          {item.title}
        </Animated.Text>
        <Animated.Text style={[
          styles.subtitle,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }]
          }
        ]}>
          {item.subtitle}
        </Animated.Text>
      </View>
    );

    return (
      <View style={styles.slide}>
        {/* Main Content */}
        <View style={styles.contentContainer}>
          {isTextFirst ? (
            <>
              {TextSection}
              {ImageSection}
            </>
          ) : (
            <>
              {ImageSection}
              {TextSection}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top Header: Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={ref}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        showsHorizontalScrollIndicator={false}
        horizontal
        data={slides}
        pagingEnabled
        renderItem={({ item, index }) => <Slide item={item} index={index} />}
        keyExtractor={(item) => item.id}
        bounces={false}
        scrollEnabled={false} // Clean design often controls via button, but we can enable if desired
      />

      {/* Footer: Pagination & Navigation */}
      <View style={styles.footer}>

        {/* Left: Recommends & Pagination */}
        <View style={styles.footerLeft}>
          {/* Small Pagination Dots */}
          <View style={styles.paginationContainer}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => skipToSlide(index)}
                style={{ padding: 10 }} // Increased touch area
              >
                <View
                  style={[
                    styles.dot,
                    currentSlideIndex === index && styles.activeDot
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>


        </View>

        {/* Right: Circular Next Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={goToNextSlide}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentSlideIndex === slides.length - 1 ? 'Start' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'flex-end',
    height: 50,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF', // lighter grey
  },
  slide: {
    width: width,
    height: height * 0.75, // Occupy most of screen, leaving room for footer
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  imageContainer: {
    height: height * 0.45,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  image: {
    width: '90%',
    height: '100%',
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: 'flex-start', // Left aligned
  },
  title: {
    fontSize: 32, // Slightly smaller than before for clean look
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: '#6B7280', // Soft grey
    textAlign: 'left',
    maxWidth: '80%',
  },
  footer: {
    height: height * 0.15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  footerLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB', // Very light grey
  },
  activeDot: {
    backgroundColor: '#1F2937', // Dark active
    width: 24, // Elongated active dot
  },
  badgeWrapper: {
    transform: [{ scale: 0.8 }], // Smaller badge to fit clean aesthetic
    marginLeft: -10, // Adjust for badge internal padding
  },
  nextButton: {
    width: 64,
    height: 64,
    backgroundColor: '#1F2937', // Dark button
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  }
});

export default OnboardingScreen;
