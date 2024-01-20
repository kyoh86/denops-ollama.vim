export function trimAroundCode(content: string): string {
  const lines = content.split("\n");
  while (lines.length > 1 && lines[0] !== "```") {
    lines.shift();
  }
  lines.shift();
  for (let l = 0; l < lines.length; l++) {
    if (lines[l] === "```") {
      return lines.slice(0, l).join("\n");
    }
  }
  return lines.join("\n");
}
