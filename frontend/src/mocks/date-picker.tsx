// Mock for react-native-date-picker
import React from 'react';
import { View, Text } from 'react-native';

const DatePicker = (props: any) => {
    return (
        <View style= {{ padding: 10, borderWidth: 1, borderColor: '#ccc' }
}>
    <Text>Date Picker not supported on Web </Text>
        </View>
  );
};

export default DatePicker;
