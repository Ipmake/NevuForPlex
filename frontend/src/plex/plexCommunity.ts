import axios from "axios";
import { useUserSessionStore } from "../states/UserSession";

export namespace PlexCommunity {
    export interface ReviewsResponse {
        data: ReviewsData;
    }

    export interface ReviewsData {
        userReview: ActivityReview | null;
        friendReviews: ReviewsSection;
        hotReviews: ReviewsSection;
        otherReviews: ReviewsSection;
        recentReviews: ReviewsSection;
        topReviews: ReviewsSection;
    }

    export interface ReviewsSection {
        nodes: ActivityReview[];
        pageInfo: PageInfo;
        title: string;
    }

    export interface PageInfo {
        hasNextPage: boolean;
    }

    export type ActivityPrivacy = "GLOBAL" | "NEVU";

    export interface ActivityReview {
        __typename: "ActivityReview";
        commentCount: number;
        date: string;
        id: string;
        isMuted: boolean;
        isPrimary: boolean | null;
        privacy: ActivityPrivacy;
        reaction: string | null;
        reactionsCount: string;
        reactionsTypes: string[];
        metadataItem: MetadataItem;
        userV2: UserV2;
        reviewRating: number;
        hasSpoilers: boolean;
        message: string;
        updatedAt: string | null;
        status: "PUBLISHED" | string;
    }

    export interface ActivityRating {
        __typename: "ActivityRating";
        commentCount: number;
        date: string;
        id: string;
        isMuted: boolean;
        isPrimary: boolean | null;
        privacy: ActivityPrivacy;
        reaction: string | null;
        reactionsCount: string;
        reactionsTypes: string[];
        metadataItem: MetadataItem;
        userV2: UserV2;
        rating: number;
        reviewRating?: number; // Optional, used in reviews
        hasSpoilers?: boolean;
        message?: string;
    }

    export interface ActivityRatingUpdateResponse {
        data?: unknown;
        errors?: {
            message: string;
            locations: { line: number; column: number }[];
        }[];
    }

    export interface MetadataImages {
        coverArt: string;
        coverPoster: string;
        thumbnail: string;
        art: string;
    }

    export interface UserState {
        viewCount: number;
        viewedLeafCount: number;
        watchlistedAt: string | null;
    }

    export interface MetadataItem {
        id: string;
        images: MetadataImages;
        userState: UserState;
        title: string;
        key: string;
        type: "SHOW" | "MOVIE" | string;
        index: number;
        publicPagesURL: string;
        parent: any | null; // TOTYPE
        grandparent: any | null; // TOTYPE
        publishedAt: string;
        leafCount: number;
        year: number;
        originallyAvailableAt: string;
        childCount: number;
    }

    export interface MutualFriends {
        count: number;
        friends: any[];
    }

    export interface UserV2 {
        id: string;
        username: string;
        displayName: string;
        avatar: string;
        friendStatus: string | null;
        isMuted: boolean;
        isHidden: boolean;
        isBlocked: boolean;
        mutualFriends: MutualFriends;
    }

