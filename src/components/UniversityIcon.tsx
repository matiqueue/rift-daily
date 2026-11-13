import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { UsosInstallation } from '@/api/installations';

interface UniversityIconProps {
  installation: UsosInstallation;
  size?: number;
}

export function UniversityIcon({ installation, size = 44 }: UniversityIconProps) {
  const [imgError, setImgError] = useState(false);
  const borderRadius = Math.round(size * 0.3);
  const innerSize = Math.round(size * 0.66);

  const hasImage = !imgError && (installation.iconSource || installation.logoUrl);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: hasImage ? '#FFFFFF' : installation.accentColor,
          borderColor: hasImage ? 'rgba(148, 163, 184, 0.22)' : 'transparent',
        },
      ]}>
      {hasImage ? (
        <Image
          source={
            installation.iconSource
              ? installation.iconSource
              : { uri: installation.logoUrl }
          }
          style={{ width: innerSize, height: innerSize, borderRadius: 4 }}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <Text
          style={[
            styles.fallbackText,
            { fontSize: Math.max(10, Math.round(size * 0.28)) },
          ]}>
          {installation.shortName.slice(0, 4)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
