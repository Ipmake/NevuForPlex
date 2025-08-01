import { ProxiedRequest } from "../backendURL";
import { platformCache } from "../common/DesktopApp";
import { useSessionStore } from "../states/SessionState";

export async function authedGet(url: string) {
    const res = await ProxiedRequest(url, "GET", {
        'X-Plex-Token': localStorage.getItem("accessToken") as string,
        'accept': 'application/json'
    }).catch((err) => {
        console.log(err);
        return { status: err.response?.status || 500, data: err.response?.data || 'Internal server error' }
    });

    if (res.status === 200) return res.data;
    else return null;
}

export async function authedPost(url: string, body?: any) {
    const res = await ProxiedRequest(url, "POST", {
        'X-Plex-Token': localStorage.getItem("accessToken") as string,
        'accept': 'application/json'
    }, body).catch((err) => {
        console.log(err);
        return { status: err.response?.status || 500, data: err.response?.data || 'Internal server error' }
    });

    if (res.status === 200) return res.data;
    else return null;
}

export async function authedPut(url: string, body: any) {
    const res = await ProxiedRequest(url, "PUT", {
        'X-Plex-Token': localStorage.getItem("accessToken") as string,
        'accept': 'application/json'
    }, body).catch((err) => {
        console.log(err);
        return { status: err.response?.status || 500, data: err.response?.data || 'Internal server error' }
    });

    if (res.status === 200) return res.data;
    else return null;
}

export function queryBuilder(query: any) {
    return Object.keys(query)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(query[k]))
        .join('&');
}

export function getXPlexProps() {
    return {
        "X-Incomplete-Segments": "1",
        "X-Plex-Product": platformCache.platform?.platform ? "Nevu Desktop" : "Nevu Web",
        "X-Plex-Version": "10.26.0.2578",
        "X-Plex-Client-Identifier": localStorage.getItem("clientID"),
        "X-Plex-Platform": platformCache.platform?.platform ?? getBrowserName(),
        "X-Plex-Platform-Version": platformCache.platform?.version ?? getBrowserVersion(),
        "X-Plex-Features": "external-media,indirect-media,hub-style-list",
        "X-Plex-Model": "bundled",
        "X-Plex-Device": platformCache.platform?.platform ? "Chrome" : getBrowserName(),
        "X-Plex-Device-Name": platformCache.deviceName ?? "Nevu Web",
        "X-Plex-Device-Screen-Resolution": getResString(),
        "X-Plex-Token": localStorage.getItem("accessToken"),
        "X-Plex-Language": "en",
        "X-Plex-Session-Id": sessionStorage.getItem("sessionID"),
        "X-Plex-Session-Identifier": useSessionStore.getState().XPlexSessionID,
        "session": useSessionStore.getState().sessionID,
    }
}

export function getResString() {
    // use the screen resolution to determine the quality
    return `${window.screen.width}x${window.screen.height}`;
}

export function getIncludeProps() {
    return {
        includeDetails: 1,
        includeMarkers: 1,
        includeOnDeck: 1,
        includeChapters: 1,
        includeChildren: 1,
        includeExternalMedia: 1,
        includeExtras: 1,
        includeConcerts: 1,
        includeReviews: 1,
        includePreferences: 1,
        includeStations: 1,
        includeRelated: 1,
    }
}

export function makeid(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

export function getBrowserName() {
    let userAgent = navigator.userAgent; 
    let browserName = "Unknown";
  
    // Check for different browsers
    const browsers = [
        { name: "Chrome", identifier: "Chrome" },
        { name: "Safari", identifier: "Safari" },
        { name: "Opera", identifier: "Opera" },
        { name: "Firefox", identifier: "Firefox" },
        { name: "Internet Explorer", identifier: ["MSIE", "Trident"] }
    ];

    for (const browser of browsers) {
        if (Array.isArray(browser.identifier)) {
            if (browser.identifier.some(id => userAgent.includes(id))) {
                browserName = browser.name;
                break;
            }
        } else if (userAgent.includes(browser.identifier)) {
            browserName = browser.name;
            break;
        }
    }
  
    return browserName;
  }

export function getBrowserVersion() {
    let userAgent = navigator.userAgent;
    let browserVersion = "Unknown";

    // Check for different browsers
    const browsers = [
        { name: "Chrome", identifier: "Chrome" },
        { name: "Safari", identifier: "Version" },
        { name: "Opera", identifier: "OPR" },
        { name: "Firefox", identifier: "Firefox" },
        { name: "Internet Explorer", identifier: ["MSIE", "Trident"] }
    ];

    for (const browser of browsers) {
        if (Array.isArray(browser.identifier)) {
            if (browser.identifier.some(id => userAgent.includes(id))) {
                browserVersion = userAgent.split(browser.identifier[0])[1].split(" ")[0];
                break;
            }
        } else if (userAgent.includes(browser.identifier)) {
            browserVersion = userAgent.split(browser.identifier)[1].split(" ")[0];
            break;
        }
    }

    return browserVersion;
}

export function getOS() {
    let userAgent = navigator.userAgent;
    let os = "Unknown";

    // Check for different operating systems
    const operatingSystems = [
        { name: "Windows", identifier: "Windows" },
        { name: "Mac OS", identifier: "Mac OS" },
        { name: "Linux", identifier: "Linux" }
    ];

    for (const operatingSystem of operatingSystems) {
        if (userAgent.includes(operatingSystem.identifier)) {
            os = operatingSystem.name;
            break;
        }
    }

    return os;
}

// uuid generator
export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}