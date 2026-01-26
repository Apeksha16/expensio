// Mock for react-native-web/Libraries/Utilities/codegenNativeComponent
// This is used by react-native-safe-area-context but doesn't exist in react-native-web
export default function codegenNativeComponent<T>(componentName: string) {
    return componentName as any as T;
}
