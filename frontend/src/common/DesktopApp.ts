export interface DesktopPlatformVersion {
    appVersion: string; // 1.0.0
    arch: string; // x64
    platform: string; // linux
    version: string; // 6.15.7-1-MANJARO
}

export async function getPlatform(): Promise<DesktopPlatformVersion | null> {
    if ((window as any).electronAPI) {
        return await (window as any).electronAPI.getPlatform();
    }
    return null;
}

export const platformCache: {
    platform: DesktopPlatformVersion | null;
} = {
    platform: null
};