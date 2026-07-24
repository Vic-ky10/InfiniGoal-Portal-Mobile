import { Platform, NativeModules } from "react-native";

const getDevHost = () => {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    if (match) {
      return match[1];
    }
  }
  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
};

const devHost = getDevHost();

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_API_URL || `http://${devHost}:3000`;

  console.log("API_BASE_URL:", API_BASE_URL);
