export namespace PerPlexed {
    export interface Status {
        ready: boolean;
        error: boolean;
        message: string;
    }

    export namespace Sync {
        export interface SocketError {
            type: string;
            message: string;
        }

        export interface Ready {
            room: string;
            host: boolean;
        }

        export interface PlayBackState {
            key?: string;
            state: string;
            time?: number;
        }

        export interface Member {
            uid: string;
            socket: string;
            name: string;
            avatar: string;
        }
    }

    export namespace Remote {
        export type ActionType = "resume" | "pause" | "seek" | "launch" | "skipMarker" | "setAudioTrack" | "setSubtitleTrack" | "setQuality";

        export interface RemoteAction {
            target: string;
            action: ActionType;
            data?: {
                position?: number; // in seconds
                itemRatingKey?: string; // for launch actions
                targetTrackID?: number; // for audio and subtitle track actions
                quality?: number; // for quality actions
            };
        }

        export interface DeviceID {
            socket: string;
            id: string;
            type: "mobile" | "desktop" | "tv" | "web";
            friendlyName: string;
            isControllable: boolean;
            isRemote: boolean;
        }

        export interface PlaybackState {
            deviceID: DeviceID; // the device that is currently playing
            state: "playing" | "paused" | "stopped";
            position: number; // in seconds
            itemRatingKey: string | null; // the rating key of the currently playing item
            trackID?: number;

            avaliableQualities?: number[]; // optional, available qualities for the item
            currentQuality?: number; // optional, the currently playing quality

            audioTracks?: MediaTrack[]; // optional, available audio tracks
            subtitleTracks?: MediaTrack[]; // optional, available subtitle tracks

            skipMarkerText?: string | null; // optional, text for the skip marker
        }

        export interface MediaTrack {
            id: number;
            title: string;
            selected: boolean;
        }
    }

    export namespace PlexTV {
        export interface User {
            id: number;
            uuid: string;
            username: string;
            title: string;
            email: string;
            friendlyName: string;
            locale: string | null;
            confirmed: boolean;
            joinedAt: number;
            emailOnlyAuth: boolean;
            hasPassword: boolean;
            protected: boolean;
            thumb: string;
            authToken: string;
            mailingListStatus: string | null;
            mailingListActive: boolean;
            scrobbleTypes: string;
            country: string;
            pin: string;
            subscription: {
                active: boolean;
                subscribedAt: number | null;
                status: string;
                paymentService: string | null;
                plan: string | null;
                features: string[];
            };
            subscriptionDescription: string | null;
            restricted: boolean;
            anonymous: boolean | null;
            restrictionProfile: string | null;
            mappedRestrictionProfile: string | null;
            customRestrictions: {
                all: string | null;
                movies: string | null;
                music: string | null;
                photos: string | null;
                television: string | null;
            };
            home: boolean;
            guest: boolean;
            homeSize: number;
            homeAdmin: boolean;
            maxHomeSize: number;
            rememberExpiresAt: number | null;
            profile: {
                autoSelectAudio: boolean;
                defaultAudioAccessibility: number;
                defaultAudioLanguage: string | null;
                defaultAudioLanguages: string[] | null;
                defaultSubtitleLanguage: string | null;
                defaultSubtitleLanguages: string[] | null;
                autoSelectSubtitle: number;
                defaultSubtitleAccessibility: number;
                defaultSubtitleForced: number;
                watchedIndicator: number;
                mediaReviewsVisibility: number;
                mediaReviewsLanguages: string[] | null;
            };
            entitlements: string[];
            services: {
                identifier: string;
                endpoint: string;
                token: string | null;
                secret: string | null;
                status: string;
            }[];
            adsConsent: string | null;
            adsConsentSetAt: number | null;
            adsConsentReminderAt: number | null;
            experimentalFeatures: boolean;
            twoFactorEnabled: boolean;
            backupCodesCreated: boolean;
            attributionPartner: string | null;
        }
    }
}