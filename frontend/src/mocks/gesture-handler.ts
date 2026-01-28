// Mock for react-native-gesture-handler
import { View } from 'react-native';

export const GestureHandlerRootView = View;
export const PanGestureHandler = View;
export const Swipeable = View;
export const State = {
    UNDETERMINED: 0,
    FAILED: 1,
    BEGAN: 2,
    CANCELLED: 3,
    ACTIVE: 4,
    END: 5,
};
export const RectButton = View;
export const BorderlessButton = View;
export default {
    GestureHandlerRootView,
    PanGestureHandler,
    Swipeable,
    State,
    RectButton,
    BorderlessButton,
};
