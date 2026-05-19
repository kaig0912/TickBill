/**
 * TickBill — SelectInput Component
 * Styled dropdown input for selecting from a list of options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { NavArrowDown, Check } from 'iconoir-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography, FontFamily } from '@/constants/Typography';
import { BorderRadius, Spacing } from '@/constants/Spacing';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectInputProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  required?: boolean;
  disabled?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function SelectInput({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Bitte wählen...',
  error,
  hint,
  icon,
  containerStyle,
  required = false,
  disabled = false,
}: SelectInputProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const focusProgress = useSharedValue(0);

  const selectedOption = options.find((o) => o.value === value);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? theme.danger
      : focusProgress.value > 0.5
        ? theme.primary
        : theme.border,
    borderWidth: focusProgress.value > 0.5 ? 1.5 : 1,
  }));

  const handleToggle = () => {
    if (disabled) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    focusProgress.value = withTiming(nextState ? 1 : 0, { duration: 200 });
  };

  const handleSelect = (val: string) => {
    onSelect(val);
    setIsOpen(false);
    focusProgress.value = withTiming(0, { duration: 200 });
  };

  return (
    <View style={[styles.container, containerStyle, { zIndex: isOpen ? 100 : 1 }]}>
      {!!label && (
        <Text style={[Typography.label, { color: error ? theme.danger : theme.textSecondary, marginBottom: Spacing.xs }]}>
          {label}
          {required && <Text style={{ color: theme.danger }}> *</Text>}
        </Text>
      )}

      <TouchableOpacity activeOpacity={0.8} onPress={handleToggle} disabled={disabled}>
        <AnimatedView
          style={[
            styles.inputContainer,
            {
              backgroundColor: disabled
                ? (theme.isDark ? theme.surface : theme.borderLight)
                : (theme.isDark ? theme.surfaceElevated : theme.background),
              borderRadius: BorderRadius.md,
              opacity: disabled ? 0.6 : 1,
            },
            animatedBorderStyle,
          ]}
        >
          {!!icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              Typography.body,
              {
                flex: 1,
                color: selectedOption ? theme.text : theme.textTertiary,
                fontFamily: FontFamily.regular,
                paddingVertical: Spacing.md,
              },
            ]}
            numberOfLines={1}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <NavArrowDown
            color={theme.textSecondary}
            width={20}
            height={20}
            style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
          />
        </AnimatedView>
      </TouchableOpacity>

      {isOpen && (
        <ScrollView
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.shadowColor,
              shadowOpacity: theme.shadowOpacity,
            },
          ]}
          nestedScrollEnabled
        >
          {options.length === 0 ? (
            <View style={styles.optionItem}>
              <Text style={[Typography.body, { color: theme.textTertiary }]}>Keine Optionen verfügbar</Text>
            </View>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.7}
                  style={[
                    styles.optionItem,
                    index < options.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderLight },
                    isSelected && { backgroundColor: theme.primarySoft },
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text
                    style={[
                      Typography.body,
                      { color: isSelected ? theme.primary : theme.text },
                      isSelected && { fontFamily: FontFamily.semibold },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && <Check color={theme.primary} width={18} height={18} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {!!(error || hint) && (
        <Text
          style={[
            Typography.small,
            {
              color: error ? theme.danger : theme.textTertiary,
              marginTop: Spacing.xs,
            },
          ]}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    minHeight: 48,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  dropdown: {
    marginTop: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
});
