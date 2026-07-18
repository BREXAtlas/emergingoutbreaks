import { readFile } from "node:fs/promises";

const path = new URL("../public/data/live.json", import.meta.url);
const data = JSON.parse(await readFile(path, "utf8"));
const errors = [];

if (!Number.isInteger(data?.national?.confirmedDomestic) || data.national.confirmedDomestic < 0) {
  errors.push("national.confirmedDomestic must be a non-negative integer");
}
if (!Number.isInteger(data?.national?.statesReporting) || data.national.statesReporting > 56) {
  errors.push("national.statesReporting must be an integer no greater than 56");
}
if (!data?.national?.sourceUrl?.startsWith("https://www.cdc.gov/")) {
  errors.push("national count must retain a CDC source URL");
}
if (!data?.linkedOutbreak?.sourceUrl?.startsWith("https://www.fda.gov/")) {
  errors.push("linked outbreak must retain an FDA source URL");
}
if (!Array.isArray(data?.mapSignals) || data.mapSignals.length < 5) {
  errors.push("mapSignals must contain at least five public geographic signals");
}
if (!["low", "medium", "high"].includes(data?.alert?.level)) {
  errors.push("alert.level must be low, medium, or high");
}
if (!data?.blog?.window || !Array.isArray(data?.blog?.paragraphs)) {
  errors.push("daily News in Reverse entry is missing");
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(
  `live data valid: ${data.national.confirmedDomestic.toLocaleString()} confirmed cases, ${data.mapSignals.length} map signals`,
);
