import {
  DETECT_INGREDIENTS_FUNCTION_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_ENABLED,
} from '@/constants/supabase';
import { brandType } from '@/constants/brand';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Ingredient = {
  name: string;
  confidence: number;
  source: 'vision' | 'label' | 'mixed';
};

type DetectionPreviewResponse = {
  confirmedIngredients: Ingredient[];
  possibleIngredients: Ingredient[];
};

const PREVIEW_SCAN_MAX_EDGE = 900;

function isIngredient(value: unknown): value is Ingredient {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.name === 'string' &&
    typeof item.confidence === 'number' &&
    (item.source === 'vision' || item.source === 'label' || item.source === 'mixed')
  );
}

function isDetectionPreviewResponse(value: unknown): value is DetectionPreviewResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    Array.isArray(item.confirmedIngredients) &&
    item.confirmedIngredients.every(isIngredient) &&
    Array.isArray(item.possibleIngredients) &&
    item.possibleIngredients.every(isIngredient)
  );
}

async function readErrorBody(response: Response) {
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

async function localImageToDataUrl(localImageUri: string) {
  const normalizedImage = await ImageManipulator.manipulateAsync(
    localImageUri,
    [{ resize: { width: PREVIEW_SCAN_MAX_EDGE } }],
    {
      base64: true,
      compress: 0.65,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  if (!normalizedImage.base64) {
    throw new Error('Preview image could not be converted for detection');
  }

  return `data:image/jpeg;base64,${normalizedImage.base64}`;
}

async function getFunctionHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
  };
}

export default function CameraScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const previewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPreviewScanningRef = useRef(false);
  const { goal } = useLocalSearchParams<{ goal?: string }>();
  const normalizedGoal = typeof goal === 'string' ? goal : '';
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPreviewScanning, setIsPreviewScanning] = useState(false);
  const [previewIngredients, setPreviewIngredients] = useState<string[]>([]);
  const [previewMessage, setPreviewMessage] = useState('Point the camera at your ingredients.');

  const liveAssistEnabled = useMemo(() => SUPABASE_ENABLED && Boolean(normalizedGoal), [normalizedGoal]);

  const runPreviewScan = useCallback(async () => {
    if (!cameraRef.current || !liveAssistEnabled || isPreviewScanningRef.current || !isCameraReady) {
      return;
    }

    try {
      isPreviewScanningRef.current = true;
      setIsPreviewScanning(true);

      const snapshot = await cameraRef.current.takePictureAsync({
        quality: 0.25,
        skipProcessing: true,
      });

      if (!snapshot?.uri) {
        return;
      }

      const imageDataUrl = await localImageToDataUrl(snapshot.uri);
      const headers = await getFunctionHeaders();
      const response = await fetch(DETECT_INGREDIENTS_FUNCTION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageUri: imageDataUrl,
          goal: normalizedGoal,
          mode: 'preview',
        }),
      });

      if (!response.ok) {
        const errorBody = await readErrorBody(response);
        console.log('Preview detection backend error:', errorBody);
        throw new Error('Preview request failed');
      }

      const data = await response.json();

      if (!isDetectionPreviewResponse(data)) {
        throw new Error('Preview response shape was invalid');
      }

      const previewPool = [...data.confirmedIngredients, ...data.possibleIngredients];
      const topIngredients = previewPool
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 4)
        .map((ingredient) => ingredient.name);

      setPreviewIngredients(topIngredients);

      if (topIngredients.length > 0) {
        setPreviewMessage(`Live preview sees: ${topIngredients.join(', ')}`);
      } else {
        setPreviewMessage('Move closer, reduce glare, or face labels upward for better detection.');
      }
    } catch (error) {
      console.log('Preview scan failed:', error);
      setPreviewMessage('Live preview is having trouble reading items. Try brighter lighting or less clutter.');
    } finally {
      isPreviewScanningRef.current = false;
      setIsPreviewScanning(false);
    }
  }, [isCameraReady, liveAssistEnabled, normalizedGoal]);

  useEffect(() => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!liveAssistEnabled || !isCameraReady) {
      if (!normalizedGoal) {
        setPreviewMessage('Choose a goal first for live ingredient preview, or just capture a photo.');
      } else if (!SUPABASE_ENABLED) {
        setPreviewMessage('Configure Supabase to enable live ingredient preview.');
      }

      return;
    }

    runPreviewScan();
    previewIntervalRef.current = setInterval(() => {
      runPreviewScan();
    }, 12000);

    return () => {
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
        previewIntervalRef.current = null;
      }
    };
  }, [isCameraReady, liveAssistEnabled, normalizedGoal, runPreviewScan]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.95,
      });

      if (!result?.uri) {
        throw new Error('No image captured');
      }

      router.replace({
        pathname: '/(tabs)/ai-souschef',
        params: {
          capturedImageUri: result.uri,
          capturedAt: Date.now().toString(),
        },
      });
    } catch (error) {
      console.log('Capture failed:', error);
      Alert.alert('Camera error', 'We could not capture that photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF5C35" />
          <Text style={styles.helperText}>Preparing camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Camera Access Needed</Text>
          <Text style={styles.helperText}>
            Allow camera access so AI Sous Chef can preview and capture your ingredients.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setIsCameraReady(true)}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Live Ingredient Preview</Text>
          <Text style={styles.helperText}>{previewMessage}</Text>
          <View style={styles.chipRow}>
            {previewIngredients.length > 0 ? (
              previewIngredients.map((ingredient) => (
                <View key={ingredient} style={styles.chip}>
                  <Text style={styles.chipText}>{ingredient}</Text>
                </View>
              ))
            ) : (
              <View style={styles.chipMuted}>
                <Text style={styles.chipText}>Waiting for recognizable items</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.captureHint}>
            Spread items out, keep labels visible, and hold steady before capturing.
          </Text>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.85}>
            {isCapturing ? <ActivityIndicator color="#1C1F2E" /> : <View style={styles.captureInner} />}
          </TouchableOpacity>

          {isPreviewScanning ? (
            <Text style={styles.scanStatus}>Refreshing live preview...</Text>
          ) : (
            <Text style={styles.scanStatus}>Preview refreshes about every 12 seconds</Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1C1F2E',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  topBar: {
    alignItems: 'flex-start',
  },
  previewCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(28,31,46,0.9)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 10,
  },
  previewTitle: {
    ...brandType,
    color: '#FFFFFF',
    fontSize: 20,
    textTransform: 'uppercase',
  },
  title: {
    ...brandType,
    color: '#1C1F2E',
    fontSize: 28,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  helperText: {
    color: '#8E93A8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,92,53,0.22)',
    borderColor: '#FF5C35',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipMuted: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomPanel: {
    alignItems: 'center',
    gap: 14,
  },
  captureHint: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: 'rgba(28,31,46,0.84)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFBA35',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  captureButtonDisabled: {
    opacity: 0.65,
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1C1F2E',
  },
  scanStatus: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 54,
    minWidth: 170,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FF5C35',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(28,31,46,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  buttonText: {
    ...brandType,
    color: '#FFFFFF',
    fontSize: 16,
    textTransform: 'uppercase',
  },
});

