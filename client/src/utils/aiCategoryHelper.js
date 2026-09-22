// src/utils/aiCategoryHelper.js
const KEYWORD_MAP = [
  {
    category: "Emergency SOS",
    keywords: ["spark", "fire", "live wire", "blast", "gas leak", "collapse", "current", "bijli ka tar", "aag", "urgent danger", "cylinder"],
    urgency: "EMERGENCY",
  },
  {
    category: "Water Supply",
    keywords: ["water", "pipe", "leak", "pani", "tap", "pipeline", "drainage overflow", "dirty water", "no water", "jal"],
    urgency: "High",
  },
  {
    category: "Electricity",
    keywords: ["power", "electricity", "meter", "voltage", "blackout", "transformer", "bijli", "short circuit", "feeder"],
    urgency: "High",
  },
  {
    category: "Roads",
    keywords: ["pothole", "gaddha", "road", "sadak", "pavement", "crack", "tar", "footpath", "divider", "manhole open"],
    urgency: "Normal",
  },
  {
    category: "Street Lights",
    keywords: ["street light", "light pole", "dark street", "andhera", "bulb", "lamp"],
    urgency: "Normal",
  },
  {
    category: "Sanitation",
    keywords: ["garbage", "trash", "kachra", "dustbin", "dead animal", "sewage", "gutter", "smell", "safai", "safai karamchari"],
    urgency: "Normal",
  },
];

export function detectCategoryFromText(text) {
  if (!text || text.trim().length < 3) return null;
  const lower = text.toLowerCase();

  for (const group of KEYWORD_MAP) {
    for (const kw of group.keywords) {
      if (lower.includes(kw)) {
        return {
          suggestedCategory: group.category,
          suggestedUrgency: group.urgency,
          matchedKeyword: kw,
        };
      }
    }
  }
  return null;
}
