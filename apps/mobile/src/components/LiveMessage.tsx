import { useEffect } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Platform, Text } from 'react-native';
import { announce } from '../adapters/accessibility/announce';

/**
 * Visible message announced once per mount or text change, without moving focus.
 * Web uses role="alert" for errors; other messages and native platforms use the single announcer.
 */
export function LiveMessage({ text, alert = false, style, testID }: {
  text: string; alert?: boolean; style: StyleProp<TextStyle>; testID?: string;
}) {
  useEffect(() => {
    if (!(alert && Platform.OS === 'web')) announce(text);
  }, [text, alert]);
  return <Text accessibilityRole={alert ? 'alert' : 'text'} style={style} {...(testID ? { testID } : {})}>{text}</Text>;
}
