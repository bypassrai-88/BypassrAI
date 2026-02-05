/**
 * RunPod DIPPER Integration
 * Calls the DIPPER paraphraser model hosted on RunPod Serverless
 */

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID; // You'll get this after creating the endpoint

interface DipperRequest {
  text: string;
  lexical_diversity?: number; // 0-100, higher = more word changes
  order_diversity?: number;   // 0-100, higher = more reordering
}

interface DipperResponse {
  paraphrased: string;
  error?: string;
}

interface RunPodResponse {
  id: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  output?: {
    paraphrased?: string;
    error?: string;
  };
  error?: string;
}

/**
 * Call DIPPER model on RunPod Serverless
 * Uses synchronous /runsync endpoint (waits for result)
 */
export async function callDipper(
  text: string,
  options: { lexicalDiversity?: number; orderDiversity?: number } = {}
): Promise<DipperResponse> {
  if (!RUNPOD_API_KEY) {
    throw new Error("RUNPOD_API_KEY not configured");
  }
  if (!RUNPOD_ENDPOINT_ID) {
    throw new Error("RUNPOD_ENDPOINT_ID not configured");
  }

  const { lexicalDiversity = 60, orderDiversity = 40 } = options;

  const requestBody = {
    input: {
      text,
      lex_diversity: lexicalDiversity,
      order_diversity: orderDiversity,
    },
  };

  try {
    // Use runsync for synchronous execution (waits for result)
    const response = await fetch(
      `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/runsync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RunPod API error:", response.status, errorText);
      throw new Error(`RunPod API error: ${response.status}`);
    }

    const result: RunPodResponse = await response.json();

    if (result.status === "FAILED") {
      throw new Error(result.error || "DIPPER processing failed");
    }

    if (result.status === "COMPLETED" && result.output?.paraphrased) {
      return { paraphrased: result.output.paraphrased };
    }

    // If still processing, poll for result (shouldn't happen with runsync but just in case)
    if (result.status === "IN_PROGRESS" || result.status === "IN_QUEUE") {
      return await pollForResult(result.id);
    }

    throw new Error("Unexpected response from DIPPER");
  } catch (error) {
    console.error("DIPPER call failed:", error);
    throw error;
  }
}

/**
 * Poll for async job result (fallback)
 */
async function pollForResult(jobId: string, maxAttempts = 60): Promise<DipperResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

    const response = await fetch(
      `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      continue;
    }

    const result: RunPodResponse = await response.json();

    if (result.status === "COMPLETED" && result.output?.paraphrased) {
      return { paraphrased: result.output.paraphrased };
    }

    if (result.status === "FAILED") {
      throw new Error(result.error || "DIPPER processing failed");
    }
  }

  throw new Error("DIPPER processing timed out");
}

/**
 * Check if DIPPER is configured and available
 */
export function isDipperConfigured(): boolean {
  return Boolean(RUNPOD_API_KEY && RUNPOD_ENDPOINT_ID);
}