    export async function getUserReviews(metadataID: string): Promise<ReviewsData | null> {
        try {
            const res = await axios.post("https://community.plex.tv/api", {
                variables: {
                    metadataID: metadataID
                },
                operationName: "getRatingsAndReviewsPageData",
                query: "query getRatingsAndReviewsPageData($metadataID: ID!, $skipUserState: Boolean = false) {  userReview: metadataReviewV2(    metadata: {id: $metadataID}    ignoreFutureMetadata: true  ) {    ... on ActivityRating {      ...ActivityRatingFragment    }    ... on ActivityWatchRating {      ...ActivityWatchRatingFragment    }    ... on ActivityReview {      ...ActivityReviewFragment    }    ... on ActivityWatchReview {      ...ActivityWatchReviewFragment    }  }  friendReviews: metadataReviewsV2(    metadata: {id: $metadataID}    type: FRIENDS    first: 25    after: null    last: null    before: null  ) {    nodes {      ... on ActivityRating {        ...ActivityRatingFragment      }      ... on ActivityReview {        ...ActivityReviewFragment      }      ... on ActivityWatchRating {        ...ActivityWatchRatingFragment      }      ... on ActivityWatchReview {        ...ActivityWatchReviewFragment      }    }    pageInfo {      hasNextPage    }    title  }  hotReviews: metadataReviewsV2(    metadata: {id: $metadataID}    type: HOT    first: 25    after: null    last: null    before: null  ) {    nodes {      ... on ActivityRating {        ...ActivityRatingFragment      }      ... on ActivityReview {        ...ActivityReviewFragment      }      ... on ActivityWatchRating {        ...ActivityWatchRatingFragment      }      ... on ActivityWatchReview {        ...ActivityWatchReviewFragment      }    }    pageInfo {      hasNextPage    }    title  }  otherReviews: metadataReviewsV2(    metadata: {id: $metadataID}    type: OTHER    first: 25    after: null    last: null    before: null  ) {    nodes {      ... on ActivityRating {        ...ActivityRatingFragment      }      ... on ActivityReview {        ...ActivityReviewFragment      }      ... on ActivityWatchRating {        ...ActivityWatchRatingFragment      }      ... on ActivityWatchReview {        ...ActivityWatchReviewFragment      }    }    pageInfo {      hasNextPage    }    title  }  recentReviews: metadataReviewsV2(    metadata: {id: $metadataID}    type: RECENT    first: 25    after: null    last: null    before: null  ) {    nodes {      ... on ActivityRating {        ...ActivityRatingFragment      }      ... on ActivityReview {        ...ActivityReviewFragment      }      ... on ActivityWatchRating {        ...ActivityWatchRatingFragment      }      ... on ActivityWatchReview {        ...ActivityWatchReviewFragment      }    }    pageInfo {      hasNextPage    }    title  }  topReviews: metadataReviewsV2(    metadata: {id: $metadataID}    type: TOP    first: 25    after: null    last: null    before: null  ) {    nodes {      ... on ActivityRating {        ...ActivityRatingFragment      }      ... on ActivityReview {        ...ActivityReviewFragment      }      ... on ActivityWatchRating {        ...ActivityWatchRatingFragment      }      ... on ActivityWatchReview {        ...ActivityWatchReviewFragment      }    }    pageInfo {      hasNextPage    }    title  }}        fragment ActivityRatingFragment on ActivityRating {  ...activityFragment  rating}        fragment activityFragment on Activity {  __typename  commentCount  date  id  isMuted  isPrimary  privacy  reaction  reactionsCount  reactionsTypes  metadataItem {    ...itemFields  }  userV2 {    id    username    displayName    avatar    friendStatus    isMuted    isHidden    isBlocked    mutualFriends {      count      friends {        avatar        displayName        id        username      }    }  }}        fragment itemFields on MetadataItem {  id  images {    coverArt    coverPoster    thumbnail    art  }  userState @skip(if: $skipUserState) {    viewCount    viewedLeafCount    watchlistedAt  }  title  key  type  index  publicPagesURL  parent {    ...parentFields  }  grandparent {    ...parentFields  }  publishedAt  leafCount  year  originallyAvailableAt  childCount}        fragment parentFields on MetadataItem {  index  title  publishedAt  key  type  images {    coverArt    coverPoster    thumbnail    art  }  userState @skip(if: $skipUserState) {    viewCount    viewedLeafCount    watchlistedAt  }}        fragment ActivityWatchRatingFragment on ActivityWatchRating {  ...activityFragment  rating}        fragment ActivityReviewFragment on ActivityReview {  ...activityFragment  reviewRating: rating  hasSpoilers  message  updatedAt  status  updatedAt}        fragment ActivityWatchReviewFragment on ActivityWatchReview {  ...activityFragment  reviewRating: rating  hasSpoilers  message  updatedAt  status  updatedAt}" // Fuck you Plex
            }, {
                headers: {
                    "x-plex-token": useUserSessionStore.getState().user?.authToken
                }
            })

            return res.data.data;
        } catch (error) {
            console.error("Error fetching user reviews", error);
            return null;
        }
    }
}