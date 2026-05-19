/**
 * TickBill — Card Component
 * Elevated surface container with press animation
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/Spacing';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  noPadding?: boolean;
}

export function Card({
  children,
  onPress,
  onLongPress,
  style,
  padding,
  noPadding = false,
}: CardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress || onLongPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.surface,
    borderRadius: BorderRadius.lg,
    padding: noPadding ? 0 : (padding ?? Spacing.base),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 8,
    elevation: 2,
  };

  if (onPress || onLongPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[animatedStyle, cardStyle, style]}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <Animated.View style={[animatedStyle, cardStyle, style]}>
      {children}
    </Animated.View>
  );
}
