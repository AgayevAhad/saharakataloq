declare module 'react-native' {
  import * as React from 'react';

  export interface ViewStyle {
    [key: string]: any;
  }

  export interface TextStyle {
    [key: string]: any;
  }

  export interface ImageStyle {
    [key: string]: any;
  }

  export type StyleProp<T> = T | Array<T | undefined | null | false> | undefined | null | false;

  export interface ViewProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface TextProps {
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface ImageProps {
    source: { uri: string } | number;
    style?: StyleProp<ImageStyle>;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    [key: string]: any;
  }

  export interface TouchableOpacityProps {
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    activeOpacity?: number;
    children?: React.ReactNode;
    title?: string;
    [key: string]: any;
  }

  export interface TextInputProps {
    style?: StyleProp<TextStyle>;
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    multiline?: boolean;
    numberOfLines?: number;
    [key: string]: any;
  }

  export interface ScrollViewProps {
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface ModalProps {
    visible?: boolean;
    animationType?: 'none' | 'slide' | 'fade';
    transparent?: boolean;
    onRequestClose?: () => void;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const View: React.FC<ViewProps>;
  export const Text: React.FC<TextProps>;
  export const Image: React.FC<ImageProps>;
  export const TouchableOpacity: React.FC<TouchableOpacityProps>;
  export const Pressable: React.FC<TouchableOpacityProps>;
  export const TextInput: React.FC<TextInputProps>;
  export const ScrollView: React.FC<ScrollViewProps>;
  export const SafeAreaView: React.FC<ViewProps>;
  export const Modal: React.FC<ModalProps>;

  export namespace StyleSheet {
    export function create<T extends { [key: string]: any }>(styles: T): T;
  }

  export const Platform: {
    OS: 'web' | 'ios' | 'android';
    select: <T>(specifics: { [platform: string]: T }) => T;
  };

  export const Dimensions: {
    get: (dim: 'window' | 'screen') => { width: number; height: number; scale: number; fontScale: number };
    addEventListener: (type: string, handler: Function) => { remove: () => void };
  };

  export const Linking: {
    openURL: (url: string) => Promise<any>;
    canOpenURL: (url: string) => Promise<boolean>;
  };
}

declare module 'react-native-web' {
  export * from 'react-native';
}
