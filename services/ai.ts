import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function reviewCode(
  filePath: string,
  content: string,
  rulesText?: string
): Promise<string> {
  const system =
    "You are a precise code review assistant. Given code and human rules, produce concise issues and actionable fixes with short diffs.";
  const user = `Rules:\n${rulesText ?? "(none)"}\n\nFile: ${filePath}\n\nCode:\n${content}\n\nReturn:\n- Issues (bulleted)\n- Suggested patch (if clear)`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
  });
  return resp.choices[0]?.message?.content ?? "";
}


