import { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const PET_HEIGHT = 90;

const pets = [
  require('@/assets/images/pet01.gif'),
  require('@/assets/images/pet02.gif'),
  require('@/assets/images/pet03.gif'),
  require('@/assets/images/pet04.gif'),
];

function SinglePet({
  source,
  initialX,
  initialY,
  size,
  index,
}: {
  source: any;
  initialX: number;
  initialY: number;
  size: number;
  index: number;
}) {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const savedTranslateX = useSharedValue(initialX);
  const savedTranslateY = useSharedValue(initialY);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(initialY + 10, { duration: 500 + index * 100 }),
        withTiming(initialY, { duration: 500 + index * 100 })
      ),
      -1,
      true
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.Image
        source={source}
        style={[
          styles.pet,
          {
            width: size,
            height: PET_HEIGHT,
          },
          animatedStyle,
        ]}
        resizeMode="contain"
      />
    </GestureDetector>
  );
}

export function PetAnimation() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const baseX = SCREEN_WIDTH - 280;
  const baseY = SCREEN_HEIGHT - 158;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {pets.map((source, index) => {
        const size = 100 - index * 10;
        const offsetX = index * 50;
        return (
          <SinglePet
            key={index}
            source={source}
            initialX={baseX + offsetX}
            initialY={baseY}
            size={size}
            index={index}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  pet: {
    position: 'absolute',
  },
});