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
    backgroundColor: '#F9A8D4', // Pink/Rose
    textColor: '#1F2937',
  },
  {
    id: '2',
    image: image2,
    title: 'Save for\nyour goals',
    subtitle: 'Set targets for what matters\nand watch your savings grow.',
    backgroundColor: '#FDE047', // Yellow
    textColor: '#1F2937',
  },
  {
    id: '3',
    image: image3,
    title: 'Split bills\nwith friends',
    subtitle: 'Seamlessly share expenses and\nsettle debts without stress.',
    backgroundColor: '#67E8F9', // Cyan/Blue
    textColor: '#1F2937',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  // Animate content on slide change
  useEffect(() => {
    // Reset and start entrance animation
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
      Animated.timing(progressAnim, {
        toValue: (currentSlideIndex + 1) / slides.length,
        duration: 300,
        useNativeDriver: false,
      })
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

  const Slide = ({ item }: { item: any }) => {
    return (
      <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Brand and Skip */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>D</Text>
            </View>
            <TouchableOpacity onPress={onComplete}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
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

            <View style={styles.textContainer}>
              <Animated.Text style={[
                styles.title,
                {
                  color: item.textColor,
                  opacity: fadeAnim,
                  transform: [{ translateY: translateAnim }]
                }
              ]}>
                {item.title}
              </Animated.Text>
              <Animated.Text style={[
                styles.subtitle,
                {
                  color: item.textColor,
                  opacity: fadeAnim,
                  transform: [{ translateY: translateAnim }]
                }
              ]}>
                {item.subtitle}
              </Animated.Text>
            </View>
          </View>

          {/* Footer: Avatar Badge (Left) and Next Button (Right) */}
          <View style={styles.footer}>
            <View style={styles.reviewBadge}>
              <RecommendsBadge />
            </View>

            <View style={styles.controlsRight}>
              {/* Segmented Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]} />
                </View>
                <Text style={styles.progressText}>{currentSlideIndex + 1} / 3</Text>
              </View>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={goToNextSlide}
                activeOpacity={0.8}
              >
                {/* Changed Icon to arrow-forward which is more standard/safe if chevron is missing */}
                <Icon name="arrow-forward" size={28} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </View>

        </SafeAreaView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <FlatList
        ref={ref}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        showsHorizontalScrollIndicator={false}
        horizontal
        data={slides}
        pagingEnabled
        renderItem={({ item }) => <Slide item={item} />}
        keyExtractor={(item) => item.id}
        bounces={false}
        scrollEnabled={false} // Disable manual scroll if relying on button, or keep enabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    width: width,
    height: height,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  brandBadge: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F2937',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    opacity: 0.7,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -40,
  },
  imageContainer: {
    height: height * 0.45,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  image: {
    width: '85%',
    height: '100%',
  },
  textContainer: {
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 50,
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  controlsRight: {
    alignItems: 'center',
    gap: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1F2937',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  nextButton: {
    width: 68,
    height: 68,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
});

export default OnboardingScreen;
