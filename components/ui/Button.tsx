/**
 * TickBill — Button Component
 * Premium, animated button with variants
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { BorderRadius, Spacing } from '@/constants/Spacing';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const getButtonStyles = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: BorderRadius.xl, // Match Timer's startButton corner radius (BorderRadius.xl = 20)
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    };

    // Size
    switch (size) {
      case 'sm':
        base.paddingHorizontal = Spacing.base;
        base.height = 40;
        break;
      case 'lg':
        base.paddingHorizontal = Spacing.xl;
        base.height = 56;
        break;
      default:
        base.paddingHorizontal = Spacing.lg;
        base.height = 48;
    }

    // Variant
    switch (variant) {
      case 'primary':
        base.backgroundColor = theme.primary;
        base.shadowColor = theme.primary;
        base.shadowOpacity = 0.4;
        base.shadowOffset = { width: 0, height: 4 };
        base.shadowRadius = 12;
        base.elevation = 6;
        break;
      case 'secondary':
        base.backgroundColor = theme.primarySoft;
        base.borderWidth = 1;
        base.borderColor = theme.primary + '30';
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      case 'danger':
        base.backgroundColor = theme.danger;
        break;
      case 'success':
        base.backgroundColor = theme.success;
        break;
    }

    if (disabled) {
      base.opacity = 0.5;
    }

    if (fullWidth) {
      base.width = '100%';
    }

    return base;
  };

  const getTextStyles = (): TextStyle => {
    const base: TextStyle = size === 'sm' ? { ...Typography.buttonSmall } : { ...Typography.button };

    switch (variant) {
      case 'primary':
        base.color = '#000000'; // Black text for maximum contrast with neon green
        break;
      case 'danger':
      case 'success':
        base.color = '#FFFFFF';
        break;
      case 'secondary':
        base.color = theme.primary;
        break;
      case 'ghost':
        base.color = theme.primary;
        break;
    }

    return base;
  };

  const ButtonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#000000' : variant === 'danger' ? '#FFF' : theme.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={getTextStyles()} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={disabled || loading}
        style={[getButtonStyles(), style]}
      >
        {ButtonContent}
      </TouchableOpacity>
    );
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[animatedStyle, getButtonStyles(), style]}
    >
      {ButtonContent}
    </AnimatedTouchable>
  );
}
