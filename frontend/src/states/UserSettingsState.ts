import axios from 'axios';
import { create } from 'zustand';
import { getBackendURL } from '../backendURL';

type UserSettingsOptions = 
"DISABLE_WATCHSCREEN_DARKENING" |
"AUTO_MATCH_TRACKS" |
"AUTO_NEXT_EP" |
string;

export interface UserSettingsState {
    loaded: boolean;
    settings: {
        [key in UserSettingsOptions]: string;
    }
    setSetting: (key: UserSettingsOptions, value: string) => void;
    fetchSettings: () => void;
}

export const useUserSettings = create<UserSettingsState>((set) => ({
    loaded: false,
    settings: {
        DISABLE_WATCHSCREEN_DARKENING: "false",
        AUTO_MATCH_TRACKS: "true",
        AUTO_NEXT_EP: "true",
    },
    setSetting: async (key, value) => {
        await axios.post(`${getBackendURL()}/user/options`, {
            key,
            value,
        }, {
            headers: {
                'X-Plex-Token': localStorage.getItem("accAccessToken"),
            }
        }).then((res) => {
            // Handle response if needed
        }).catch((error) => {
            console.error("Failed to update setting:", error);
        });

        set((state) => ({
            settings: {
                ...state.settings,
                [key]: value,
            }
        }));
    },
    fetchSettings: async () => {
        const settings = await axios.get(`${getBackendURL()}/user/options`, {
            headers: {
                'X-Plex-Token': localStorage.getItem("accAccessToken"),
            }
        }).then((res) => {
            return res.data;
        }).catch(() => {
            return null;
        });

        if (settings) {
            set((state) => {
                const newSettings = { ...state.settings };
                settings.forEach((setting: { key: UserSettingsOptions; value: string }) => {
                    newSettings[setting.key] = setting.value;
                });

                return { settings: newSettings };
            });

            console.log(settings);
        }

        set({ loaded: true });
    },
}));