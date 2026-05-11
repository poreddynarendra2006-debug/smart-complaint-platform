import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export async function getUserRole() {
  try {
    await getCurrentUser();

    const session =
      await fetchAuthSession();

    const groups =
      session.tokens?.idToken?.payload[
        'cognito:groups'
      ] as string[] | undefined;

    if (groups?.includes('ADMIN')) {
      return 'ADMIN';
    }

    return 'USER';
  } catch {
    return null;
  }
}