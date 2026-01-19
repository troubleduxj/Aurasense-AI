
import { GoogleGenAI, Type } from "@google/genai";
import { Device, DiagnosticReport, Dashboard } from "./types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// ... (keep getDeviceDiagnostic) ...
export const getDeviceDiagnostic = async (device: Device): Promise<DiagnosticReport> => {
  // ... (keep existing implementation) ...
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

// --- New Feature: Text to SQL ---
export const generateSQLFromText = async (nlQuery: string, schemaContext: string): Promise<string> => {
    const prompt = `
    You are an expert SQL architect for a Time-Series Database (TDengine).
    Convert the following natural language request into a valid SQL query.
    
    Database Schema Context:
    ${schemaContext}
    
    User Request: "${nlQuery}"
    
    Rules:
    1. Return ONLY the SQL string. No markdown, no explanations.
    2. Use standard SQL-92 syntax compatible with TDengine (Time-Series DB).
    3. If time range is implied (e.g. "last 24 hours"), use 'WHERE ts > NOW - 24h'.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        return response.text?.replace(/```sql|```/g, '').trim() || '-- Error generating SQL';
    } catch (error) {
        console.error("SQL Gen failed", error);
        return "-- AI Service Error: Could not generate SQL";
    }
};

// --- New Feature: Copilot Chat ---
export const chatWithCopilot = async (
    userMessage: string, 
    systemContext: { devices: Device[], dashboards: Dashboard[] }
): Promise<{ text: string, action?: any }> => {
    
    // Summarize system state for the LLM
    const deviceSummary = systemContext.devices.map(d => `${d.name} (${d.type}): ${d.status}`).join(', ');
    const dashboardList = systemContext.dashboards.map(d => d.name).join(', ');
    const onlineCount = systemContext.devices.filter(d => d.status === 'online').length;
    
    const systemPrompt = `
    You are "AuraSense Copilot", an AI assistant for an industrial IoT platform.
    
    Current System Context:
    - Devices (${systemContext.devices.length} total, ${onlineCount} online): ${deviceSummary}
    - Available Dashboards: ${dashboardList}
    
    Capabilities:
    1. Answer questions about device status.
    2. Suggest navigation. If the user wants to go to a specific page or dashboard, 
       you MUST return a JSON object in your response text like this: 
       <<NAVIGATE:{"target":"inventory"}>> or <<NAVIGATE:{"target":"dashboard_monitor"}>>.
       
    Map for Navigation Targets:
    - "monitor", "realtime", "map" -> "monitor"
    - "inventory", "list", "devices" -> "inventory"
    - "dashboard", "charts" -> "dashboard_monitor"
    - "analysis", "history" -> "history_analysis"
    - "alarm", "alerts" -> "alarm_center"
    
    User Input: "${userMessage}"
    
    Keep responses concise, professional, and helpful.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: systemPrompt,
        });
        
        let text = response.text || "I'm having trouble connecting to the system core.";
        let action = undefined;

        // Parse Action Command
        const navMatch = text.match(/<<NAVIGATE:(.*?)>>/);
        if (navMatch && navMatch[1]) {
            try {
                action = { type: 'navigate', payload: JSON.parse(navMatch[1]) };
                text = text.replace(navMatch[0], '').trim(); // Remove command from visible text
            } catch (e) {
                console.error("Failed to parse nav command");
            }
        }

        return { text, action };

    } catch (error) {
        return { text: "System Error: AI Service Unavailable." };
    }
};

// [V3.3] AI Alarm Suggestions
export const suggestThresholds = async (deviceType: string, metricKey: string) => {
    const prompt = `
    I am configuring an alarm for an industrial IoT device.
    Device Type: "${deviceType}"
    Metric: "${metricKey}"
    
    Please suggest a reasonable "High Warning" threshold value.
    Return a JSON object: { "recommended_threshold": number, "reason": "string" }
    
    Example: For a CPU, 85 is high. For temperature, 80 might be high depending on context.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("AI Suggestion failed", error);
        return { recommended_threshold: 0, reason: "Service unavailable" };
    }
};
