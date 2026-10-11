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

async function inspectSetting(
  setting: chrome.contentSettings.ContentSetting<"allow" | "block" | "ask">,
  pageUrl: string,): Promise<PermissionSetting> {
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
  const [location, notifications, camera, microphone] =
    await Promise.all([
      inspectSetting(chrome.contentSettings.location, pageUrl),
      inspectSetting(chrome.contentSettings.notifications, pageUrl),
      inspectSetting(chrome.contentSettings.camera, pageUrl),
      inspectSetting(chrome.contentSettings.microphone, pageUrl),
    ]);

  return {
    location,
    notifications,
    camera,
    microphone,
  };
}
