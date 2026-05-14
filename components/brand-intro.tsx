import { brandType } from '@/constants/brand';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BrandIntroProps = {
  onComplete: () => void;
};

export function BrandIntro({ onComplete }: BrandIntroProps) {
  const wordmark = useRef(new Animated.Value(0)).current;
  const hatDrop = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(wordmark, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(hatDrop, {
        toValue: 1,
        duration: 760,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
      }),
      Animated.delay(1520),
      Animated.timing(exit, {
        toValue: 0,
        duration: 360,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, [exit, hatDrop, onComplete, wordmark]);

  const wordmarkStyle = {
    opacity: wordmark,
    transform: [
      {
        translateY: wordmark.interpolate({
          inputRange: [0, 1],
          outputRange: [22, 0],
        }),
      },
      {
        scale: wordmark.interpolate({
          inputRange: [0, 1],
          outputRange: [0.82, 1],
        }),
      },
      { skewX: '-7deg' },
    ],
  };

  const hatStyle = {
    opacity: hatDrop,
    transform: [
      {
        translateY: hatDrop.interpolate({
          inputRange: [0, 0.72, 1],
          outputRange: [-160, 8, 0],
        }),
      },
      {
        rotate: hatDrop.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: ['-16deg', '8deg', '0deg'],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.screen, { opacity: exit }]}>
        <View style={styles.wordmarkStage}>
          <Animated.View style={[styles.wordmark, wordmarkStyle]}>
            <Text style={styles.brandText}>A</Text>
            <View style={styles.iSlot}>
              <Animated.View style={[styles.chefHat, hatStyle]}>
                <View style={[styles.hatPuff, styles.hatPuffLeft]} />
                <View style={[styles.hatPuff, styles.hatPuffCenter]} />
                <View style={[styles.hatPuff, styles.hatPuffRight]} />
                <View style={styles.hatBand} />
              </Animated.View>
              <View style={styles.iStem} />
            </View>
            <Text style={styles.brandText}> Sous</Text>
          </Animated.View>

          <Animated.Text style={[styles.brandText, styles.brandTextSecondLine, wordmarkStyle]}>
            Chef
          </Animated.Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1C1F2E',
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1F2E',
    paddingHorizontal: 24,
  },
  wordmarkStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  brandText: {
    ...brandType,
    color: '#FFFFFF',
    fontSize: 54,
    lineHeight: 62,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    textShadowColor: '#FF5C35',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  brandTextSecondLine: {
    marginTop: -4,
  },
  iSlot: {
    width: 20,
    height: 62,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: -2,
    marginRight: 2,
  },
  iStem: {
    width: 13,
    height: 39,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF5C35',
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 3 },
    elevation: 2,
  },
  chefHat: {
    position: 'absolute',
    top: -12,
    width: 44,
    height: 32,
    alignItems: 'center',
  },
  hatPuff: {
    position: 'absolute',
    backgroundColor: '#FFBA35',
    borderColor: '#1C1F2E',
    borderWidth: 2,
  },
  hatPuffLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    left: 2,
    top: 7,
  },
  hatPuffCenter: {
    width: 25,
    height: 25,
    borderRadius: 13,
    top: 0,
  },
  hatPuffRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    right: 2,
    top: 7,
  },
  hatBand: {
    position: 'absolute',
    bottom: 0,
    width: 38,
    height: 12,
    borderRadius: 7,
    backgroundColor: '#FFBA35',
    borderColor: '#1C1F2E',
    borderWidth: 2,
  },
});


