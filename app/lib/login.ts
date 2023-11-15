'use server';

import { sql } from '@vercel/postgres';
import { signIn } from '@/auth';

// Login
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
	await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
	if ((error as Error).message.includes('CredentialsSignin')) {
	  return 'CredentialSignin';
	}
	throw error;
  }
}