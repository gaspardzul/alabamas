import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Share, TouchableOpacity } from 'react-native';
import { showDialog } from '@/utils/dialog';
import { ThemedText } from '@/components/ThemedText';
import { useRoute, useNavigation } from 'expo-router';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/ts/types';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';
import { useSettings } from '@/hooks/useSettings';
import { Ionicons } from '@expo/vector-icons';
import { generateMultipleHimnosHTML, generateAndSharePDF } from '@/utils/pdfGenerator';
import allHimnos from '@/assets/himnos/allHimnos.json';
import { toTitleCase } from '@/components/ListItem';

type PresentationModeRouteProp = RouteProp<RootStackParamList, 'PresentationMode'>;

interface Verso {
  verse: number;
  text: string;
}

interface Himno {
  title: string;
  number: number | string;
  lyrics: Verso[];
}

const PresentationMode: React.FC = () => {
  const route = useRoute<PresentationModeRouteProp>();
  const navigation = useNavigation();
  const { lista } = route.params as { lista: any };
  const theme = useTheme();
  const { settings } = useSettings();
  const [himnos, setHimnos] = useState<Himno[]>([]);

  useEffect(() => {
    const himnosCompletos = lista.himnos
      .map((numeroHimno: string) => {
        const himnoData = (allHimnos as any)[numeroHimno];
        return himnoData ? { ...himnoData } : null;
      })
      .filter((himno: Himno | null) => himno !== null);
    
    setHimnos(himnosCompletos);
  }, [lista]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleShareText} style={styles.headerButton} accessibilityLabel="Compartir texto">
            <Ionicons name="share-outline" size={21} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSharePDF} style={styles.headerButton} accessibilityLabel="Compartir PDF">
            <Ionicons name="document-text-outline" size={21} color={theme.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [himnos, theme]);

  const handleSharePDF = async () => {
    try {
      if (himnos.length === 0) {
        showDialog('Error', 'No hay himnos para compartir');
        return;
      }

      const html = generateMultipleHimnosHTML(himnos, settings.fontSize, lista.name);
      await generateAndSharePDF(html, `${lista.name}.pdf`);
    } catch (error) {
      showDialog('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
      console.error(error);
    }
  };

  const handleShareText = async () => {
    if (himnos.length === 0) {
      showDialog('Error', 'No hay himnos para compartir');
      return;
    }

    let contenido = `${lista.name}\n\n`;
    
    himnos.forEach((himno, index) => {
      contenido += `Himno #${himno.number} - ${himno.title}\n\n`;
      
      himno.lyrics.forEach((verso) => {
        if (verso.verse === 0) {
          contenido += 'Coro:\n';
        } else {
          contenido += `Verso ${verso.verse}:\n`;
        }
        contenido += verso.text + '\n\n';
      });
      
      if (index < himnos.length - 1) {
        contenido += '---\n\n';
      }
    });

    try {
      await Share.share({
        message: contenido,
        title: lista.name,
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const fontSize = settings.fontSize;
  const lineStyle = { fontSize, lineHeight: Math.round(fontSize * 1.65) };

  const renderHimno = (himno: Himno, index: number) => {
    return (
      <View key={himno.number} style={styles.himnoContainer}>
        <View style={styles.himnoHeader}>
          <ThemedText type="label">
            {String(index + 1).padStart(2, '0')} · Himno #{himno.number}
          </ThemedText>
          <ThemedText style={styles.himnoTitle}>{toTitleCase(himno.title)}</ThemedText>
        </View>

        {himno.lyrics.map((verso, versoIndex) => (
          verso.verse === 0 ? (
            <View
              key={versoIndex}
              style={[styles.chorus, { backgroundColor: theme.chorusSoft, borderLeftColor: theme.chorus }]}
            >
              <ThemedText type="label" style={{ color: theme.chorus }}>Coro</ThemedText>
              <ThemedText style={[styles.coro, lineStyle, { color: theme.chorus }]}>{verso.text}</ThemedText>
            </View>
          ) : (
            <View key={versoIndex} style={styles.versoContainer}>
              <ThemedText type="label" style={{ color: theme.textMuted }}>Estrofa {verso.verse}</ThemedText>
              <ThemedText type="Himno" style={lineStyle}>{verso.text}</ThemedText>
            </View>
          )
        ))}

        {index < himnos.length - 1 && (
          <View style={styles.separator}>
            <View style={[styles.separatorLine, { backgroundColor: theme.border }]} />
            <Ionicons name="musical-notes-outline" size={14} color={theme.secondary} />
            <View style={[styles.separatorLine, { backgroundColor: theme.border }]} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {himnos.map((himno, index) => renderHimno(himno, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter + 4,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl * 2,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  himnoContainer: {
    gap: Spacing.lg,
  },
  himnoHeader: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  himnoTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'center',
  },
  versoContainer: {
    gap: Spacing.sm,
  },
  chorus: {
    borderLeftWidth: 2,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  coro: {
    fontFamily: Fonts.serif,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});

export default PresentationMode;
