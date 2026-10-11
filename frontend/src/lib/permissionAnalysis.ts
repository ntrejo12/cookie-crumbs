export type PermissionSetting =
  | "allow"
  | "block"
  | "ask"
  | "unknown";

export interface PermissionAnalysis {
  location: PermissionSetting;
  notifications: PermissionSetting;
  camera: PermissionSetting;
  microphone: PermissionSetting;
}

type ChromeSetting = chrome.contentSettings.ContentSetting<
  "allow" | "block" | "ask"
>;

async function inspectSetting(
  setting: ChromeSetting | undefined,
  pageUrl: string,
): Promise<PermissionSetting> {
  if (!setting) {
    return "unknown";
  }
  try {
    const result = await setting.get({
      primaryUrl: pageUrl,
    });

    if (
      result.setting === "allow" ||
      result.setting === "block" ||
      result.setting === "ask"
    ) {
      return result.setting;
    }

    return "unknown";
  } catch (error) {
    console.warn("Unable to inspect content setting:", error);
    return "unknown";
  }
}

export async function analyzePermissions(
  pageUrl: string,
): Promise<PermissionAnalysis> {
  const unknown: PermissionAnalysis = {
    location: "unknown",
    notifications: "unknown",
    camera: "unknown",
    microphone: "unknown",
  };

  if (
    typeof chrome === "undefined" ||
    !chrome.contentSettings
  ) {
    console.warn(
      "Chrome contentSettings API is unavailable.",
    );

    return unknown;
  }

  const [location, notifications, camera, microphone] =
    await Promise.all([
      inspectSetting(
        chrome.contentSettings.location,
        pageUrl,
      ),
      inspectSetting(
        chrome.contentSettings.notifications,
        pageUrl,
      ),
      inspectSetting(
        chrome.contentSettings.camera,
        pageUrl,
      ),
      inspectSetting(
        chrome.contentSettings.microphone,
        pageUrl,
      ),
    ]);

  return {
    location,
    notifications,
    camera,
    microphone,
  };
}
