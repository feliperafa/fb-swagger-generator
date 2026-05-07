import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/app/lib/github';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubToken } = body;

    if (!githubToken) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'GitHub token is required',
        },
        { status: 400 }
      );
    }

    // Test the token by making a simple API call
    const client = new GitHubClient(githubToken);
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid GitHub token',
        },
        { status: 401 }
      );
    }

    const userData = await response.json();

    return NextResponse.json(
      {
        status: 'success',
        message: 'Token is valid',
        user: userData.login,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: `Error validating token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
