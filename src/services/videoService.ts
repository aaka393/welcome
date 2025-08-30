import axios from "axios";
import { serviceBaseUrl } from "../constants/appConstants";
import { PujaSegment, PujaPlaybackResponse, MediaSegment } from "../types/video";

interface BackendPujaPlaybackListResponse {
  code: number;
  message: string;
  result?: PujaPlaybackResponse[];
}

// Mock service for puja segments - replace with actual API calls
export const videoService = {

  // Fetch puja playback data for a given bookingId
  async getPujaPlayback(bookingId: string): Promise<PujaPlaybackResponse> {
    if (!bookingId) {
      throw new Error("bookingId is required to fetch puja playbacks");
    }

    const res = await axios.get<BackendPujaPlaybackListResponse>(
      `${serviceBaseUrl}/puja-playbacks`,
      { params: { bookingId } }
    );

    if (res.data.code === 3062 && Array.isArray(res.data.result) && res.data.result.length > 0) {
      // If multiple playbacks exist, return the first one for now.
      // Backend can later add ordering if needed.
      return res.data.result[0];
    }

    const msg = res.data.message || "No puja playbacks found for this booking";
    throw new Error(msg);
  },

  async getPujaSegments(bookingId: string): Promise<PujaSegment[]> {
    const playbackResponse = await this.getPujaPlayback(bookingId);

    // Filter only video segments and convert to PujaSegment format
    const videoSegments = playbackResponse.segments
      .filter(
        (segment: MediaSegment) => segment.mediaType === "video" && segment.url
      )
      .sort(
        (a: MediaSegment, b: MediaSegment) =>
          (a.sequenceOrder || 0) - (b.sequenceOrder || 0)
      )
      .map(
        (segment: MediaSegment, index: number): PujaSegment => ({
          id: `${playbackResponse.id}-segment-${
            segment.sequenceOrder || index + 1
          }`,
          url: segment.url!,
          order: segment.sequenceOrder || index + 1,
          duration: segment.durationSeconds || 0,
          title: `${playbackResponse.pujaType} - Part ${
            segment.sequenceOrder || index + 1
          }`,
        })
      );

    return videoSegments;
  },
  async downloadSegment(url: string): Promise<Blob> {
    const resolvedUrl = url;
    console.log(`Attempting to download: ${resolvedUrl}`);

    const maxAttempts = 3;
    const baseDelayMs = 400;

    const shouldAbortRetry = (status: number) =>
      [400, 401, 403, 404].includes(status);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout per attempt

      try {
        const response = await fetch(resolvedUrl, {
          method: "GET",
          redirect: "follow",
          credentials: "omit",
          signal: controller.signal,
          // Note: Google Drive often blocks CORS for fetch; we'll detect and surface helpful errors
          headers: {
            // Hint to prefer binary content when possible
            Accept: "video/*,application/octet-stream;q=0.9,*/*;q=0.8",
          },
        });
        clearTimeout(timeout);
        console.log(
          `Fetch response status: ${response.status} ${response.statusText} (attempt ${attempt}/${maxAttempts})`
        );

        if (!response.ok) {
          if (shouldAbortRetry(response.status)) {
            throw new Error(
              `Download blocked (${response.status}). The file may be private or blocked by Google Drive for direct download.`
            );
          }
          // Retry on transient errors (e.g., 429/5xx)
          throw new Error(`Transient download error (${response.status}).`);
        }

        const contentType = response.headers.get("Content-Type") || "";
        // If we get HTML, it's likely a Google Drive interstitial/forbidden page -> treat as error
        if (contentType.includes("text/html")) {
          throw new Error(
            "Received HTML instead of media. Likely a Google Drive confirmation or forbidden page."
          );
        }

        const blob = await response.blob();
        console.log(
          `Successfully downloaded blob, size: ${blob.size} bytes, type: ${blob.type}`
        );

        // Fix missing/ambiguous MIME types for mp4
        const finalType =
          contentType || blob.type || "application/octet-stream";
        if (!finalType.startsWith("video/")) {
          const videoBlob = new Blob([blob], { type: "video/mp4" });
          console.log(
            `Adjusted MIME type from '${blob.type || finalType}' to 'video/mp4'`
          );
          return videoBlob;
        }
        return blob;
      } catch (error: unknown) {
        clearTimeout(timeout);
        const isAbort =
          (error as { name?: string } | null | undefined)?.name ===
          "AbortError";
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(`Download attempt ${attempt} failed: ${msg}`);

        // Abort retries for known non-retryable cases
        if (
          msg.includes("blocked") ||
          msg.includes("forbidden") ||
          msg.includes("HTML instead of media") ||
          isAbort
        ) {
          console.error(`Aborting download: ${msg}`);
          throw new Error(
            "Unable to download from Google Drive in the browser. The file might be private or blocked. Please make the file public or serve it from a CORS-enabled host."
          );
        }

        if (attempt < maxAttempts) {
          const delay = Math.round(
            baseDelayMs * Math.pow(1.8, attempt - 1) + Math.random() * 150
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(
          "Failed to download after multiple attempts. Please try again later."
        );
      }
    }

    // Should not reach here
    throw new Error("Unknown download error");
  },
};
