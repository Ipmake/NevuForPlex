import axios from "axios";
import { authedGet, authedPost, authedPut, getIncludeProps, getXPlexProps, queryBuilder } from "./QuickFunctions";
import './plex.d.ts'
import { getBackendURL } from "../backendURL";
import { platformCache } from "../common/DesktopApp";

export async function getAllLibraries(): Promise<Plex.LibarySection[]> {
    const res = await authedGet(`/library/sections`);
    return res.MediaContainer.Directory;
}

export async function getLibrary(key: string): Promise<Plex.MediaContainer> {
    const res = await authedGet(`/library/sections/${key}?${queryBuilder({
        ...getIncludeProps(),
    })}`);
    return res.MediaContainer;
}

/**
 * @deprecated This function is deprecated. Use `getLibraryDir` instead.
 */
export async function getLibraryMedia(path: string): Promise<Plex.Metadata[]> {
    const res = await authedGet(`/library${path}`);
    return res.MediaContainer.Metadata;
}

/**
 * Fetches the items from the library directory.
 *
 * @param {string} key - The uri to identify the library directory. e.g. /library/sections/1/all
 * @param {Object.<string, any>} props - Additional properties to include in the query.
 * @returns {Promise<Plex.Metadata[]>} - A promise that resolves to an array of metadata items.
 */
export async function getLibraryDir(key: string, props?: { [key: string]: any }): Promise<Plex.MediaContainer> {
    const res = await authedGet(`${key}?${queryBuilder({
        ...props,
        ...getIncludeProps(),
    })}`);
    return res.MediaContainer;
}

export async function getLibrarySecondary(key: string, directory: string): Promise<Plex.Directory[]> {
    const res = await authedGet(`/library/sections/${key}/${directory}`);
    return res.MediaContainer.Directory;
}

export async function getLibraryMeta(id: string): Promise<Plex.Metadata> {
    if (!id) return {} as Plex.Metadata;
    const res = await authedGet(`/library/metadata/${id}?${queryBuilder({
        ...getIncludeProps(),
        ...getXPlexProps()
    })}`);
    return res.MediaContainer.Metadata[0];
}

export async function getLibraryMetaChildren(id: string): Promise<Plex.Metadata[]> {
    const res = await authedGet(`/library/metadata/${id}/children?${queryBuilder({
        ...getIncludeProps(),
        ...getXPlexProps()
    })}`);
    return res.MediaContainer.Metadata;

}

export async function getSimilar(id: string): Promise<Plex.Metadata[]> {
    if (!id) return [];
    const res = await authedGet(`/library/metadata/${id}/similar?${queryBuilder({
        limit: 10,
        excludeFields: "summary",
        includeMarkerCounts: 1,
        includeRelated: 1,
        includeExternalMedia: 1,
        async: 1,
        ...getXPlexProps()
    })}`);
    return res.MediaContainer.Metadata;
}

export async function getUniversalDecision(id: string, limitation: {
    autoAdjustQuality?: boolean,
    maxVideoBitrate?: number,
}): Promise<void> {
    await authedGet(`/video/:/transcode/universal/decision?${queryBuilder({
        ...getStreamProps(id, limitation),
    })}`);
    return;
}

export async function sendUniversalPing() {
    await authedGet(`/video/:/transcode/universal/ping?${queryBuilder({
        ...getXPlexProps()
    })}`);
    return;
}

/**
 * Generates the stream properties for a given media ID with optional limitations.
 *
 * @param key - The unique rating key for the media.
 * @param limitation - An object containing optional limitations for the stream.
 * @param limitation.autoAdjustQuality - Whether to automatically adjust the quality of the stream.
 * @param limitation.maxVideoBitrate - The maximum video bitrate for the stream.
 * @returns An object containing the stream properties.
 */
export function getStreamProps(key: string, limitation: {
    autoAdjustQuality?: boolean,
    maxVideoBitrate?: number,
}) {
    return {
        audioBoost: 700,
        autoAdjustQuality: limitation.autoAdjustQuality ? 1 : 0,
        autoAdjustSubtitle: 0,
        directPlay: 0,
        directStream: 1,
        directStreamAudio: 1,
        fastSeek: 1,
        hasMDE: 1,
        location: "lan",
        mediaBufferSize: 102400,
        mediaIndex: 0,
        partIndex: 0,
        path: "/library/metadata/" + key,
        protocol: platformCache.isDesktop ? "hls" : "dash",
        addDebugOverlay: 0,
        subtitleSize: 100,
        subtitles: "burn",
        "Accept-Language": "en",
        ...getXPlexProps(),
        ...(limitation.autoAdjustQuality && {
            autoAdjustQuality: limitation.autoAdjustQuality ? 1 : 0
        }),
        ...(limitation.maxVideoBitrate && {
            maxVideoBitrate: limitation.maxVideoBitrate
        })
    }
}

