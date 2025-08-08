import { reviewCode } from "./ai";
import { notifySlack } from "./slack";

class SimpleGitHub {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Slack-MVP-Bot'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getFileContent(owner: string, repo: string, path: string, ref: string) {
    return this.request(`/repos/${owner}/${repo}/contents/${path}?ref=${ref}`);
  }
}

const github = new SimpleGitHub(process.env.GITHUB_TOKEN!);

type PushPayload = {
  repository: { name: string; owner: { login: string } };
  commits: Array<{
    id: string;
    added: string[];
    modified: string[];
  }>;
};

export async function handlePushEvent(payload: PushPayload): Promise<void> {
  if (!payload.repository || !payload.repository.name || !payload.repository.owner) {
    console.log("Invalid payload structure, skipping processing");
    return;
  }
  
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;

  for (const commit of payload.commits ?? []) {
    const changedFiles = [...(commit.added || []), ...(commit.modified || [])];
    
    for (const filePath of changedFiles) {
      try {
        const data = await github.getFileContent(owner, repo, filePath, commit.id);

        let content = "";
        if (!Array.isArray(data) && "content" in data && data.content) {
          content = Buffer.from(data.content, "base64").toString("utf-8");
        }

        let rulesText = "";
        try {
          const fs = require('fs');
          const path = require('path');
          const rulesPath = path.join(process.cwd(), 'rules.docx');
          console.log('Looking for rules file at:', rulesPath);
          
          if (fs.existsSync(rulesPath)) {
            console.log('Rules file found, parsing...');
            const { parseDocx } = require('../utils/parseDocx');
            rulesText = await parseDocx(rulesPath);
            console.log('Rules loaded successfully, length:', rulesText.length);
          } else {
            console.log('Rules file not found at:', rulesPath);
          }
        } catch (error) {
          console.log('Error loading rules file:', error);
        }
        
        const review = await reviewCode(filePath, content, rulesText);
        console.log(`Review for ${filePath}:\n${review}`);
        
        // Send review to Slack
        if (review && review.trim()) {
          const slackMessage = `🔍 *Code Review for ${filePath}*\n\n${review}`;
          try {
            await notifySlack(slackMessage);
            console.log(`Review sent to Slack for ${filePath}`);
          } catch (error) {
            console.error(`Failed to send review to Slack for ${filePath}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    }
  }
}