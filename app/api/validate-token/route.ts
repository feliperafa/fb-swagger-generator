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
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Invalid GitHub token';

      if (response.status === 401) {
        errorMessage = 'Token is invalid or expired. Please check your GitHub token.';
      } else if (response.status === 403) {
        errorMessage = 'Token does not have required permissions. For corporate repos, you may need a token with specific SAML/SSO permissions, or the token may lack repository access.';
      }

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = `${errorMessage} (${errorData.message})`;
        }
      } catch {
        // Response is not JSON
      }

      return NextResponse.json(
        {
          status: 'error',
          message: errorMessage,
        },
        { status: response.status }
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