/**
 * Updates the audio stream for a specific part in the library.
 *
 * @param partID - The ID of the part to update.
 * @param streamID - The ID of the new audio stream to set.
 * @returns A promise that resolves when the update is complete.
 */
export async function putAudioStream(partID: number, streamID: number): Promise<void> {
    await authedPut(`/library/parts/${partID}?${queryBuilder({
        audioStreamID: streamID,
        ...getXPlexProps()
    })}`, {});
}

/**
 * Sends an authenticated PUT request to update the subtitle stream for a given part.
 *
 * @param partID - The ID of the part to update.
 * @param streamID - The ID of the subtitle stream to set.
 * @returns A promise that resolves when the request is complete.
 */
export async function putSubtitleStream(partID: number, streamID: number): Promise<void> {
    await authedPut(`/library/parts/${partID}?${queryBuilder({
        subtitleStreamID: streamID,
        ...getXPlexProps()
    })}`, {});
}

/**
 * Fetches a timeline update for a given item.
 *
 * @param key - The ID of the item to get the timeline update for.
 * @param duration - The duration of the item in milliseconds.
 * @param state - The current state of the item (e.g., playing, paused).
 * @param time - The current playback time in milliseconds.
 * @returns A promise that resolves to a `Plex.TimelineUpdateResult` object containing the timeline update information.
 */
export async function getTimelineUpdate(key: number, duration: number, state: string, time: number): Promise<Plex.TimelineUpdateResult> {
    return await authedGet(`/:/timeline?${queryBuilder({
        ratingKey: key,
        key: `/library/metadata/${key}/`,
        duration: duration,
        state: state,
        playbackTime: time,
        time: time,
        context: "library",
        ...getXPlexProps()
    })}`);
}

/**
 * Fetches the server preferences from the Plex server.
 *
 * @returns {Promise<Plex.ServerPreferences>} A promise that resolves to the server preferences.
 */
export async function getServerPreferences(): Promise<Plex.ServerPreferences> {
    const res = await authedGet(`/`);
    return res.MediaContainer;
}

/**
 * Retrieves the play queue for a given URI.
 *
 * @param uri - The URI of the media item to get the play queue for.
 * @returns A promise that resolves to an array of Plex metadata objects.
 */
export async function getPlayQueue(uri: string): Promise<Plex.Metadata[]> {
    const res = await authedPost(`/playQueues?${queryBuilder({
        type: "video",
        uri,
        continuous: 1,
        ...getIncludeProps(),
        ...getXPlexProps()
    })}`);
    return res.MediaContainer.Metadata;
}

/**
 * Generates a URL for transcoding an image with the specified dimensions.
 *
 * @param url - The URL of the image to be transcoded.
 * @param width - The desired width of the transcoded image.
 * @param height - The desired height of the transcoded image.
 * @returns The URL for the transcoded image.
 */
export function getTranscodeImageURL(url: string, width: number, height: number) {
    return `${getBackendURL()}/dynproxy/photo/:/transcode?${queryBuilder({
        width,
        height,
        url,
        "X-Plex-Token": localStorage.getItem("accessToken") as string,
    })}`;
}

/**
 * Retrieves an access token from the Plex API using the provided PIN.
 *
 * @param {string} pin - The PIN code used to request the access token.
 * @returns {Promise<Plex.TokenData>} A promise that resolves to the token data.
 */
export async function getAccessToken(pin: string): Promise<Plex.TokenData> {
    const res = await axios.get(`https://plex.tv/api/v2/pins/${pin}?${queryBuilder({
        "X-Plex-Client-Identifier": localStorage.getItem("clientID")
    })}`)
    return res.data;
}

/**
 * Retrieves a pin from the Plex API.
 *
 * This function sends a POST request to the Plex API to generate a pin.
 * The request includes the client identifier and product name as query parameters.
 *
 * @returns {Promise<Plex.TokenData>} A promise that resolves to the token data returned by the Plex API.
 *
 * @throws {Error} Throws an error if the request fails.
 */
export async function getPin(): Promise<Plex.TokenData> {
    const res = await axios.post(`https://plex.tv/api/v2/pins?${queryBuilder({
        "X-Plex-Client-Identifier": localStorage.getItem("clientID"),
        "X-Plex-Product": "NEVU"
    })}`)
    return res.data;
}

