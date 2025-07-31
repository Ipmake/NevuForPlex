declare namespace PerPlexed {
    interface RecommendationShelf {
        title: string;
        libraryID: string;
        dir: string;
        link: string;
    }

    interface Status {
        ready: boolean;
        error: boolean;
        message: string;
    }

    interface Config {
        PLEX_SERVER: string;
        DEPLOYMENTID: string;
        CONFIG: ConfigOptions
    }

    interface ConfigOptions {
        DISABLE_PROXY: boolean; // DEPRECATED
        DISABLE_NEVU_SYNC: boolean;
    }

    namespace Sync {
        interface SocketError {
            type: string;
            message: string;
        }

        interface Ready {
            room: string;
            host: boolean;
        }

        interface PlayBackState {
            key?: string;
            state: string;
            time?: number;
        }

        interface Member {
            uid: string;
            socket: string;
            name: string;
            avatar: string;
        }
    }

    namespace Reviews {
        interface Review {
            itemID: string;
            userID: string;
            created_at: string;
            rating: number;
            message: string;
            spoilers: boolean;
            visibility: "GLOBAL" | "LOCAL";
            user: ReviewUser;
        }

        interface ReviewUser {
            id: string;
            username: string;
            avatar: string;
        }

        interface ReviewResponse {
            error?: string;
        }
    }
}