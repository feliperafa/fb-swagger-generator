import { GitHubRepo } from '@/app/types';

export class GitHubClient {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string) {
    if (!token) {
      throw new Error('GitHub token is required');
    }
    this.token = token;
  }

  private async request(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;

      if (response.status === 401) {
        errorMessage = 'Unauthorized: Token is invalid or expired. Check your GitHub token.';
      } else if (response.status === 403) {
        errorMessage = 'Forbidden: Your token does not have permission to access this resource. This may be a corporate repo requiring additional authentication (SAML/SSO).';
      } else if (response.status === 404) {
        errorMessage = 'Not found: Organization or repository does not exist.';
      }

      try {
        const body = await response.json();
        if (body.message) {
          errorMessage = `${errorMessage} - ${body.message}`;
        }
      } catch {
        // Response is not JSON, use default error message
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  async listRepositoriesByOrg(orgName: string, prefix: string): Promise<GitHubRepo[]> {
    try {
      const repos = await this.request(`/orgs/${orgName}/repos?type=all&per_page=100`);
      return repos.filter((repo: GitHubRepo) => repo.name.startsWith(prefix));
    } catch (error) {
      throw new Error(`Failed to list repositories: ${error}`);
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      });

      if (!response.ok) {
        return '';
      }

      return response.text();
    } catch {
      return '';
    }
  }

  async listFilesInDirectory(
    owner: string,
    repo: string,
    path: string,
    filePattern: string
  ): Promise<string[]> {
    try {
      const files: string[] = [];
      const regex = new RegExp(filePattern);

      const response = await this.request(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);

      if (response.tree) {
        response.tree.forEach((item: any) => {
          if (item.type === 'blob' && regex.test(item.path)) {
            files.push(item.path);
          }
        });
      }

      return files;
    } catch {
      return [];
    }
  }
}
