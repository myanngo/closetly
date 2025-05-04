import * as Font from 'expo-font';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';

export const loadFonts = () => {
  return Font.loadAsync({
    'CircularStd-Book': require('../../assets/fonts/CircularStd-Book.otf'),
    'CircularStd-Medium': require('../../assets/fonts/CircularStd-Medium.otf'),
    'CircularStd-Bold': require('../../assets/fonts/CircularStd-Bold.otf'),
    'InstrumentSerif-Regular': InstrumentSerif_400Regular,
  });
}; 