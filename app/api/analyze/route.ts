import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { GitHubClient } from '@/app/lib/github';
import { JavaControllerParser } from '@/app/lib/javaParser';
import { OpenAPIGenerator } from '@/app/lib/openAPIGenerator';
import { RepositoryAnalysis } from '@/app/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get token from session
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Unauthorized: Please sign in with GitHub first',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orgUrl, teamPrefix } = body;

    if (!orgUrl || !teamPrefix) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required fields: orgUrl, teamPrefix',
        },
        { status: 400 }
      );
    }

    const githubToken = session.accessToken;

    // Extract organization name from URL
    const orgMatch = orgUrl.match(/github\.com\/([^/]+)\/?$/);
    if (!orgMatch) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid GitHub URL format. Expected: https://github.com/orgname',
        },
        { status: 400 }
      );
    }

    const orgName = orgMatch[1];

    // Initialize GitHub client
    const githubClient = new GitHubClient(githubToken);

    // List repositories (both organization and user personal repos)
    const repos = await githubClient.listRepositoriesByOrgAndUser(orgName, teamPrefix);

    if (repos.length === 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: `No repositories found with prefix "${teamPrefix}" in organization "${orgName}"`,
        },
        { status: 404 }
      );
    }

    // Analyze each repository
    const parser = new JavaControllerParser();
    const repositoryAnalyses: RepositoryAnalysis[] = [];

    for (const repo of repos) {
      try {
        // Find Java controller files
        const javaFiles = await githubClient.listFilesInDirectory(
          orgName,
          repo.name,
          'src/main/java',
          '.*Controller\\.java$'
        );

        const endpoints = [];

        // Parse each controller file
        for (const filePath of javaFiles) {
          const content = await githubClient.getFileContent(orgName, repo.name, filePath);
          if (content) {
            const parsedEndpoints = parser.parseControllers(content, filePath);
            endpoints.push(...parsedEndpoints);
          }
        }

        repositoryAnalyses.push({
          repo,
          endpoints,
          hasExistingSwagger: javaFiles.some((f) =>
            f.toLowerCase().includes('swagger') || f.toLowerCase().includes('openapi')
          ),
        });
      } catch (error) {
        console.error(`Error analyzing repository ${repo.name}:`, error);
        repositoryAnalyses.push({
          repo,
          endpoints: [],
          hasExistingSwagger: false,
        });
      }
    }

    // Generate OpenAPI spec
    const generator = new OpenAPIGenerator();
    const openApiSpec = generator.generateFromRepositories(
      repositoryAnalyses,
      `${teamPrefix.toUpperCase()} API Documentation`
    );

    return NextResponse.json(
      {
        status: 'success',
        message: `Successfully analyzed ${repos.length} repositories`,
        data: openApiSpec,
        repositories: repositoryAnalyses.map((r) => ({
          name: r.repo.name,
          endpoints: r.endpoints.length,
          hasExistingSwagger: r.hasExistingSwagger,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: `An error occurred during analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
