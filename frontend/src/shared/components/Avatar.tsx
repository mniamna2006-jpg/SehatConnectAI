import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, radius } from '../theme';
import { getInitials } from '../utils/formatters';

export function Avatar({
  name,
  imageUrl,
  size = 58,
  tone = 'blue',
}: {
  name?: string;
  imageUrl?: string;
  size?: number;
  tone?: 'blue' | 'teal';
}) {
  const backgroundColor = tone === 'teal' ? colors.tealSoft : colors.primarySoft;
  const color = tone === 'teal' ? colors.teal : colors.primary;
  const style = { width: size, height: size, borderRadius: Math.min(size / 2, radius.lg) };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={style} contentFit="cover" transition={150} accessibilityLabel={name} />;
  }

  return (
    <View style={[styles.fallback, style, { backgroundColor }]} accessibilityLabel={name}>
      <Text style={[styles.initials, { color, fontSize: Math.max(14, size * 0.3) }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '800', letterSpacing: -0.4 },
});