/**
 * Fetches the logged-in user's data from the Plex API.
 *
 * @returns {Promise<Plex.UserData | null>} A promise that resolves to the user's data if the request is successful, or null if it fails.
 *
 * The function constructs a query string with the necessary headers and sends a GET request to the Plex API.
 * If the request fails, it logs the error and returns an object with the status and error message.
 * If the request is successful and returns a status of 200, it returns the user data.
 * Otherwise, it returns null.
 */
export async function getLoggedInUser(): Promise<Plex.UserData | null> {
    const res = await axios.get(`https://plex.tv/api/v2/user?${queryBuilder({
        "X-Plex-Token": localStorage.getItem("accAccessToken") as string,
        "X-Plex-Product": "NEVU",
        "X-Plex-Client-Identifier": localStorage.getItem("clientID")
    })}`).catch((err) => {
        console.log(err);
        return { status: err.response?.status || 500, data: err.response?.data || 'Internal server error' }
    });
    if (res.status === 200) return res.data;
    else return null;
}

/**
 * Fetches search results from the Plex library based on the provided query.
 *
 * @param query - The search query string.
 * @returns A promise that resolves to an array of Plex search results.
 *
 * The function constructs a URL with the search query and additional parameters,
 * including collections, extras, search types (movies, other videos, TV), and a limit of 100 results.
 * It also includes the Plex access token from local storage for authentication.
 *
 * @throws Will throw an error if the request fails.
 */
export async function getSearch(query: string): Promise<Plex.SearchResult[]> {
    const res = await authedGet(`/library/search?${queryBuilder({
        query,
        "includeCollections": 1,
        "includeExtras": 1,
        "searchTypes": "movies,otherVideos,tv",
        "limit": 100,
        "X-Plex-Token": localStorage.getItem("accessToken") as string
    })}`);
    return res.MediaContainer.SearchResult;
}

/**
 * Sets the media played status for a given rating key.
 *
 * This function sends a request to either scrobble or unscrobble a media item
 * based on the `watched` parameter. If `watched` is true, the media item is marked
 * as watched (scrobbled). If `watched` is false, the media item is marked as unwatched
 * (unscrobbled).
 *
 * @param watched - A boolean indicating whether the media item has been watched.
 * @param ratingKey - The unique identifier for the media item.
 * @returns A promise that resolves when the request is complete.
 */
export async function setMediaPlayedStatus(watched: boolean, ratingKey: string): Promise<void> {
    if (watched) {
        await authedGet(`/:/scrobble?${queryBuilder({
            key: ratingKey,
            identifier: "com.plexapp.plugins.library",
            ...getXPlexProps()
        })}`);
    } else {
        await authedGet(`/:/unscrobble?${queryBuilder({
            key: ratingKey,
            identifier: "com.plexapp.plugins.library",
            ...getXPlexProps()
        })}`);
    }
}

/**
 * Sets the media rating for a given media item.
 *
 * @param rating - The rating to be set for the media item.
 * @param ratingKey - The unique key identifying the media item.
 * @returns A promise that resolves when the rating has been set.
 */
export async function setMediaRating(rating: number, ratingKey: string): Promise<void> {
    await authedGet(`/:/rate?${queryBuilder({
        identifier: "com.plexapp.plugins.library",
        key: ratingKey,
        rating,
        ...getXPlexProps()
    })}`);
}

export interface LibraryDir {
    title: string;
    library: string;
    Metadata: Plex.Metadata[];
}


/**
 * Retrieves an item by its GUID from the Plex library.
 *
 * @param guid - The GUID of the item to retrieve.
 * @returns A promise that resolves to the item's metadata if found, or null if not found.
 *
 * @remarks
 * This function sends an authenticated GET request to the Plex library endpoint with various query parameters
 * to include external media, metadata, marker counts, and related items. The Plex access token is retrieved
 * from local storage and included in the request.
 *
 * @example
 * ```typescript
 * const metadata = await getItemByGUID("some-guid");
 * if (metadata) {
 *     console.log("Item found:", metadata);
 * } else {
 *     console.log("Item not found");
 * }
 * ```
 */
export async function getItemByGUID(guid: string): Promise<Plex.Metadata | null> {
    const res = await authedGet(`/library/all?${queryBuilder({
        guid,
        "includeExternalMedia": 1,
        "includeMeta": 1,
        "includeMarkerCounts": 1,
        "includeRelated": 1,
        "X-Plex-Token": localStorage.getItem("accessToken") as string
    })}`);

    if (res.MediaContainer.Metadata?.[0]?.guid !== guid) return null;

    return res.MediaContainer.Metadata?.[0];
}