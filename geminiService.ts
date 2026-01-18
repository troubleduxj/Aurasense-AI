
import { GoogleGenAI, Type } from "@google/genai";
import { Device, DiagnosticReport } from "./types";

export const getDeviceDiagnostic = async (device: Device): Promise<DiagnosticReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Dynamic Metric Extraction for Prompt
  const metricsDescription = Object.entries(device.metrics)
    .map(([key, history]) => {
      const recentValues = history.slice(-5).map(m => m.value).join(', ');
      return `${key.toUpperCase()}: [${recentValues}]`;
    })
    .join('\n');

  const prompt = `Analyze the following IoT device telemetry and provide a diagnostic report.
  
  Device Information:
  - Name: ${device.name}
  - Type: ${device.type}
  - Status: ${device.status}
  
  Current Metrics (Recent Values):
  ${metricsDescription}

  Identify potential hardware failure, abnormal patterns, overheating, or performance bottlenecks based on the device type and metrics provided.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { 
              type: Type.STRING, 
              enum: ['Healthy', 'Risk', 'Critical'],
              description: 'Overall health status'
            },
            summary: { 
              type: Type.STRING, 
              description: 'A brief summary of the device condition'
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'List of actionable steps'
            },
            anomaliesFound: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'List of specific detected anomalies'
            }
          },
          required: ["status", "summary", "recommendations", "anomaliesFound"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as DiagnosticReport;
  } catch (error) {
    console.error("AI Diagnostic failed:", error);
    return {
      status: 'Risk',
      summary: 'AI analysis unavailable. Manual inspection recommended.',
      recommendations: ['Check power supply', 'Verify network connectivity'],
      anomaliesFound: ['Connection to diagnostic server timed out']
    };
  }
};
