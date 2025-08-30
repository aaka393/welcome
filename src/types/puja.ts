export interface PujaSegment {
  id?: string;
  pujaType: string;
  segmentType: string;
  sequenceOrder: number;
  isDynamic: boolean;
  defaultVideoUrl: string;
  textScript: string;
  durationSeconds: number;
}

export interface CreatePujaSegmentRequest {
  pujaType: string;
  segmentType: string;
  sequenceOrder: number;
  isDynamic: boolean;
  defaultVideoUrl: string;
  textScript: string;
  durationSeconds: number;
}

export interface PujaSegmentResponse {
  success: boolean;
  data?: PujaSegment;
  error?: string;
}