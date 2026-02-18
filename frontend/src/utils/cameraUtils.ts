export type CameraPickResult = {
  selectedDeviceId: string | null;
  videoInputs: MediaDeviceInfo[];
};

const BACK_CAMERA_LABEL_REGEX = /back|rear|environment/i;

async function safeEnumerateVideoInputs(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === 'videoinput');
}

export async function pickBestBackCameraDeviceId(): Promise<CameraPickResult> {
  let videoInputs = await safeEnumerateVideoInputs();

  if (videoInputs.length === 0 && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      // If permission is denied, keep empty list and let caller fallback.
    }

    videoInputs = await safeEnumerateVideoInputs();
  }

  if (videoInputs.length === 0) {
    return { selectedDeviceId: null, videoInputs };
  }

  const prioritized = videoInputs.find((device) => BACK_CAMERA_LABEL_REGEX.test(device.label));
  const selected = prioritized ?? videoInputs[videoInputs.length - 1];

  return {
    selectedDeviceId: selected?.deviceId ?? null,
    videoInputs,
  };
}
