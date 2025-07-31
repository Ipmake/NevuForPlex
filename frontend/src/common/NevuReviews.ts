import axios, { AxiosError } from "axios";
import { getBackendURL } from "../backendURL";

export async function getNevuReviews(itemID: string, userID?: string): Promise<PerPlexed.Reviews.Review[]> {
    const res = await axios.get(`${getBackendURL()}/reviews`, {
        params: {
            itemID,
            ...userID ? { userID } : {}
        }, 
        headers: {
            'Content-Type': 'application/json',
            'x-plex-token': localStorage.getItem("accAccessToken") || ""
        }
    }).catch((error: AxiosError) => {
        console.error("Failed to fetch Nevu reviews:", error);
        return error.response || { data: { error: "Failed to fetch reviews" } };
    });

    return res.data;
}

export async function updateNevuReview(
    itemID: string,
    rating: number,
    message: string,
    visibility: "GLOBAL" | "LOCAL",
    spoilers: boolean
): Promise<PerPlexed.Reviews.ReviewResponse | null> {
    const res = await axios.post(`${getBackendURL()}/reviews`, {
        itemID,
        rating,
        message,
        visibility,
        spoilers
    }, {
        headers: {
            'Content-Type': 'application/json',
            'x-plex-token': localStorage.getItem("accAccessToken") || ""
        }
    }).catch((error: AxiosError) => {
        console.error("Failed to update Nevu review:", error);
        return error.response || { data: { error: "Failed to update review" } };
    });

    return res.data;
}

export async function deleteNevuReview(itemID: string, visibility: "GLOBAL" | "LOCAL"): Promise<void> {
    const res = await axios.delete(`${getBackendURL()}/reviews`, {
        params: {
            itemID,
            visibility
        },
        headers: {
            'Content-Type': 'application/json',
            'x-plex-token': localStorage.getItem("accAccessToken") || ""
        }
    }).catch((error: AxiosError) => {
        console.error("Failed to delete Nevu review:", error);
        return error.response || { data: { error: "Failed to delete review" } };
    });

    return res.data;
}