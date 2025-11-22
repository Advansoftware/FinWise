
// src/app/api/auth/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {getAuthService, getDatabaseAdapter} from '@/core/services/service-factory';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    const auth = await getAuthService();

    switch (action) {
      case 'login':
        const { email, password } = body;
        const loginResult = await auth.signIn({ email, password });
        return NextResponse.json(loginResult);

      case 'signup':
        const { email: signupEmail, password: signupPassword, name } = body;
        const signupResult = await auth.signUp({
          email: signupEmail,
          password: signupPassword,
          displayName: name
        });
        return NextResponse.json(signupResult);

      case 'logout':
        await auth.signOut();
        return NextResponse.json({ success: true });

      case 'getCurrentUser':
        const currentUser = await auth.getCurrentUser();
        return NextResponse.json(currentUser);

      case 'updateUser':
        const { userId, updates } = body;
        const db = await getDatabaseAdapter();
        await db.users.update(userId, updates);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Auth operation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
